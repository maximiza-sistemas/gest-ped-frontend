/* ============================================================
   Gestor (parte 3) — Professores & turmas, Períodos avaliativos
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, fetchProfessoresResumo } from './store.js';
import { PageHeader, I, Avatar, Bar } from './ui.jsx';

/* -------- Professores & turmas (dados reais de GET /professores/resumo) -------- */
export const ProfessoresTurmas = ({ openAluno }) => {
  const D = DATA;
  const [resumo, setResumo] = useState(null); // null = carregando
  const [erro, setErro] = useState(null);
  useEffect(() => {
    let ativo = true;
    fetchProfessoresResumo()
      .then(r => { if (ativo) setResumo(r || []); })
      .catch(err => { if (ativo) { setErro(err.message); setResumo([]); } });
    return () => { ativo = false; };
  }, []);

  const corProgresso = pct => (pct >= 70 ? '#15935f' : pct >= 40 ? '#c77a07' : '#d3433a');

  return (
    <div className="fade-in">
      <PageHeader title="Professores & turmas" subtitle="Acompanhe o trabalho de cada professor: habilidades direcionadas já verificadas, avaliações registradas e alunos avaliados." />
      <div className="card" style={{ marginBottom: 18 }}>
        {resumo === null && <div style={{ padding: '18px 22px', color: 'var(--text-3)', fontSize: 13 }}>Carregando…</div>}
        {erro && <div style={{ padding: '14px 22px', color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>{erro}</div>}
        {resumo !== null && (
          <table className="tbl">
            <thead><tr>
              <th>Professor</th><th>Componente</th><th>Turmas</th>
              <th>Habilidades direcionadas verificadas</th>
              <th style={{ textAlign: 'center' }}>Avaliações</th>
              <th>Última avaliação</th>
            </tr></thead>
            <tbody>
              {resumo.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Nenhum professor com turmas no seu escopo.</td></tr>
              )}
              {resumo.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar nome={p.nome} iniciais={p.iniciais} cor={p.cor} size={34} />
                      <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{D.compNome(p.comp)}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>
                    {p.turmas.length === 0 ? '—' : p.turmas.map(t => (
                      <div key={t.id}>{D.turmaRotulo(t.nome)} <span style={{ color: 'var(--text-4)', fontSize: 11.5 }}>· {t.escolaNome} · {t.alunos} alunos</span></div>
                    ))}
                  </td>
                  <td style={{ minWidth: 200 }}>
                    {p.progresso == null ? (
                      <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Sem habilidades direcionadas</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}><Bar value={p.progresso} color={corProgresso(p.progresso)} /></div>
                        <span className="num" style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap' }}>{p.habilidadesTrabalhadas}/{p.habilidadesDirecionadas} · {p.progresso}%</span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="num" style={{ fontWeight: 700 }}>{p.avaliacoes}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{p.alunosAvaliados} aluno{p.alunosAvaliados === 1 ? '' : 's'}</div>
                  </td>
                  <td className="num" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{p.ultimaAvaliacao || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Alunos · {D.TURMA_ATUAL ? D.turmaRotulo(D.TURMA_ATUAL.nome) : 'turma'}{D.TURMA_ATUAL?.escolaNome ? ' · ' + D.TURMA_ATUAL.escolaNome : ''} · {D.alunosT1.length}</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 40 }}>Nº</th><th>Aluno</th><th></th></tr></thead>
          <tbody>
            {D.alunosT1.map(a => (
              <tr key={a.id} className="clickable" onClick={() => openAluno(a.id)}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{String(a.numero).padStart(2, '0')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} />
                    <span style={{ fontWeight: 600 }}>{a.nome}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Períodos avaliativos -------- */
export const Periodos = ({ irParaPlanejamentos }) => {
  const D = DATA;
  return (
    <div className="fade-in">
      <PageHeader title="Períodos avaliativos" subtitle="Períodos avaliativos do ano letivo. Clique em um mês para ver os planejamentos direcionados nele." />
      <div className="grid grid-cols-4">
        {D.PERIODOS.map(p => {
          const n = D.PLANEJAMENTOS.filter(pl => pl.periodo === p.id).length;
          return (
            <div key={p.id} className="card card-pad" onClick={() => irParaPlanejamentos && irParaPlanejamentos(p.id)}
              style={{ borderColor: p.atual ? 'var(--primary)' : 'var(--border)', borderWidth: p.atual ? 1.5 : 1, cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 14.5 }}>{p.nome}</h3>
                {p.atual && <span className="badge badge-blue">Atual</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <I name="calendar" size={14} />{p.inicio} – {p.fim}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{n} planejamento{n === 1 ? '' : 's'}</span>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>Ver planejamentos<I name="chevR" size={14} /></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
