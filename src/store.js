/* ============================================================
   Store — hidrata o singleton DATA a partir da API e notifica
   as views (subscribe/notify). As views continuam lendo DATA
   sincronamente; as escritas passam pelas funções daqui.
   ============================================================ */
import { DATA } from './data.js';
import { api, setToken, clearToken, getToken } from './api.js';

/* ---------------- subscribe / notify ---------------- */
const listeners = new Set();
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const notify = () => listeners.forEach(fn => fn());

/* ---------------- sessão ---------------- */
export async function login(email, senha) {
  const { token, user } = await api.post('/auth/login', { email, senha });
  setToken(token);
  DATA.CURRENT_USER = user;
  await hydrateForUser(user);
  return user;
}

export async function restoreSession() {
  if (!getToken()) return null;
  try {
    const { user } = await api.get('/auth/me');
    DATA.CURRENT_USER = user;
    await hydrateForUser(user);
    return user;
  } catch {
    clearToken();
    return null;
  }
}

export function logout() {
  clearToken();
  DATA.CURRENT_USER = null;
}

/* ---------------- hidratação ---------------- */
export async function hydrateForUser(user) {
  await hydrateMeta();
  // gestor: dados do seu grupo de escolas; demais: escola padrão (e1/t1)
  if (user.perfil === 'gestor') await hydrateGestor(user);
  else await hydrateEscolaAtual();
  // admin e secretaria são superusuários de rede
  if (user.perfil === 'admin' || user.perfil === 'secretaria') {
    await hydrateRede();
    await hydrateGrupos();
  }
  // orientações: secretaria/admin criam; gestor/professor visualizam
  await hydrateOrientacoes();
  notify();
}

export async function hydrateMeta() {
  const m = await api.get('/meta');
  Object.assign(DATA, {
    NIVEIS: m.NIVEIS,
    COMPONENTES: m.COMPONENTES,
    PERIODOS: m.PERIODOS,
    MATRIZES: m.MATRIZES,
    HABILIDADES: m.HABILIDADES,
    habByCod: Object.fromEntries(m.HABILIDADES.map(h => [h.cod, h])),
    PROFESSORES: m.PROFESSORES,
    USUARIOS: m.USUARIOS,
    ESCOLAS: m.ESCOLAS || [],
    ESCOLA: m.ESCOLA,
    REDE: { ...DATA.REDE, ...m.REDE },
  });
}

/** Escola padrão (e1): turmas, alunos da 1A, planejamentos + trabalho, avaliações, timeline */
export async function hydrateEscolaAtual() {
  const [turmas, t1, planejamentos, avaliacoes, timeline] = await Promise.all([
    api.get('/turmas?escola=e1'),
    api.get('/turmas/t1/full'),
    api.get('/planejamentos'),
    api.get('/avaliacoes/turma/t1'),
    api.get('/timeline?limit=30'),
  ]);

  DATA.TURMAS = turmas;
  DATA.ALUNOS = t1.alunos;
  DATA.alunosT1 = t1.alunos;
  DATA.TURMA_ATUAL = t1;
  DATA.ESCOLA_ATUAL = ['e1'];
  DATA.PLANEJAMENTOS = planejamentos;
  DATA.TIMELINE = timeline;

  DATA.AVALIACOES = avaliacoes;
  t1.alunos.forEach(a => { if (!DATA.AVALIACOES[a.id]) DATA.AVALIACOES[a.id] = {}; });

  // trabalho + semanas de cada planejamento (mantém PlanDetail/painéis síncronos)
  const detalhes = await Promise.all(planejamentos.map(pl => api.get('/planejamentos/' + pl.id)));
  DATA.TRABALHO = Object.fromEntries(detalhes.map(d => [d.id, d.trabalho]));
  DATA.SEMANAS = Object.fromEntries(detalhes.map(d => [d.id, d.semanas || []]));
}

/** Dados do grupo de escolas do gestor: união das turmas/planejamentos do grupo. */
export async function hydrateGestor(user) {
  const escolas = Array.isArray(user.escolaIds) ? user.escolaIds : [];
  DATA.ESCOLA_ATUAL = escolas;

  // turmas de todas as escolas do gestor (o backend já filtra pelo escopo do JWT)
  const turmas = await api.get('/turmas');
  DATA.TURMAS = turmas;

  // turma representativa (1ª) para os widgets de roster da escola
  const turmaRep = turmas[0];
  const full = turmaRep ? await api.get('/turmas/' + turmaRep.id + '/full') : { alunos: [] };
  DATA.ALUNOS = full.alunos;
  DATA.alunosT1 = full.alunos;
  DATA.TURMA_ATUAL = turmaRep ? full : null;

  // planejamentos do grupo (backend filtra) + avaliações da turma representativa
  const [planejamentos, avaliacoes] = await Promise.all([
    api.get('/planejamentos'),
    turmaRep ? api.get('/avaliacoes/turma/' + turmaRep.id) : Promise.resolve({}),
  ]);
  DATA.PLANEJAMENTOS = planejamentos;
  DATA.AVALIACOES = avaliacoes;
  full.alunos.forEach(a => { if (!DATA.AVALIACOES[a.id]) DATA.AVALIACOES[a.id] = {}; });

  DATA.TIMELINE = await api.get('/timeline?limit=30');

  // trabalho + semanas de cada planejamento (mantém PlanDetail/painéis síncronos)
  const detalhes = await Promise.all(planejamentos.map(pl => api.get('/planejamentos/' + pl.id)));
  DATA.TRABALHO = Object.fromEntries(detalhes.map(d => [d.id, d.trabalho]));
  DATA.SEMANAS = Object.fromEntries(detalhes.map(d => [d.id, d.semanas || []]));
}

export async function hydratePlano(id) {
  const d = await api.get('/planejamentos/' + id);
  DATA.TRABALHO[id] = d.trabalho;
  DATA.SEMANAS[id] = d.semanas || [];
  const i = DATA.PLANEJAMENTOS.findIndex(p => p.id === id);
  if (i >= 0) DATA.PLANEJAMENTOS[i] = { ...DATA.PLANEJAMENTOS[i], ...d, trabalho: undefined, semanas: undefined };
  notify();
}

/** Rede completa (admin): escolas com turmas+alunos, agregado da rede */
export async function hydrateRede() {
  const [escolas, rede] = await Promise.all([
    api.get('/escolas?detalhe=alunos'),
    api.get('/rede'),
  ]);
  DATA._escolas = escolas;
  DATA._rede = rede;
  DATA.escolasFull = () => DATA._escolas;
  DATA.escola = id => DATA._escolas.find(e => e.id === id);
  DATA.rede = () => DATA._rede;
}

/* ---------------- escritas ---------------- */

/** Verificação contínua em lote: { planejamentoId, habCod, data, marks } */
export async function registrarAvaliacaoLote(payload) {
  await api.post('/avaliacoes/lote', payload);
  const turmaId = payload.turmaId || (DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id) || 't1';
  const [avaliacoes] = await Promise.all([
    api.get('/avaliacoes/turma/' + turmaId),
    hydratePlano(payload.planejamentoId),
  ]);
  // mantém o global em sincronia quando a turma avaliada é a representativa
  if (turmaId === ((DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id) || 't1')) {
    DATA.AVALIACOES = avaliacoes;
    (DATA.alunosT1 || []).forEach(a => { if (!DATA.AVALIACOES[a.id]) DATA.AVALIACOES[a.id] = {}; });
  }
  DATA.TIMELINE = await api.get('/timeline?limit=30');
  notify();
  return avaliacoes; // a tela usa para atualizar a turma selecionada
}

/** Registro de nível de leitura: { data, registros: [{alunoId, nivel}] } */
export async function registrarLeituraLote(payload) {
  await api.post('/leitura/lote', payload);
  // recarrega a turma avaliada (o professor pode estar em várias) p/ consistência
  const turmaId = payload.turmaId || (DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id) || 't1';
  const t = await api.get('/turmas/' + turmaId + '/full');
  if (turmaId === ((DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id) || 't1')) {
    DATA.ALUNOS = t.alunos;
    DATA.alunosT1 = t.alunos;
  }
  DATA.TIMELINE = await api.get('/timeline?limit=30');
  notify();
  return t.alunos;
}

/** Atividades/recursos/status de uma habilidade do planejamento */
export async function salvarTrabalho(planejamentoId, habCod, payload) {
  const t = await api.patch(`/planejamentos/${planejamentoId}/trabalho/${habCod}`, payload);
  if (DATA.TRABALHO[planejamentoId]) DATA.TRABALHO[planejamentoId][habCod] = t;
  notify();
}

/** Novo planejamento mensal (secretaria): mês + habilidades + expectativa */
export async function criarPlanejamento(form) {
  const plano = await api.post('/planejamentos', {
    titulo: form.titulo, objetivo: form.objetivo, periodo: form.periodo,
    anos: form.anos || [], grupo: form.grupo || null,
    habilidades: form.habs,
  });
  DATA.PLANEJAMENTOS = [...DATA.PLANEJAMENTOS, plano];
  DATA.TRABALHO[plano.id] = Object.fromEntries(plano.habilidades.map(c =>
    [c, { status: 'pendente', avaliacoes: 0, proxima: null, atividades: [], recursos: '', ultima: null }]));
  DATA.SEMANAS[plano.id] = [];
  notify();
  return plano;
}

/** Editar/arquivar planejamento (secretaria): { titulo?, objetivo?, status?, periodo?, habilidades? } */
export async function atualizarPlanejamento(id, payload) {
  const d = await api.patch('/planejamentos/' + id, payload);
  const i = DATA.PLANEJAMENTOS.findIndex(p => p.id === id);
  if (i >= 0) DATA.PLANEJAMENTOS[i] = { ...DATA.PLANEJAMENTOS[i], ...d };
  notify();
  return d;
}

/** Salva as sequências semanais do professor: [{ semana, sequenciaDidatica, recursosDidaticos, verificacaoAprendizagem, referencias }] */
export async function salvarSemanas(planejamentoId, semanas) {
  const saved = await api.post(`/planejamentos/${planejamentoId}/semanas`, { semanas });
  // mescla: mantém semanas de outros professores, substitui as do professor logado
  const prof = DATA.CURRENT_USER?.profId;
  const outras = (DATA.SEMANAS[planejamentoId] || []).filter(s => s.prof !== prof);
  DATA.SEMANAS[planejamentoId] = [...outras, ...saved];
  notify();
  return saved;
}

/* ---------------- orientações + trilhas ---------------- */

export async function hydrateOrientacoes() {
  DATA.ORIENTACOES = await api.get('/orientacoes');
}

/** Nova orientação (gestor) */
export async function criarOrientacao(form) {
  const o = await api.post('/orientacoes', {
    titulo: form.titulo, objetivo: form.objetivo,
    escopo: form.escopo, escolaIds: form.escolaIds, anos: form.anos,
    comp: form.comp || null, modoGeral: form.modoGeral,
    habilidades: form.modoGeral ? [] : form.habilidades,
    periodo: form.periodo || null,
  });
  await hydrateOrientacoes();
  notify();
  return o;
}

/** Arquivar/editar orientação (gestor) */
export async function atualizarOrientacao(id, payload) {
  const o = await api.patch('/orientacoes/' + id, payload);
  await hydrateOrientacoes();
  notify();
  return o;
}

/** Salva a trilha do professor para uma orientação: { etapas, observacao, status } */
export async function salvarTrilha(orientacaoId, payload) {
  const t = await api.post(`/orientacoes/${orientacaoId}/trilha`, payload);
  await hydrateOrientacoes();
  notify();
  return t;
}

export const fetchOrientacao = id => api.get('/orientacoes/' + id);

/* ---------------- grupos de escolas (admin/secretaria) ---------------- */

export async function hydrateGrupos() {
  DATA.GRUPOS = await api.get('/grupos');
}

/** Novo grupo de escolas: { nome, cor } */
export async function criarGrupo(payload) {
  const g = await api.post('/grupos', payload);
  await hydrateGrupos();
  notify();
  return g;
}

/** Renomear/recolorir grupo: { nome?, cor? } */
export async function atualizarGrupo(id, payload) {
  const g = await api.patch('/grupos/' + id, payload);
  await hydrateGrupos();
  notify();
  return g;
}

export async function excluirGrupo(id) {
  await api.delete('/grupos/' + id);
  await hydrateGrupos();
  notify();
}

/** Remaneja uma escola para um grupo (grupoId) ou a remove (grupoId = null). */
export async function moverEscola(escolaId, grupoId) {
  await api.patch('/grupos/escola/' + escolaId, { grupoId: grupoId || null });
  await hydrateGrupos();
  notify();
}

/* ---------------- admin ---------------- */
export async function adminCriarUsuario(payload) {
  const u = await api.post('/admin/usuarios', payload);
  DATA.USUARIOS = [...DATA.USUARIOS, u];
  notify();
  return u;
}

export async function adminEditarUsuario(id, payload) {
  const u = await api.patch('/admin/usuarios/' + id, payload);
  DATA.USUARIOS = DATA.USUARIOS.map(x => x.id === id ? u : x);
  notify();
  return u;
}

export async function adminExcluirUsuario(id) {
  await api.delete('/admin/usuarios/' + id);
  DATA.USUARIOS = DATA.USUARIOS.filter(x => x.id !== id);
  notify();
}

export async function adminConfig() {
  return api.get('/admin/config');
}

export async function adminSalvarConfig(payload) {
  await api.patch('/admin/config', payload);
  await hydrateMeta(); // períodos (atual) podem ter mudado
  notify();
}

/* fetch lazy usados nas fichas/drill-down */
export const fetchAlunoFull = id => api.get('/alunos/' + id + '/full');
export const fetchTurmaFull = id => api.get('/turmas/' + id + '/full');
export const fetchAvaliacoesAluno = id => api.get('/avaliacoes?alunoId=' + id);
export const fetchAvaliacoesTurma = id => api.get('/avaliacoes/turma/' + id);

export { DATA };
