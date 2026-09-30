/* ============================================================
   DATA — contêiner de dados da aplicação.
   Os dados vêm da API e são hidratados pelo store.js após o
   login; as views continuam lendo DATA sincronamente.
   ============================================================ */

/* Rótulo curto da turma a partir do nome vindo do SAG:
   "3 ANO" → "3º ano" · "1º ANO A" / "8ºANOA" → "1º ano A" / "8º ano A" · "4º A" / "8ºB" / "6A" → "4º ano A" / "8º ano B" / "6º ano A".
   Nomes que não são série numérica (TURMA MULT, Infantil I…, EJA combinada) ficam como estão. */
export const turmaRotulo = nome => {
  const s = String(nome || '').trim().replace(/°/g, 'º');
  const comAno = s.match(/^(\d{1,2})\s*[ºª]?\s*ANOS?\s*(.*)$/i);   // 3 ANO · 1º ANO A · 8ºANOA
  const semAno = s.match(/^(\d{1,2})\s*[ºª]\s*([A-Z]{0,2})$/i);   // 4º A · 8ºB
  const colado = s.match(/^(\d{1,2})\s?([A-Z])$/i);               // 6A · 8 A
  const m = comAno || semAno || colado;
  if (!m) return s;
  const resto = (m[2] || '').trim();
  return `${Number(m[1])}º ano${resto ? ' ' + resto.toUpperCase() : ''}`;
};

const RES_LABEL = { 1: 'Não atingiu', 2: 'Atingiu' };
const RES_COR   = { 1: 'red', 2: 'green' };

export const DATA = {
  // ---------- catálogos (hidratados de GET /meta) ----------
  COMPONENTES: [],
  PERIODOS: [],
  HABILIDADES: [],
  habByCod: {},
  MATRIZES: [],
  PROFESSORES: [],
  USUARIOS: [],
  ESCOLAS: [],
  ESCOLA: { nome: '', rede: '', ano: '' },
  REDE: { municipio: '', secretaria: '', uf: '', ano: '' },

  // séries (anos escolares) — catálogo configurável, hidratado de GET /meta
  // [{ ordem, nome }]; `ordem` é o inteiro usado em Turma.ano e Planejamento.anos
  ANOS: [1, 2, 3, 4, 5].map(n => ({ ordem: n, nome: n + 'º ano' })),

  // ---------- grupos de escolas (admin/secretaria) ----------
  GRUPOS: { grupos: [], semGrupo: [] },

  // ---------- escola atual (hidratados pelo store) ----------
  TURMAS: [],
  ALUNOS: [],
  alunosT1: [],
  PLANEJAMENTOS: [],
  TRABALHO: {},
  SEMANAS: {}, // { [planejamentoId]: [{ semana, prof, sequenciaDidatica, ... }] }
  AVALIACOES: {},
  TIMELINE: [],

  // escopo de escolas do contexto (gestor = seu grupo; demais = escola atual)
  ESCOLA_ATUAL: [],   // string[] de escolaIds em foco
  TURMA_ATUAL: null,  // turma representativa carregada com roster completo

  // ---------- sessão ----------
  CURRENT_USER: null,

  // ---------- rede (hidratados por hydrateRede; admin) ----------
  _escolas: [],
  _rede: null,
  escolasFull: () => DATA._escolas,
  escola: id => DATA._escolas.find(e => e.id === id),
  rede: () => DATA._rede,

  // ---------- constantes de UI ----------
  RES_LABEL,
  RES_COR,

  // ---------- helpers ----------
  avalCount: (alunoId, hab) => {
    const a = DATA.AVALIACOES[alunoId];
    return a && a[hab] ? a[hab].length : 0;
  },
  compNome: id => (DATA.COMPONENTES.find(c => c.id === id) || {}).nome || id,
  turmaNome: id => { const t = DATA.TURMAS.find(x => x.id === id); return t ? turmaRotulo(t.nome) : id; },
  turmaRotulo: nome => turmaRotulo(nome),
  profNome: id => (DATA.PROFESSORES.find(p => p.id === id) || {}).nome || id,
  escolaNome: id => (DATA.ESCOLAS.find(e => e.id === id) || {}).nome || id,
  usuarioNome: id => (DATA.USUARIOS.find(u => u.id === id) || {}).nome || id,
  anoNome: ordem => (DATA.ANOS.find(a => a.ordem === ordem) || {}).nome || ordem + 'º ano',
  prof: id => DATA.PROFESSORES.find(p => p.id === id),
  periodoNome: id => (DATA.PERIODOS.find(p => p.id === id) || {}).nome || id,
  matriz: id => DATA.MATRIZES.find(m => m.id === id),
  rotulo: cod => (DATA.habByCod[cod] || {}).rotulo || cod,
};

export default DATA;
