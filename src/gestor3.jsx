/* ============================================================
   Gestor (parte 3) — Professores & turmas, Períodos avaliativos
   ============================================================ */
import React from 'react';
import { DATA } from './data.js';
import { PageHeader, I, Avatar, Bar } from './ui.jsx';

/* -------- Professores & turmas -------- */
export const ProfessoresTurmas = ({ openAluno }) => {
  const D = DATA;
  const progresso = { p1: 67, p2: 50, p3: 33 };
  const avals = { p1: 10, p2: 6, p3: 3 };
  return (
    <div className="fade-in">
      <PageHeader title="Professores & turmas" subtitle="Acompanhe o trabalho de cada professor: habilidades trabalhadas, avaliações realizadas e regularidade." />
      <div className="card" style={{ marginBottom: 18 }}>
        <table className="tbl">
          <thead><tr><th>Professor</th><th>Componente</th><th>Turma</th><th>Progresso</th><th style={{ textAlign: 'center' }}>Avaliações</th><th></th></tr></thead>
          <tbody>
            {D.PROFESSORES.map(p => {
              const pl = D.PLANEJAMENTOS.find(x => x.prof === p.id);
              return (
                <tr key={p.id} className="clickable">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar {...p} size={34} />
                      <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    </div>
                  </td>
                  <td><span className={'badge ' + (p.comp === 'lp' ? 'badge-blue' : 'badge-gray')} style={p.comp !== 'lp' ? { background: 'var(--violet-bg)', color: 'var(--violet)' } : {}}>{D.compNome(p.comp)}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{pl ? D.turmaNome(pl.turma) : '—'}</td>
                  <td style={{ minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}><Bar value={progresso[p.id]} color={p.cor} /></div>
                      <span className="num" style={{ fontWeight: 700, fontSize: 12.5, width: 34 }}>{progresso[p.id]}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}><span className="num" style={{ fontWeight: 700 }}>{avals[p.id]}</span></td>
                  <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Alunos · {D.TURMA_ATUAL?.nome || 'turma'}{D.TURMA_ATUAL?.escolaNome ? ' · ' + D.TURMA_ATUAL.escolaNome : ''}</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 40 }}>Nº</th><th>Aluno</th><th></th></tr></thead>
          <tbody>
            {D.alunosT1.slice(0, 8).map(a => {
              return (
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
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '12px 22px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-subtle btn-sm">Ver todos os {D.alunosT1.length} alunos</button>
        </div>
      </div>
    </div>
  );
};

/* -------- Períodos avaliativos -------- */
export const Periodos = () => {
  const D = DATA;
  return (
    <div className="fade-in">
      <PageHeader title="Períodos avaliativos" subtitle="Configure os períodos avaliativos do ano letivo." />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {D.PERIODOS.map(p => (
          <div key={p.id} className="card card-pad" style={{ borderColor: p.atual ? 'var(--primary)' : 'var(--border)', borderWidth: p.atual ? 1.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14.5 }}>{p.nome}</h3>
              {p.atual && <span className="badge badge-blue">Atual</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <I name="calendar" size={14} />{p.inicio} – {p.fim}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
