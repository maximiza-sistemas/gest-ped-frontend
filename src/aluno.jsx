/* ============================================================
   Ficha individual do aluno
   ============================================================ */
import React, { useState } from 'react';
import { DATA } from './data.js';
import { I, Avatar, Stat, ResultadoBadge, LineChart, NivelPill } from './ui.jsx';

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
  const nivelLabels = ['', 'N.lê', 'Síl', 'Pal', 'Fra', 'T-sf', 'T-cf'];

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
            <span className="chip"><I name="book" size={13} />Leitura: {D.nivel(a.nivelLeitura).nome}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost"><I name="download" size={15} />Relatório do aluno</button>
        </div>
      </div>

      {/* stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Habilidades avaliadas" value={habs.length} icon="skills" accent="#2563eb" />
        <Stat label="Total de avaliações" value={todas.length} icon="check" accent="#0e8aa8" />
        <Stat label="Nível de leitura atual" value={D.nivel(a.nivelLeitura).curto} icon="book" accent={['','#d3433a','#e0822b','#d9b421','#2f9bb0','#2f74d0','#15935f'][a.nivelLeitura]} />
        <Stat label="Evolução no bimestre" value={'+' + (a.nivelLeitura - a.histNivel[0].nivel)} sub="níveis avançados" icon="trend" accent="#15935f" />
      </div>

      {/* tabs */}
      <div className="seg" style={{ marginBottom: 18 }}>
        {[['desempenho', 'Desempenho por habilidade'], ['leitura', 'Evolução de leitura'], ['historico', 'Histórico de avaliações']].map(t => (
          <button key={t[0]} className={tab === t[0] ? 'active' : ''} onClick={() => setTab(t[0])}>{t[1]}</button>
        ))}
      </div>

      {tab === 'desempenho' && (
        <div className="grid fade-in" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
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

      {tab === 'leitura' && (
        <div className="card card-pad fade-in">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Evolução do nível de leitura</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 18 }}>Histórico de classificação ao longo do bimestre</p>
          <LineChart
            labels={a.histNivel.map(h => h.data.slice(0, 5))}
            yMax={6} yLabels={nivelLabels}
            series={[{ color: 'var(--primary)', data: a.histNivel.map(h => h.nivel) }]}
            height={210}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {a.histNivel.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 13px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <span className="num" style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.data}</span>
                <NivelPill nivel={h.nivel} full />
              </div>
            ))}
          </div>
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
