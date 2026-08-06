/* ============================================================
   Admin (parte 2) — Detalhe da escola, Turmas, Alunos,
   Ficha de leitura, Usuários, Configurações
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, fetchTurmaFull, fetchAlunoFull, fetchAvaliacoesAluno, adminCriarUsuario, adminEditarUsuario, adminExcluirUsuario, adminConfig, adminSalvarConfig,
  adminCriarTurma, adminEditarTurma, adminExcluirTurma, adminCriarAluno, adminEditarAluno, adminExcluirAluno, adminEditarEscola, fetchTurmas, fetchAlunos } from './store.js';
import { PageHeader, Stat, I, Avatar, Modal } from './ui.jsx';
import { ZonaBadge, fmt, EscolaForm } from './admin.jsx';

const Carregando = ({ back }) => (
  <div className="fade-in">
    {back && <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>}
    <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Carregando…</div>
  </div>
);

/* -------- Detalhe da escola -------- */
export const AdminEscolaDetail = ({ escolaId, back, openTurma }) => {
  const D = DATA;
  const [editando, setEditando] = useState(false);
  const e = D.escola(escolaId);
  if (!e) return <Carregando back={back} />;
  const salvarEscola = f => adminEditarEscola(e.id, { nome: f.nome.trim(), sigla: f.sigla.trim(), zona: f.zona, bairro: f.bairro, diretor: f.diretor, cor: f.cor });
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar às escolas</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, flex: 'none' }}>{e.sigla}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>{e.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <ZonaBadge zona={e.zona} />
            <span className="chip"><I name="pin" size={13} />{e.bairro}</span>
            <span className="chip"><I name="user" size={13} />Dir. {e.diretor}</span>
            <span className="chip">Anos: {e.anos.map(a => D.anoNome(a)).join(', ')}</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => setEditando(true)}><I name="edit" size={15} />Editar escola</button>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 18 }}>
        <Stat label="Turmas" value={e.totTurmas} icon="grid" accent={e.cor} />
        <Stat label="Alunos" value={e.totAlunos} icon="users" accent="#6d4bd1" />
        <Stat label="Professores" value={e.professores} icon="grad" accent="#0e8aa8" />
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Turmas · {e.totTurmas}</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Turma</th><th>Ano</th><th>Turno</th><th style={{ textAlign: 'center' }}>Alunos</th><th></th></tr></thead>
          <tbody>
            {e.turmas.map(t => (
              <tr key={t.id} className="clickable" onClick={() => openTurma(t.id)}>
                <td style={{ fontWeight: 600 }}>{t.nome}</td>
                <td style={{ color: 'var(--text-2)' }}>{D.anoNome(t.ano)}</td>
                <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && <EscolaForm titulo={'Editar — ' + e.nome} onClose={() => setEditando(false)} onSave={salvarEscola}
        inicial={{ nome: e.nome, sigla: e.sigla, zona: e.zona, bairro: e.bairro || '', diretor: e.diretor || '', cor: e.cor }} />}
    </div>
  );
};

/* -------- Formulário de turma (criar/editar) -------- */
const TurmaForm = ({ titulo, inicial, onSave, onClose }) => {
  const D = DATA;
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (!f.escola) { setErro('Selecione a escola.'); return; }
    if (!f.nome || f.nome.trim().length < 2) { setErro('Informe o nome da turma.'); return; }
    setSalvando(true); setErro(null);
    try { await onSave(f); onClose(); } catch (err) { setErro(err.message); setSalvando(false); }
  };
  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={salvando} onClick={salvar} style={{ opacity: salvando ? .6 : 1 }}><I name="check2" size={15} />{salvando ? 'Salvando…' : 'Salvar'}</button>
    </>
  );
  return (
    <Modal title={titulo} icon="grid" width={460} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Escola</label>
          <select className="input" value={f.escola} onChange={e => set('escola', e.target.value)}>
            <option value="">Selecione…</option>
            {(D.ESCOLAS || []).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div className="grid grid-main-aside" style={{ gap: 14 }}>
          <div>
            <label className="field-label">Nome da turma</label>
            <input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: 1º Ano A" />
          </div>
          <div>
            <label className="field-label">Ano escolar</label>
            <select className="input" value={f.ano} onChange={e => set('ano', +e.target.value)}>
              {D.ANOS.map(a => <option key={a.ordem} value={a.ordem}>{a.nome}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Turno</label>
          <select className="input" value={f.turno} onChange={e => set('turno', e.target.value)}>
            {['Matutino', 'Vespertino', 'Integral'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
};

/* -------- Turmas (rede inteira) -------- */
export const AdminTurmas = ({ openTurma }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [escFilter, setEscFilter] = useState('todas');
  const [anoFilter, setAnoFilter] = useState('todos');
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  let turmas = [];
  escolas.forEach(e => { if (escFilter === 'todas' || escFilter === e.id) e.turmas.forEach(t => turmas.push({ ...t, escolaId: e.id, escolaNome: e.nome, escolaCor: e.cor, sigla: e.sigla })); });
  if (anoFilter !== 'todos') turmas = turmas.filter(t => t.ano === +anoFilter);

  const criar = f => adminCriarTurma({ escola: f.escola, ano: f.ano, nome: f.nome.trim(), turno: f.turno });
  const salvarEdicao = f => adminEditarTurma(editar.id, { escola: f.escola, ano: f.ano, nome: f.nome.trim(), turno: f.turno });
  const excluir = async t => {
    if (t.alunos.length > 0) return alert(`A turma "${t.nome}" tem ${t.alunos.length} aluno(s). Transfira-os antes de excluir.`);
    if (!window.confirm(`Excluir a turma "${t.nome}"?`)) return;
    try { await adminExcluirTurma(t.id); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Turmas" subtitle="Todas as turmas da rede. Filtre por escola ou ano para localizar rapidamente."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Nova turma</button>} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 280 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
          <option value="todos">Todos os anos</option>
          {D.ANOS.map(a => <option key={a.ordem} value={a.ordem}>{a.nome}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--text-3)' }}>{turmas.length} turmas</span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Turma</th><th>Escola</th><th>Ano</th><th>Turno</th><th style={{ textAlign: 'center' }}>Alunos</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {turmas.map(t => (
              <tr key={t.id} className="clickable" onClick={() => openTurma(t.id)}>
                <td style={{ fontWeight: 600 }}>{t.nome}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: t.escolaCor + '18', color: t.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9.5, flex: 'none' }}>{t.sigla}</div>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{t.escolaNome}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{D.anoNome(t.ano)}</td>
                <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" title="Editar turma" onClick={() => setEditar(t)}><I name="edit" size={15} /></button>
                  <button className="icon-btn" title="Excluir turma" onClick={() => excluir(t)}><I name="x" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {novo && <TurmaForm titulo="Nova turma" onClose={() => setNovo(false)} onSave={criar}
        inicial={{ escola: '', nome: '', ano: (D.ANOS[0] || { ordem: 1 }).ordem, turno: 'Matutino' }} />}
      {editar && <TurmaForm titulo={'Editar — ' + editar.nome} onClose={() => setEditar(null)} onSave={salvarEdicao}
        inicial={{ escola: editar.escolaId, nome: editar.nome, ano: editar.ano, turno: editar.turno }} />}
    </div>
  );
};

/* -------- Detalhe da turma (roster) -------- */
export const AdminTurmaDetail = ({ turmaId, back, openAluno }) => {
  const [t, setT] = useState(null);
  useEffect(() => {
    let ativo = true;
    fetchTurmaFull(turmaId).then(x => { if (ativo) setT(x); }).catch(() => { if (ativo) setT(false); });
    return () => { ativo = false; };
  }, [turmaId]);
  if (t === null) return <Carregando back={back} />;
  if (t === false) return <Carregando back={back} />;
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: t.escolaCor + '18', color: t.escolaCor, display: 'grid', placeItems: 'center', flex: 'none' }}><I name="grid" size={24} /></div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 21 }}>{t.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
            <span className="chip"><I name="school" size={13} />{t.escolaNome}</span>
            <span className="chip">{t.turno}</span>
            <span className="chip"><I name="users" size={13} />{t.alunos.length} alunos</span>
          </div>
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 40 }}>Nº</th><th>Aluno</th><th></th></tr></thead>
          <tbody>
            {t.alunos.map(a => (
              <tr key={a.id} className="clickable" onClick={() => openAluno(a.id)}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{String(a.numero).padStart(2, '0')}</td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Formulário de aluno (criar/editar) -------- */
const AlunoForm = ({ titulo, inicial, turmas, editando, onSave, onClose }) => {
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (!f.nome || f.nome.trim().length < 3) { setErro('Informe o nome completo do aluno.'); return; }
    if (!f.turma) { setErro('Selecione a turma.'); return; }
    setSalvando(true); setErro(null);
    try { await onSave(f); onClose(); } catch (err) { setErro(err.message); setSalvando(false); }
  };
  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={salvando} onClick={salvar} style={{ opacity: salvando ? .6 : 1 }}><I name="check2" size={15} />{salvando ? 'Salvando…' : 'Salvar'}</button>
    </>
  );
  return (
    <Modal title={titulo} icon="user" width={460} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Nome completo</label>
          <input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: João da Silva" />
        </div>
        <div>
          <label className="field-label">Turma</label>
          <select className="input" value={f.turma} onChange={e => set('turma', e.target.value)}>
            <option value="">Selecione…</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {editando && (
          <div style={{ maxWidth: 150 }}>
            <label className="field-label">Número de chamada</label>
            <input className="input" type="number" min={1} value={f.numero} onChange={e => set('numero', +e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  );
};

/* -------- Diretório de alunos (paginação no servidor) -------- */
const ALUNOS_POR_PAGINA = 50;

export const AdminAlunos = ({ openAluno }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [q, setQ] = useState('');
  const [escFilter, setEscFilter] = useState('todas');
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState(null); // { total, alunos } · null = carregando
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const turmasOpts = escolas.flatMap(e => e.turmas.map(t => ({ id: t.id, label: e.sigla + ' · ' + t.nome })));

  const carregar = () => fetchAlunos({
    busca: q.trim() || undefined,
    escola: escFilter !== 'todas' ? escFilter : undefined,
    limit: ALUNOS_POR_PAGINA,
    offset: pagina * ALUNOS_POR_PAGINA,
  }).then(setDados).catch(() => setDados({ total: 0, alunos: [] }));

  // busca com debounce; troca de filtro/página recarrega direto
  useEffect(() => {
    setDados(null);
    const t = setTimeout(carregar, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, escFilter, pagina]);
  useEffect(() => { setPagina(0); }, [q, escFilter]);

  const total = dados ? dados.total : 0;
  const alunos = dados ? dados.alunos : [];
  const totalPaginas = Math.max(1, Math.ceil(total / ALUNOS_POR_PAGINA));
  const ini = total === 0 ? 0 : pagina * ALUNOS_POR_PAGINA + 1;
  const fim = Math.min(total, pagina * ALUNOS_POR_PAGINA + alunos.length);

  const criar = async f => { await adminCriarAluno({ nome: f.nome.trim(), turma: f.turma }); carregar(); };
  const salvarEdicao = async f => { await adminEditarAluno(editar.id, { nome: f.nome.trim(), turma: f.turma, numero: f.numero }); carregar(); };
  const excluir = async a => {
    if (!window.confirm(`Excluir o aluno "${a.nome}"? Os registros de avaliação e leitura dele serão removidos.`)) return;
    try { await adminExcluirAluno(a.id); carregar(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Alunos" subtitle="Diretório de estudantes de toda a rede. Busque por nome ou filtre por escola."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo aluno</button>} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <I name="search" size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Buscar aluno…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ maxWidth: 240 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>
      <div className="card">
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
          {dados === null ? 'Carregando…' : <>Mostrando <b className="num">{fmt(ini)}–{fmt(fim)}</b> de <b className="num">{fmt(total)}</b> alunos</>}
        </div>
        <table className="tbl">
          <thead><tr><th>Aluno</th><th>Escola</th><th>Turma</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {dados !== null && alunos.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Nenhum aluno encontrado.</td></tr>
            )}
            {alunos.map(a => (
              <tr key={a.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: a.escolaCor + '18', color: a.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9, flex: 'none' }}>{a.escolaSigla}</div>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{a.escolaNome}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{a.turmaNome}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" title="Editar aluno" onClick={() => setEditar(a)}><I name="edit" size={15} /></button>
                  <button className="icon-btn" title="Excluir aluno" onClick={() => excluir(a)}><I name="x" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* barra de paginação */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            Página <b className="num">{fmt(pagina + 1)}</b> de <b className="num">{fmt(totalPaginas)}</b>
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-subtle btn-sm" disabled={pagina === 0} style={{ opacity: pagina === 0 ? .5 : 1 }} onClick={() => setPagina(0)}>« Primeira</button>
            <button className="btn btn-subtle btn-sm" disabled={pagina === 0} style={{ opacity: pagina === 0 ? .5 : 1 }} onClick={() => setPagina(p => Math.max(0, p - 1))}><I name="chevL" size={14} />Anterior</button>
            <button className="btn btn-subtle btn-sm" disabled={pagina + 1 >= totalPaginas} style={{ opacity: pagina + 1 >= totalPaginas ? .5 : 1 }} onClick={() => setPagina(p => p + 1)}>Próxima<I name="chevR" size={14} /></button>
            <button className="btn btn-subtle btn-sm" disabled={pagina + 1 >= totalPaginas} style={{ opacity: pagina + 1 >= totalPaginas ? .5 : 1 }} onClick={() => setPagina(totalPaginas - 1)}>Última »</button>
          </div>
        </div>
      </div>
      {novo && <AlunoForm titulo="Novo aluno" turmas={turmasOpts} onClose={() => setNovo(false)} onSave={criar}
        inicial={{ nome: '', turma: '' }} />}
      {editar && <AlunoForm titulo={'Editar — ' + editar.nome} editando turmas={turmasOpts} onClose={() => setEditar(null)} onSave={salvarEdicao}
        inicial={{ nome: editar.nome, turma: editar.turma, numero: editar.numero }} />}
    </div>
  );
};

/* -------- Ficha de leitura do aluno (admin) -------- */
export const AdminAlunoFicha = ({ alunoId, back }) => {
  const [a, setA] = useState(null);
  useEffect(() => {
    let ativo = true;
    fetchAlunoFull(alunoId).then(x => { if (ativo) setA(x); }).catch(() => { if (ativo) setA(false); });
    return () => { ativo = false; };
  }, [alunoId]);
  if (!a) return <Carregando back={back} />;
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <Avatar nome={a.nome} iniciais={a.iniciais} cor="#475569" size={64} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>{a.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip">Nº {String(a.numero).padStart(2, '0')}</span>
            <span className="chip"><I name="school" size={13} />{a.escolaNome}</span>
            <span className="chip"><I name="grid" size={13} />{a.turmaNome} · {a.turno}</span>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ color: 'var(--text-3)', fontSize: 13 }}>
        Acompanhamento por habilidade na Verificação Contínua.
      </div>
    </div>
  );
};

/* -------- Usuários & acessos -------- */
const UserForm = ({ titulo, inicial, onSave, onClose, editando }) => {
  const D = DATA;
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  // vínculo do professor: turmas de toda a rede + escola em foco no seletor
  const [turmasRede, setTurmasRede] = useState(DATA.TURMAS);
  const [escolaProf, setEscolaProf] = useState((D.ESCOLAS[0] || {}).id || '');
  useEffect(() => {
    let ativo = true;
    fetchTurmas().then(ts => {
      if (!ativo) return;
      setTurmasRede(ts);
      const t0 = ts.find(t => (inicial.turmaIds || []).includes(t.id));
      if (t0) setEscolaProf(t0.escola);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);
  const toggleTurma = tid => set('turmaIds',
    (f.turmaIds || []).includes(tid) ? f.turmaIds.filter(x => x !== tid) : [...(f.turmaIds || []), tid]);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await onSave(f);
      onClose();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={salvando} onClick={salvar} style={{ opacity: salvando ? .6 : 1 }}>
        <I name="check2" size={15} />{salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal title={titulo} icon="user" width={480} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Nome completo</label>
          <input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Maria da Silva" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div>
            <label className="field-label">E-mail</label>
            <input className="input" value={f.email} onChange={e => set('email', e.target.value)} placeholder="email@rededeensino.edu.br" />
          </div>
          <div>
            <label className="field-label">{editando ? 'Nova senha (opcional)' : 'Senha'}</label>
            <input className="input" type="password" value={f.senha} onChange={e => set('senha', e.target.value)} placeholder={editando ? 'Manter atual' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className="field-label">Perfil</label>
            <select className="input" value={f.perfil} onChange={e => set('perfil', e.target.value)}>
              <option value="secretaria">Secretaria de Educação</option>
              <option value="gestor">Gestor Escolar / Coordenador</option>
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="field-label">Cargo</label>
            <input className="input" value={f.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex.: Coordenadora" />
          </div>
        </div>
        {f.perfil === 'professor' && (
          <>
            <div className="grid grid-cols-2" style={{ gap: 14 }}>
              <div>
                <label className="field-label">Professor vinculado</label>
                <select className="input" value={f.profId || ''} onChange={e => {
                  const pid = e.target.value || null;
                  const prof = D.PROFESSORES.find(x => x.id === pid);
                  setF(x => ({ ...x, profId: pid, ...(prof ? { comp: prof.comp, turmaIds: prof.turmaIds || [] } : {}) }));
                }}>
                  <option value="">— novo professor —</option>
                  {D.PROFESSORES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Componente curricular</label>
                <select className="input" value={f.comp || (D.COMPONENTES[0] || {}).id || ''} onChange={e => set('comp', e.target.value)}>
                  {D.COMPONENTES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">Escola</label>
              <select className="input" value={escolaProf} onChange={e => setEscolaProf(e.target.value)}>
                {(D.ESCOLAS || []).map(e2 => <option key={e2.id} value={e2.id}>{e2.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Turmas do professor <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>({(f.turmaIds || []).length} selecionada(s))</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                {turmasRede.filter(t => t.escola === escolaProf).map(t => {
                  const on = (f.turmaIds || []).includes(t.id);
                  return (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                      background: on ? 'var(--primary-50)' : 'transparent' }}>
                      <input type="checkbox" checked={on} onChange={() => toggleTurma(t.id)} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.nome}</span>
                      {t.turno && <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{t.turno}</span>}
                    </label>
                  );
                })}
                {turmasRede.filter(t => t.escola === escolaProf).length === 0 && (
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nenhuma turma nesta escola.</span>
                )}
              </div>
            </div>
          </>
        )}
        {f.perfil === 'gestor' && (
          <div>
            <label className="field-label">Escolas do gestor <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(acesso automático a todas as turmas dessas escolas)</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
              {(D.ESCOLAS || []).map(e => {
                const on = (f.escolaIds || []).includes(e.id);
                return (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                    background: on ? 'var(--primary-50)' : 'transparent' }}>
                    <input type="checkbox" checked={on} onChange={() => set('escolaIds',
                      on ? f.escolaIds.filter(x => x !== e.id) : [...(f.escolaIds || []), e.id])} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{e.nome}</span>
                    {e.zona && <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{e.zona}</span>}
                  </label>
                );
              })}
              {(!D.ESCOLAS || D.ESCOLAS.length === 0) && <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nenhuma escola cadastrada.</span>}
            </div>
          </div>
        )}
        {editando && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.ativo} onChange={e => set('ativo', e.target.checked)} />
            Conta ativa
          </label>
        )}
      </div>
    </Modal>
  );
};

export const AdminUsers = () => {
  const D = DATA;
  const users = D.USUARIOS;
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);

  const vinculoProf = f => f.perfil === 'professor'
    ? { ...(f.comp ? { comp: f.comp } : {}), turmaIds: f.turmaIds || [] }
    : {};
  const criar = f => adminCriarUsuario({
    nome: f.nome, email: f.email, senha: f.senha, perfil: f.perfil,
    cargo: f.cargo, profId: f.profId || null, escolaIds: f.escolaIds || [],
    ...vinculoProf(f),
  });
  const salvarEdicao = f => adminEditarUsuario(editar.id, {
    nome: f.nome, email: f.email, perfil: f.perfil, cargo: f.cargo,
    ativo: f.ativo, profId: f.profId || null, escolaIds: f.escolaIds || [],
    ...(f.senha ? { senha: f.senha } : {}),
    ...vinculoProf(f),
  });
  const profDe = id => D.PROFESSORES.find(x => x.id === id) || {};
  const excluir = async u => {
    if (!window.confirm(`Excluir o usuário ${u.nome}?`)) return;
    try { await adminExcluirUsuario(u.id); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Usuários & acessos" subtitle="Contas da rede com quatro perfis: Secretaria de Educação, gestor escolar/coordenador, professor e administrador."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo usuário</button>} />
      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Total de contas" value={users.length} icon="users" accent="#2563eb" />
        <Stat label="Secretaria" value={users.filter(u => u.perfil === 'secretaria').length} icon="layers" accent="#0e7490" />
        <Stat label="Gestores" value={users.filter(u => u.perfil === 'gestor').length} icon="grad" accent="#6d4bd1" />
        <Stat label="Administradores" value={users.filter(u => u.perfil === 'admin').length} icon="settings" accent="#475569" />
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Usuário</th><th>Perfil</th><th>Cargo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="clickable">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar {...u} size={34} /><div><div style={{ fontWeight: 600 }}>{u.nome}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{u.email}</div></div></div></td>
                <td><span className={'badge ' + ({ admin: 'badge-gray', secretaria: 'badge-violet', professor: 'badge-cyan', gestor: 'badge-blue' }[u.perfil] || 'badge-blue')}>{{ admin: 'Admin', secretaria: 'Secretaria', gestor: 'Gestor', professor: 'Professor' }[u.perfil] || u.perfil}</span></td>
                <td style={{ color: 'var(--text-2)' }}>{u.cargo}</td>
                <td>{u.ativo !== false ? <span className="badge badge-green">Ativo</span> : <span className="badge badge-gray">Inativo</span>}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" title="Editar" onClick={() => setEditar(u)}><I name="edit" size={15} /></button>
                  <button className="icon-btn" title="Excluir" onClick={() => excluir(u)}><I name="x" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {novo && (
        <UserForm titulo="Novo usuário" onClose={() => setNovo(false)} onSave={criar}
          inicial={{ nome: '', email: '', senha: '', perfil: 'gestor', cargo: '', profId: null, escolaIds: [], comp: null, turmaIds: [] }} />
      )}
      {editar && (
        <UserForm titulo={'Editar — ' + editar.nome} editando onClose={() => setEditar(null)} onSave={salvarEdicao}
          inicial={{ nome: editar.nome, email: editar.email, senha: '', perfil: editar.perfil, cargo: editar.cargo, profId: editar.profId || null, escolaIds: editar.escolaIds || [], ativo: editar.ativo !== false,
            comp: profDe(editar.profId).comp || null, turmaIds: profDe(editar.profId).turmaIds || [] }} />
      )}
    </div>
  );
};

/* -------- Configurações + permissões -------- */
export const AdminConfig = () => {
  const D = DATA;
  const [cfg, setCfg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let ativo = true;
    adminConfig().then(c => { if (ativo) setCfg(c); }).catch(() => { if (ativo) setCfg({}); });
    return () => { ativo = false; };
  }, []);

  const trocarPeriodo = async id => {
    setSalvando(true);
    setMsg(null);
    try {
      await adminSalvarConfig({ periodoAtual: id });
      setCfg(c => ({ ...c, periodoAtual: id }));
      setMsg('Período atual alterado.');
      setTimeout(() => setMsg(null), 2200);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
  <div className="fade-in">
    <PageHeader title="Configurações" subtitle="Parâmetros gerais do sistema e permissões por perfil." />

    {/* período avaliativo atual */}
    <div className="card card-pad" style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Período avaliativo atual</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Define o bimestre vigente em toda a plataforma.</p>
        </div>
        {msg && <span style={{ fontSize: 12.5, fontWeight: 700, color: msg.includes('alterado') ? 'var(--green)' : 'var(--red)' }}>{msg}</span>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {D.PERIODOS.map(p => {
          const atual = cfg ? cfg.periodoAtual === p.id : p.atual;
          return (
            <button key={p.id} disabled={salvando || !cfg} onClick={() => trocarPeriodo(p.id)}
              style={{ padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 13,
                border: '1.5px solid ' + (atual ? 'var(--primary)' : 'var(--border)'),
                background: atual ? 'var(--primary-50)' : 'var(--surface)',
                color: atual ? 'var(--primary)' : 'var(--text-2)', opacity: salvando ? .6 : 1 }}>
              {p.nome}{atual && ' · atual'}
            </button>
          );
        })}
      </div>
    </div>

    <div className="grid grid-cols-2" style={{ marginBottom: 22 }}>
      {[
        ['Componentes curriculares', 'Língua Portuguesa, Matemática', 'skills'],
        ['Períodos avaliativos', 'Bimestral · 4 períodos', 'calendar'],
        ['Recuperação de senha', 'Via e-mail cadastrado', 'lock'],
      ].map((c, i) => (
        <div key={i} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name={c[2]} size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c[0]}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{c[1]}</div>
          </div>
          <button className="btn btn-subtle btn-sm">Editar</button>
        </div>
      ))}
    </div>

    <div className="card card-pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Permissões por perfil</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>Secretaria de Educação e Administrador têm as mesmas atribuições (superusuários de rede).</p>
      <table className="tbl">
        <thead><tr><th>Funcionalidade</th>
          <th style={{ textAlign: 'center' }}>Secretaria</th>
          <th style={{ textAlign: 'center' }}>Gestor</th>
          <th style={{ textAlign: 'center' }}>Professor</th>
          <th style={{ textAlign: 'center' }}>Admin</th></tr></thead>
        <tbody>
          {[
            // [funcionalidade, secretaria, gestor, professor, admin]
            ['Cadastrar planejamento', 0, 1, 0, 1],
            ['Vincular habilidades BNCC', 0, 1, 0, 1],
            ['Editar atividades e recursos', 0, 0, 1, 0],
            ['Registrar verificação contínua', 0, 0, 1, 0],
            ['Classificar nível de leitura', 0, 0, 1, 0],
            ['Ver dashboards da escola', 1, 1, 0, 1],
            ['Ver indicadores de toda a rede', 1, 0, 0, 1],
            ['Gerenciar escolas e turmas', 1, 0, 0, 1],
            ['Gerenciar usuários e acessos', 1, 0, 0, 1],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{r[0]}</td>
              {[1, 2, 3, 4].map(c => (
                <td key={c} style={{ textAlign: 'center' }}>
                  {r[c] ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><I name="check2" size={17} sw={2.4} /></span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};
