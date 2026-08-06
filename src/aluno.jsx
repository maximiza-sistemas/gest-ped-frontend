/* ============================================================
   Ficha individual do aluno
   ============================================================ */
import React, { useState } from 'react';
import { DATA } from './data.js';
import { I, Avatar, Stat, ResultadoBadge } from './ui.jsx';

/* -------- Ficha individual do aluno -------- */
export const FichaAluno = ({ alunoId, back }) => {
  const D = DATA;
  const a = D.ALUNOS.find(x => x.id === alunoId);
  const avalAluno = (a && D.AVALIACOES[a.id]) || {};
  // habilidades efetivamente avaliadas para este aluno
  const habs = Object.keys(avalAluno).filter(h => (avalAluno[h] || []).length > 0);
  const [tab, setTab] = useState('desempenho');

  if (!a) return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>
      <div className="card card-pad">Aluno não encontrado.</div>
    </div>
  );

  // todas as avaliações achatadas
  const todas = [];
  habs.forEach(h => (avalAluno[h] || []).forEach(av => todas.push({ hab: h, ...av })));
  todas.sort((x, y) => {
    const p = s => s.split('/').reverse().join('');
    return p(y.data).localeCompare(p(x.data));
  });
  const atingiu = todas.filter(t => t.resultado === 2).length;
  const pctAtingiu = todas.length ? Math.round((atingiu / todas.length) * 100) : 0;
  const ultima = todas[0] ? todas[0].data : '—';
  const tabs = [['desempenho', 'Desempenho por habilidade'], ['historico', 'Histórico de avaliações']];

  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>

      {/* cabeçalho */}
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <Avatar nome={a.nome} iniciais={a.iniciais} cor="#475569" size={64} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>{a.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip">Nº {String(a.numero).padStart(2, '0')}</span>
            <span className="chip"><I name="users" size={13} />1º Ano A · Matutino</span>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Habilidades avaliadas" value={habs.length} icon="skills" accent="#2563eb" />
        <Stat label="Total de avaliações" value={todas.length} icon="check" accent="#0e8aa8" />
        <Stat label="Atingiu o esperado" value={pctAtingiu + '%'} sub={`${atingiu} de ${todas.length}`} icon="target" accent="#15935f" />
        <Stat label="Última avaliação" value={ultima} icon="calendar" accent="#7c5cff" />
      </div>

      {/* tabs */}
      <div className="seg" style={{ marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t[0]} className={tab === t[0] ? 'active' : ''} onClick={() => setTab(t[0])}>{t[1]}</button>
        ))}
      </div>

      {tab === 'desempenho' && (
        <div className="grid fade-in grid-cols-2">
          {habs.map(h => {
            const avs = avalAluno[h] || [];
            const last = avs[avs.length - 1];
            return (
              <div key={h} className="card card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <span className="code-pill">{h}</span>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 7, lineHeight: 1.4 }}>{D.habByCod[h].desc}</p>
                  </div>
                  {last && <ResultadoBadge r={last.resultado} />}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 8 }}>{avs.length} avaliações registradas</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {avs.map((av, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }} title={av.data}>
                      <div style={{ height: 36, borderRadius: 6, background: { 1: 'var(--red)', 2: 'var(--green)' }[av.resultado], opacity: .85, marginBottom: 5 }} />
                      <div className="num" style={{ fontSize: 10, color: 'var(--text-3)' }}>{av.data.slice(0, 5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'historico' && (
        <div className="card fade-in">
          <table className="tbl">
            <thead><tr><th>Data</th><th>Habilidade</th><th>Descrição</th><th style={{ textAlign: 'right' }}>Resultado</th></tr></thead>
            <tbody>
              {todas.map((t, i) => (
                <tr key={i}>
                  <td className="num" style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{t.data}</td>
                  <td><span className="code-pill">{t.hab}</span></td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{D.habByCod[t.hab].desc}</td>
                  <td style={{ textAlign: 'right' }}><ResultadoBadge r={t.resultado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
