/* ============================================================
   Admin — primitivos compartilhados + Visão da rede + Escolas
   ============================================================ */
import React, { useState } from 'react';
import { DATA, adminCriarEscola, adminEditarEscola, adminExcluirEscola } from './store.js';
import { PageHeader, Stat, I, ICONS, Modal, MatrizBadge } from './ui.jsx';

const PALETA_ESC = ['#2563eb', '#0e8aa8', '#6d4bd1', '#15935f', '#c2410c', '#be123c', '#475569', '#7c3aed'];

/* -------- Formulário de escola (criar/editar) -------- */
export const EscolaForm = ({ titulo, inicial, onSave, onClose }) => {
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (!f.nome || f.nome.trim().length < 3) { setErro('Informe o nome da escola.'); return; }
    if (!f.sigla || f.sigla.trim().length < 2) { setErro('Informe uma sigla (mín. 2 letras).'); return; }
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
    <Modal title={titulo} icon="school" width={500} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid grid-2-1" style={{ gap: 14 }}>
          <div>
            <label className="field-label">Nome da escola</label>
            <input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: EMEF Anísio Teixeira" />
          </div>
          <div>
            <label className="field-label">Sigla</label>
            <input className="input" value={f.sigla} onChange={e => set('sigla', e.target.value.toUpperCase())} placeholder="EAT" maxLength={4} />
          </div>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div>
            <label className="field-label">Zona</label>
            <select className="input" value={f.zona} onChange={e => set('zona', e.target.value)}>
              <option value="Urbana">Urbana</option>
              <option value="Rural">Rural</option>
            </select>
          </div>
          <div>
            <label className="field-label">Bairro</label>
            <input className="input" value={f.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Ex.: Centro" />
          </div>
        </div>
        <div>
          <label className="field-label">Diretor(a)</label>
          <input className="input" value={f.diretor} onChange={e => set('diretor', e.target.value)} placeholder="Nome do diretor(a)" />
        </div>
        <div>
          <label className="field-label">Cor de identificação</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PALETA_ESC.map(c => (
              <button key={c} type="button" onClick={() => set('cor', c)}
                style={{ width: 30, height: 30, borderRadius: 8, background: c, border: f.cor === c ? '3px solid var(--text)' : '2px solid var(--border)', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ícones extras (registrados no catálogo compartilhado de ícones)
ICONS.school = ['M3 21h18', 'M5 21V8l7-5 7 5v13', 'M9 21v-6h6v6', 'M9 11h.01M15 11h.01'];
ICONS.pin = ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
ICONS.grid = ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'];

export const ZonaBadge = ({ zona }) => (
  <span className={'badge ' + (zona === 'Rural' ? 'badge-green' : 'badge-cyan')}>
    <I name="pin" size={11} />{zona}
  </span>
);

export const fmt = n => n.toLocaleString('pt-BR');

/* -------- Visão da rede -------- */
export const AdminRedeDashboard = ({ openEscola }) => {
  const D = DATA;
  const r = D.rede();
  const escolas = D.escolasFull();
  const ranking = [...escolas].sort((a, b) => b.totAlunos - a.totAlunos);
  const urbanas = escolas.filter(e => e.zona === 'Urbana');
  const rurais = escolas.filter(e => e.zona === 'Rural');
  const sumAl = arr => arr.reduce((s, e) => s + e.totAlunos, 0);

  // análise das habilidades direcionadas pela rede (planejamentos ativos), por matriz
  const ativos = (D.PLANEJAMENTOS || []).filter(p => p.status === 'ativo');
  const habsDirecionadas = [...new Set(ativos.flatMap(p => p.habilidades))];
  const totDirecionamentos = ativos.reduce((s, p) => s + p.habilidades.length, 0);
  const porMatriz = (D.MATRIZES || [])
    .map(m => ({ id: m.id, nome: m.nome, cor: m.cor, n: habsDirecionadas.filter(c => (D.habByCod[c] || {}).matriz === m.id).length }))
    .filter(m => m.n > 0);
  const maxMat = Math.max(1, ...porMatriz.map(m => m.n));

  return (
    <div className="fade-in">
      <PageHeader
        title="Visão da rede"
        subtitle={`${D.REDE.secretaria} · ${D.REDE.municipio}/${D.REDE.uf} · ano letivo ${D.REDE.ano}. Indicadores da rede de ensino.`}
        actions={<>
          <button className="btn btn-ghost"><I name="download" size={16} />Relatório da rede</button>
          <button className="btn btn-primary" onClick={() => openEscola(null)}><I name="school" size={16} />Gerenciar escolas</button>
        </>}
      />

      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Escolas" value={r.escolas} sub={`${urbanas.length} urbanas · ${rurais.length} rurais`} icon="school" accent="#2563eb" />
        <Stat label="Alunos matriculados" value={fmt(r.alunos)} sub="anos iniciais" icon="users" accent="#6d4bd1" />
        <Stat label="Turmas" value={r.turmas} sub="na rede" icon="grid" accent="#0e8aa8" />
        <Stat label="Professores" value={r.professores} sub="ativos" icon="grad" accent="#15935f" />
      </div>

      {/* Análise das habilidades direcionadas */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Análise das habilidades direcionadas</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
              {ativos.length} planejamento{ativos.length === 1 ? '' : 's'} ativo{ativos.length === 1 ? '' : 's'} · {habsDirecionadas.length} habilidades distintas direcionadas, por matriz de referência
            </p>
          </div>
        </div>
        {porMatriz.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nenhuma habilidade direcionada no momento.</div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 16 }}>
            {porMatriz.map(m => (
              <div key={m.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <MatrizBadge matriz={m.id} />
                  <span className="num" style={{ fontWeight: 800, fontSize: 15 }}>{m.n}<span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)' }}> hab.</span></span>
                </div>
                <div style={{ height: 9, borderRadius: 20, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (m.n / maxMat * 100) + '%', borderRadius: 20, background: m.cor }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
          Total de direcionamentos (habilidade × planejamento): <b className="num" style={{ color: 'var(--text-2)' }}>{totDirecionamentos}</b>
        </div>
      </div>

      {/* Ranking de escolas */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15 }}>Desempenho por escola</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Escolas da rede ordenadas por número de alunos</p>
        </div>
        <table className="tbl">
          <thead><tr><th style={{ width: 34 }}>#</th><th>Escola</th><th>Zona</th><th style={{ textAlign: 'center' }}>Alunos</th><th></th></tr></thead>
          <tbody>
            {ranking.map((e, i) => (
              <tr key={e.id} className="clickable" onClick={() => openEscola(e.id)}>
                <td className="num" style={{ color: 'var(--text-3)', fontWeight: 700 }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flex: 'none' }}>{e.sigla}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.nome}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{e.bairro}</div>
                    </div>
                  </div>
                </td>
                <td><ZonaBadge zona={e.zona} /></td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{e.totAlunos}</td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo por zona */}
      <div className="grid grid-cols-2">
        {[['Urbana', urbanas], ['Rural', rurais]].map(([z, arr]) => (
          <div key={z} className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ZonaBadge zona={z} /><span style={{ fontWeight: 700 }}>{arr.length} escolas</span></div>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{fmt(sumAl(arr))} alunos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------- Escolas (listagem) -------- */
export const AdminEscolas = ({ openEscola }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const criar = f => adminCriarEscola({ nome: f.nome.trim(), sigla: f.sigla.trim(), zona: f.zona, bairro: f.bairro, diretor: f.diretor, cor: f.cor });
  const salvarEdicao = f => adminEditarEscola(editar.id, { nome: f.nome.trim(), sigla: f.sigla.trim(), zona: f.zona, bairro: f.bairro, diretor: f.diretor, cor: f.cor });
  const excluir = async e => {
    if (e.totTurmas > 0) return alert(`A escola "${e.nome}" tem ${e.totTurmas} turma(s). Exclua ou transfira as turmas antes.`);
    if (!window.confirm(`Excluir a escola "${e.nome}"?`)) return;
    try { await adminExcluirEscola(e.id); } catch (err) { alert(err.message); }
  };
  return (
    <div className="fade-in">
      <PageHeader title="Escolas" subtitle="Unidades escolares da rede municipal. Selecione uma escola para ver turmas, alunos e indicadores."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Nova escola</button>} />
      <div className="grid grid-cols-3">
        {escolas.map(e => (
          <div key={e.id} className="card card-pad" onClick={() => openEscola(e.id)} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
            onMouseEnter={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow-sm)'; ev.currentTarget.style.transform = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{e.sigla}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25 }}>{e.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}><I name="pin" size={12} />{e.bairro}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={ev => ev.stopPropagation()}>
                <ZonaBadge zona={e.zona} />
                <button className="icon-btn" title="Editar escola" onClick={() => setEditar(e)}><I name="edit" size={14} /></button>
                <button className="icon-btn" title="Excluir escola" onClick={() => excluir(e)}><I name="x" size={14} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, paddingTop: 4 }}>
              {[['Turmas', e.totTurmas], ['Alunos', e.totAlunos], ['Professores', e.professores]].map((s, i) => (
                <div key={i}><div className="num" style={{ fontSize: 18, fontWeight: 800 }}>{s[1]}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s[0]}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
              <span>Dir. {e.diretor}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>Abrir<I name="chevR" size={14} /></span>
            </div>
          </div>
        ))}
      </div>

      {novo && <EscolaForm titulo="Nova escola" onClose={() => setNovo(false)} onSave={criar}
        inicial={{ nome: '', sigla: '', zona: 'Urbana', bairro: '', diretor: '', cor: PALETA_ESC[0] }} />}
      {editar && <EscolaForm titulo={'Editar — ' + editar.nome} onClose={() => setEditar(null)} onSave={salvarEdicao}
        inicial={{ nome: editar.nome, sigla: editar.sigla, zona: editar.zona, bairro: editar.bairro || '', diretor: editar.diretor || '', cor: editar.cor || PALETA_ESC[0] }} />}
    </div>
  );
};
