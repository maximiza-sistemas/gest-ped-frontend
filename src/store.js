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
export async function login(email, senha, lembrar = true) {
  const { token, user } = await api.post('/auth/login', { email, senha, lembrar });
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
  notify();
}

export async function hydrateMeta() {
  const m = await api.get('/meta');
  Object.assign(DATA, {
    COMPONENTES: m.COMPONENTES,
    PERIODOS: m.PERIODOS,
    MATRIZES: m.MATRIZES,
    HABILIDADES: m.HABILIDADES,
    habByCod: Object.fromEntries(m.HABILIDADES.map(h => [h.cod, h])),
    PROFESSORES: m.PROFESSORES,
    USUARIOS: m.USUARIOS,
    ANOS: m.ANOS || DATA.ANOS,
    ESCOLAS: m.ESCOLAS || [],
    ESCOLA: m.ESCOLA,
    REDE: { ...DATA.REDE, ...m.REDE },
  });
}

/** Contexto padrão: turma representativa dinâmica — a 1ª turma do professor
    logado, ou a 1ª turma disponível (antes era fixo em e1/t1 do seed). */
export async function hydrateEscolaAtual() {
  const [turmas, planejamentos, timeline] = await Promise.all([
    api.get('/turmas'),
    api.get('/planejamentos'),
    api.get('/timeline?limit=30'),
  ]);
  const prof = DATA.CURRENT_USER?.profId
    ? (DATA.PROFESSORES || []).find(p => p.id === DATA.CURRENT_USER.profId)
    : null;
  const turmaRep = (prof?.turmaIds || []).map(id => turmas.find(t => t.id === id)).filter(Boolean)[0]
    || turmas[0] || null;
  const [full, avaliacoes] = turmaRep
    ? await Promise.all([api.get('/turmas/' + turmaRep.id + '/full'), api.get('/avaliacoes/turma/' + turmaRep.id)])
    : [{ alunos: [] }, {}];

  DATA.TURMAS = turmas;
  DATA.ALUNOS = full.alunos;
  DATA.alunosT1 = full.alunos;
  DATA.TURMA_ATUAL = turmaRep ? full : null;
  DATA.ESCOLA_ATUAL = turmaRep ? [turmaRep.escola] : [];
  DATA.PLANEJAMENTOS = planejamentos;
  DATA.TIMELINE = timeline;

  DATA.AVALIACOES = avaliacoes;
  full.alunos.forEach(a => { if (!DATA.AVALIACOES[a.id]) DATA.AVALIACOES[a.id] = {}; });

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

/** Turmas no escopo do usuário (secretaria/admin = rede toda; gestor = grupo) */
export async function fetchTurmas() {
  return api.get('/turmas');
}

/** Diretório de alunos paginado: { escola?, turma?, busca?, limit?, offset? } → { total, alunos } */
export async function fetchAlunos(params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return api.get('/alunos' + (qs ? '?' + qs : ''));
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

/** Verificação contínua em lote: { planejamentoId, habCod, turmaId, data, marks, eventoId? }.
    Sem eventoId cria um evento de acompanhamento; com eventoId CONTINUA o
    evento (os resultados dos alunos são atualizados, sem duplicar — a data é
    somente registro). Devolve { avaliacoes, eventoId }. */
export async function registrarAvaliacaoLote(payload) {
  const res = await api.post('/avaliacoes/lote', payload);
  const turmaId = payload.turmaId || (DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id);
  const [avaliacoes] = await Promise.all([
    api.get('/avaliacoes/turma/' + turmaId),
    hydratePlano(payload.planejamentoId),
  ]);
  // mantém o global em sincronia quando a turma avaliada é a representativa
  if (turmaId === (DATA.TURMA_ATUAL && DATA.TURMA_ATUAL.id)) {
    DATA.AVALIACOES = avaliacoes;
    (DATA.alunosT1 || []).forEach(a => { if (!DATA.AVALIACOES[a.id]) DATA.AVALIACOES[a.id] = {}; });
  }
  DATA.TIMELINE = await api.get('/timeline?limit=30');
  notify();
  return { avaliacoes, eventoId: res.eventoId };
}

/** Eventos de acompanhamento da turma: [{ id, habCod, data, atualizadoEm, avaliados, atingiram }] */
export const fetchEventosTurma = turmaId => api.get('/avaliacoes/eventos?turma=' + encodeURIComponent(turmaId));

/** Marcas atuais de um evento (para completar em outro dia): { ..., marks: {alunoId: 1|2} } */
export const fetchEvento = id => api.get('/avaliacoes/evento/' + id);
// eventos de acompanhamento são imutáveis após a análise — sem edição/exclusão

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
    anos: form.anos || [], grupos: form.grupos || [],
    habilidades: form.habs,
  });
  DATA.PLANEJAMENTOS = [...DATA.PLANEJAMENTOS, plano];
  DATA.TRABALHO[plano.id] = Object.fromEntries(plano.habilidades.map(c =>
    [c, { status: 'pendente', avaliacoes: 0, proxima: null, atividades: [], recursos: '', ultima: null }]));
  DATA.SEMANAS[plano.id] = [];
  notify();
  return plano;
}

/** Editar/arquivar planejamento (secretaria): { titulo?, objetivo?, status?, periodo?, anos?, grupo?, habilidades? } */
export async function atualizarPlanejamento(id, payload) {
  const d = await api.patch('/planejamentos/' + id, payload);
  const i = DATA.PLANEJAMENTOS.findIndex(p => p.id === id);
  if (i >= 0) DATA.PLANEJAMENTOS[i] = { ...DATA.PLANEJAMENTOS[i], ...d };
  // habilidades podem ter mudado → re-hidrata trabalho/semanas deste plano
  await hydratePlano(id);
  return d;
}

/** Apagar planejamento (secretaria) — remove habilidades, trabalhos, semanas e avaliações vinculadas */
export async function excluirPlanejamento(id) {
  await api.delete('/planejamentos/' + id);
  DATA.PLANEJAMENTOS = DATA.PLANEJAMENTOS.filter(p => p.id !== id);
  delete DATA.TRABALHO[id];
  delete DATA.SEMANAS[id];
  notify();
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

/* ---------------- habilidades (catálogo — gestor/secretaria/admin) ---------------- */

/** Nova habilidade no catálogo: { cod, rotulo?, matriz, comp, desc } */
export async function criarHabilidade(payload) {
  const h = await api.post('/habilidades', payload);
  DATA.HABILIDADES = [...DATA.HABILIDADES, h];
  DATA.habByCod = { ...DATA.habByCod, [h.cod]: h };
  notify();
  return h;
}

/* ---------------- componentes curriculares (admin/secretaria) ---------------- */

/** Novo componente curricular: { id, nome } */
export async function criarComponente(payload) {
  const c = await api.post('/componentes', payload);
  DATA.COMPONENTES = [...DATA.COMPONENTES, c];
  notify();
  return c;
}

/** Renomear componente curricular: { nome } */
export async function atualizarComponente(id, payload) {
  const c = await api.patch('/componentes/' + id, payload);
  DATA.COMPONENTES = DATA.COMPONENTES.map(x => x.id === id ? c : x);
  notify();
  return c;
}

export async function excluirComponente(id) {
  await api.delete('/componentes/' + id);
  DATA.COMPONENTES = DATA.COMPONENTES.filter(x => x.id !== id);
  notify();
}

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
  if (u.perfil === 'professor') await hydrateMeta(); // vínculo Professor novo/alterado entra no catálogo
  notify();
  return u;
}

export async function adminEditarUsuario(id, payload) {
  const u = await api.patch('/admin/usuarios/' + id, payload);
  DATA.USUARIOS = DATA.USUARIOS.map(x => x.id === id ? u : x);
  if (u.perfil === 'professor') await hydrateMeta();
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

/* ---------------- anos escolares (séries) — admin/secretaria ---------------- */
export const fetchAnos = () => api.get('/anos');
export async function criarAno(payload) {
  const a = await api.post('/anos', payload);
  await hydrateMeta(); // atualiza DATA.ANOS p/ os seletores
  notify();
  return a;
}
export async function atualizarAno(ordem, payload) {
  const a = await api.patch('/anos/' + ordem, payload);
  await hydrateMeta();
  notify();
  return a;
}
export async function excluirAno(ordem) {
  await api.delete('/anos/' + ordem);
  await hydrateMeta();
  notify();
}

/* escolas/turmas/alunos são espelhados do SAG — somente leitura (sem CRUD local) */

/* fetch lazy usados nas fichas/drill-down */
export const fetchAlunoFull = id => api.get('/alunos/' + id + '/full');
export const fetchTurmaFull = id => api.get('/turmas/' + id + '/full');
export const fetchAvaliacoesAluno = id => api.get('/avaliacoes?alunoId=' + id);
export const fetchAvaliacoesTurma = id => api.get('/avaliacoes/turma/' + id);

export { DATA };
