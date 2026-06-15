/* ============================================================
   DATA — contêiner de dados da aplicação.
   Os dados vêm da API e são hidratados pelo store.js após o
   login; as views continuam lendo DATA sincronamente.
   ============================================================ */

const RES_LABEL = { 1: 'Não atingiu', 2: 'Atingiu' };
const RES_COR   = { 1: 'red', 2: 'green' };

export const DATA = {
  // ---------- catálogos (hidratados de GET /meta) ----------
  NIVEIS: [],
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

  // séries (anos) do ensino fundamental — anos iniciais
  ANOS: [1, 2, 3, 4, 5],

  // ---------- orientações (gestor) + trilhas (professor) ----------
  ORIENTACOES: [],

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
  distribuicaoNiveis: alunos => {
    const d = [0, 0, 0, 0, 0, 0];
    alunos.forEach(a => d[a.nivelLeitura - 1]++);
    return d;
  },
  compNome: id => (DATA.COMPONENTES.find(c => c.id === id) || {}).nome || id,
  turmaNome: id => (DATA.TURMAS.find(t => t.id === id) || {}).nome || id,
  profNome: id => (DATA.PROFESSORES.find(p => p.id === id) || {}).nome || id,
  escolaNome: id => (DATA.ESCOLAS.find(e => e.id === id) || {}).nome || id,
  usuarioNome: id => (DATA.USUARIOS.find(u => u.id === id) || {}).nome || id,
  anoNome: a => a + 'º ano',
  prof: id => DATA.PROFESSORES.find(p => p.id === id),
  periodoNome: id => (DATA.PERIODOS.find(p => p.id === id) || {}).nome || id,
  nivel: id => DATA.NIVEIS.find(n => n.id === id),
  matriz: id => DATA.MATRIZES.find(m => m.id === id),
  rotulo: cod => (DATA.habByCod[cod] || {}).rotulo || cod,
};

export default DATA;
