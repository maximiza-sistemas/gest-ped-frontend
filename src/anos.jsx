/* ============================================================
   Anos escolares (séries) — gestão admin/secretaria.
   Catálogo usado nos seletores de "ano escolar" dos planejamentos.
   CRUD via /anos (store).
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { fetchAnos, criarAno, atualizarAno, excluirAno } from './store.js';
import { PageHeader, I, Modal } from './ui.jsx';

const AnoForm = ({ titulo, inicial, onSave, onClose }) => {
  const [nome, setNome] = useState(inicial.nome || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const salvar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do ano escolar.'); return; }
    setSalvando(true); setErro(null);
    try { await onSave({ nome: nome.trim() }); onClose(); }
    catch (err) { setErro(err.message); setSalvando(false); }
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
    <Modal title={titulo} icon="grad" width={420} onClose={onClose} footer={foot}>
      <label className="field-label">Nome do ano escolar</label>
      <input className="input" autoFocus value={nome} onChange={e => setNome(e.target.value)}
        placeholder="Ex.: 6º ano, Pré-escola…" onKeyDown={e => { if (e.key === 'Enter') salvar(); }} />
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
        Aparece como opção de série ao direcionar os planejamentos.
      </p>
    </Modal>
  );
};

export const AnosEscolares = () => {
  const [anos, setAnos] = useState(null);
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);

  const carregar = () => fetchAnos().then(setAnos).catch(() => setAnos([]));
  useEffect(() => { carregar(); }, []);

  const criar = async f => { await criarAno(f); await carregar(); };
  const editarSalvar = async f => { await atualizarAno(editar.ordem, f); await carregar(); };
  const excluir = async a => {
    const aviso = a.turmas > 0
      ? `\n\nAtenção: ${a.turmas} turma(s) usam este ano. Elas mantêm o valor, mas ele deixa de aparecer como opção.`
      : '';
    if (!window.confirm(`Excluir o ano escolar "${a.nome}"?${aviso}`)) return;
    try { await excluirAno(a.ordem); await carregar(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Anos escolares"
        subtitle="Séries da rede usadas para direcionar os planejamentos. Crie, renomeie ou remova os anos escolares."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo ano escolar</button>} />
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 90 }}>Ordem</th><th>Nome</th><th style={{ textAlign: 'center', width: 120 }}>Turmas</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {anos === null ? (
              <tr><td colSpan={4} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Carregando…</td></tr>
            ) : anos.length === 0 ? (
              <tr><td colSpan={4} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Nenhum ano escolar cadastrado.</td></tr>
            ) : anos.map(a => (
              <tr key={a.ordem}>
                <td className="num" style={{ color: 'var(--text-3)', fontWeight: 700 }}>{a.ordem}</td>
                <td style={{ fontWeight: 600 }}>{a.nome}</td>
                <td className="num" style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                  {a.turmas > 0 ? <span className="badge badge-gray">{a.turmas}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" title="Editar" onClick={() => setEditar(a)}><I name="edit" size={15} /></button>
                  <button className="icon-btn" title="Excluir" onClick={() => excluir(a)}><I name="x" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {novo && <AnoForm titulo="Novo ano escolar" inicial={{ nome: '' }} onSave={criar} onClose={() => setNovo(false)} />}
      {editar && <AnoForm titulo={'Editar — ' + editar.nome} inicial={{ nome: editar.nome }} onSave={editarSalvar} onClose={() => setEditar(null)} />}
    </div>
  );
};
