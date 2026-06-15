/* ============================================================
   Grupos de escolas (admin/secretaria) — organização da rede em
   polos. Criar/editar/excluir grupos e remanejar escolas entre
   eles (clique na escola → modal de destino).
   ============================================================ */
import React, { useState } from 'react';
import { DATA, criarGrupo, atualizarGrupo, excluirGrupo, moverEscola } from './store.js';
import { PageHeader, Modal, Stat, I } from './ui.jsx';

const PALETA = ['#2563eb', '#6d4bd1', '#0e8aa8', '#15935f', '#c77a07', '#d3433a', '#0e7490', '#475569'];

/* -------- chip clicável de escola -------- */
const EscolaChip = ({ escola, cor, onClick }) => (
  <button onClick={onClick} title="Remanejar escola"
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textAlign: 'left', borderRadius: 10,
      border: '1px solid var(--border)', background: 'var(--surface)', transition: 'box-shadow .15s, transform .15s' }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
    <span style={{ width: 28, height: 28, borderRadius: 7, background: (cor || escola.cor || '#64748b') + '18', color: cor || escola.cor || '#64748b', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 9.5, flex: 'none' }}>{escola.sigla}</span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{escola.nome}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{escola.zona}</span>
    </span>
    <I name="swap" size={15} style={{ color: 'var(--text-4)', flex: 'none' }} />
  </button>
);

/* -------- card de um grupo -------- */
const GrupoCard = ({ grupo, onEdit, onMove }) => {
  const excluir = async () => {
    const msg = grupo.escolas.length
      ? `Excluir o grupo "${grupo.nome}"? As ${grupo.escolas.length} escola(s) ficarão sem grupo.`
      : `Excluir o grupo "${grupo.nome}"?`;
    if (!window.confirm(msg)) return;
    try { await excluirGrupo(grupo.id); } catch (err) { alert(err.message); }
  };
  return (
    <div className="card">
      <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: grupo.escolas.length ? '1px solid var(--border)' : 'none' }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: grupo.cor, flex: 'none' }} />
        <h3 style={{ fontSize: 15, flex: 1 }}>{grupo.nome}</h3>
        <span className="badge badge-gray">{grupo.escolas.length} {grupo.escolas.length === 1 ? 'escola' : 'escolas'}</span>
        <button className="icon-btn" title="Editar grupo" onClick={onEdit}><I name="edit" size={15} /></button>
        <button className="icon-btn" title="Excluir grupo" onClick={excluir}><I name="x" size={15} /></button>
      </div>
      {grupo.escolas.length > 0 && (
        <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {grupo.escolas.map(e => <EscolaChip key={e.id} escola={e} cor={grupo.cor} onClick={() => onMove(e)} />)}
        </div>
      )}
    </div>
  );
};

/* -------- bucket de escolas sem grupo -------- */
const SemGrupoCard = ({ escolas, onMove }) => {
  if (!escolas.length) return null;
  return (
    <div className="card" style={{ borderStyle: 'dashed' }}>
      <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--border-strong)', flex: 'none' }} />
        <h3 style={{ fontSize: 15, flex: 1, color: 'var(--text-2)' }}>Sem grupo</h3>
        <span className="badge badge-gray">{escolas.length} {escolas.length === 1 ? 'escola' : 'escolas'}</span>
      </div>
      <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {escolas.map(e => <EscolaChip key={e.id} escola={e} onClick={() => onMove(e)} />)}
      </div>
    </div>
  );
};

/* -------- modal: novo / editar grupo -------- */
const GrupoForm = ({ grupo, onClose }) => {
  const editando = !!grupo;
  const [nome, setNome] = useState(grupo?.nome || '');
  const [cor, setCor] = useState(grupo?.cor || PALETA[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      if (editando) await atualizarGrupo(grupo.id, { nome: nome.trim(), cor });
      else await criarGrupo({ nome: nome.trim(), cor });
      onClose();
    } catch (err) { setErro(err.message); setSalvando(false); }
  };

  const podeSalvar = nome.trim().length >= 2;
  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={salvando || !podeSalvar} style={{ opacity: salvando || !podeSalvar ? .6 : 1 }} onClick={salvar}>
        <I name="check2" size={15} />{salvando ? 'Salvando…' : (editando ? 'Salvar' : 'Criar grupo')}
      </button>
    </>
  );

  return (
    <Modal title={editando ? 'Editar grupo' : 'Novo grupo de escolas'} icon="layers" width={460} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Nome do grupo</label>
          <input className="input" autoFocus value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Polo Urbano Centro" />
        </div>
        <div>
          <label className="field-label">Cor</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {PALETA.map(c => (
              <button key={c} onClick={() => setCor(c)} title={c}
                style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer',
                  border: '2px solid ' + (cor === c ? 'var(--text)' : 'transparent'), boxShadow: cor === c ? '0 0 0 2px var(--surface), 0 0 0 4px ' + c : 'none' }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -------- modal: remanejar escola -------- */
const RemanejarModal = ({ escola, grupos, onClose }) => {
  const [salvando, setSalvando] = useState(null); // grupoId em processamento
  const [erro, setErro] = useState(null);

  const mover = async grupoId => {
    if (grupoId === (escola.grupoId || null)) { onClose(); return; }
    setSalvando(grupoId || '__none__');
    setErro(null);
    try { await moverEscola(escola.id, grupoId); onClose(); }
    catch (err) { setErro(err.message); setSalvando(null); }
  };

  const opcoes = [...grupos, { id: null, nome: 'Sem grupo', cor: 'var(--border-strong)' }];

  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
    </>
  );

  return (
    <Modal title="Remanejar escola" subtitle={escola.nome} icon="swap" width={460} onClose={onClose} footer={foot}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Escolha o grupo de destino:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opcoes.map(g => {
          const atual = (escola.grupoId || null) === g.id;
          const carregando = salvando === (g.id || '__none__');
          return (
            <button key={g.id || 'none'} disabled={!!salvando} onClick={() => mover(g.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', textAlign: 'left', borderRadius: 11,
                border: '1.5px solid ' + (atual ? 'var(--primary)' : 'var(--border)'),
                background: atual ? 'var(--primary-50)' : 'var(--surface)', opacity: salvando && !carregando ? .5 : 1 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: g.cor, flex: 'none' }} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{g.nome}</span>
              {atual && <span className="badge badge-blue">Atual</span>}
              {carregando && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>movendo…</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

/* -------- tela principal -------- */
export const GruposEscolas = () => {
  const D = DATA;
  const { grupos, semGrupo } = D.GRUPOS;
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const [remanejar, setRemanejar] = useState(null);

  const agrupadas = grupos.reduce((s, g) => s + g.escolas.length, 0);

  return (
    <div className="fade-in">
      <PageHeader
        title="Grupos de escolas"
        subtitle="Organize as escolas da rede em grupos (polos). Clique em uma escola para remanejá-la para outro grupo."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={16} />Novo grupo</button>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 18 }}>
        <Stat label="Grupos" value={grupos.length} icon="layers" accent="#2563eb" />
        <Stat label="Escolas agrupadas" value={agrupadas} icon="school" accent="#15935f" />
        <Stat label="Sem grupo" value={semGrupo.length} icon="school" accent="#c77a07" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {grupos.length === 0 && semGrupo.length === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="layers" size={28} /></div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhum grupo ainda</h3>
            <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto 18px' }}>Crie o primeiro grupo para organizar as escolas da rede em polos.</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setNovo(true)}><I name="plus" size={16} />Novo grupo</button>
          </div>
        )}
        {grupos.map(g => (
          <GrupoCard key={g.id} grupo={g} onEdit={() => setEditar(g)} onMove={setRemanejar} />
        ))}
        <SemGrupoCard escolas={semGrupo} onMove={setRemanejar} />
      </div>

      {novo && <GrupoForm onClose={() => setNovo(false)} />}
      {editar && <GrupoForm grupo={editar} onClose={() => setEditar(null)} />}
      {remanejar && <RemanejarModal escola={remanejar} grupos={grupos} onClose={() => setRemanejar(null)} />}
    </div>
  );
};
