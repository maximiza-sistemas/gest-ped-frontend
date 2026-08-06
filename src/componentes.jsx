/* ============================================================
   Componentes curriculares — gestão admin/secretaria.
   Catálogo usado no cadastro de habilidades, nos professores e
   nos planejamentos. CRUD via /componentes (store).
   ============================================================ */
import React, { useState } from 'react';
import { DATA, criarComponente, atualizarComponente, excluirComponente } from './store.js';
import { PageHeader, I, Modal } from './ui.jsx';

// código automático a partir do nome (minúsculas, sem acentos, hífens)
const slug = nome => nome.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);

const ComponenteForm = ({ titulo, inicial, onSave, onClose }) => {
  const editando = !!inicial.id;
  const [nome, setNome] = useState(inicial.nome || '');
  const [cod, setCod] = useState(inicial.id || '');
  const [codEditado, setCodEditado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const mudaNome = v => { setNome(v); if (!editando && !codEditado) setCod(slug(v)); };

  const salvar = async () => {
    if (nome.trim().length < 2) { setErro('Informe o nome do componente curricular.'); return; }
    if (!editando && !/^[a-z0-9-]{2,20}$/.test(cod)) { setErro('Código: 2 a 20 caracteres — letras minúsculas, números ou hífen.'); return; }
    setSalvando(true);
    setErro(null);
    try {
      await onSave(editando ? { nome: nome.trim() } : { id: cod, nome: nome.trim() });
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
    <Modal title={titulo} icon="book" width={440} onClose={onClose} footer={foot}>
      <label className="field-label">Nome do componente curricular</label>
      <input className="input" autoFocus value={nome} onChange={e => mudaNome(e.target.value)}
        placeholder="Ex.: Ciências, História…" onKeyDown={e => { if (e.key === 'Enter') salvar(); }} />
      <label className="field-label" style={{ marginTop: 14 }}>Código</label>
      <input className="input" value={cod} disabled={editando}
        onChange={e => { setCod(e.target.value); setCodEditado(true); }}
        style={editando ? { opacity: .6 } : {}} />
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
        {editando
          ? 'O código não pode ser alterado — ele identifica o componente nas habilidades e planejamentos.'
          : 'Identificador curto usado internamente (gerado a partir do nome; pode ajustar).'}
      </p>
    </Modal>
  );
};

export const ComponentesCurriculares = () => {
  const D = DATA;
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const usoHabs = id => D.HABILIDADES.filter(h => h.comp === id).length;
  const usoProfs = id => D.PROFESSORES.filter(p => p.comp === id).length;

  const excluir = async c => {
    if (!window.confirm(`Excluir o componente curricular "${c.nome}"?`)) return;
    try { await excluirComponente(c.id); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Componentes curriculares"
        subtitle="Disciplinas da rede, usadas no cadastro de habilidades, nos professores e nos planejamentos."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo componente</button>} />
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 130 }}>Código</th><th>Nome</th><th style={{ textAlign: 'center', width: 130 }}>Habilidades</th><th style={{ textAlign: 'center', width: 130 }}>Professores</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {D.COMPONENTES.length === 0 ? (
              <tr><td colSpan={5} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Nenhum componente curricular cadastrado.</td></tr>
            ) : D.COMPONENTES.map(c => {
              const habs = usoHabs(c.id);
              const profs = usoProfs(c.id);
              return (
                <tr key={c.id}>
                  <td><span className="code-pill">{c.id}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.nome}</td>
                  <td className="num" style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                    {habs > 0 ? <span className="badge badge-gray">{habs}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td className="num" style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                    {profs > 0 ? <span className="badge badge-gray">{profs}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="icon-btn" title="Editar" onClick={() => setEditar(c)}><I name="edit" size={15} /></button>
                    <button className="icon-btn" title="Excluir" onClick={() => excluir(c)}><I name="x" size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {novo && <ComponenteForm titulo="Novo componente curricular" inicial={{}} onSave={criarComponente} onClose={() => setNovo(false)} />}
      {editar && <ComponenteForm titulo={'Editar — ' + editar.nome} inicial={editar}
        onSave={f => atualizarComponente(editar.id, f)} onClose={() => setEditar(null)} />}
    </div>
  );
};
