/* ============================================================
   Módulo Gestor — Dashboard + Planejamentos
   ============================================================ */
import React, { useState } from 'react';
import { DATA } from './data.js';
import { PageHeader, I, Stat, Bar, Donut, VBars, LineChart, MatrizBadge, Avatar } from './ui.jsx';
import { NovoPlanejamento } from './gestor2.jsx';

/* -------- Dashboard consolidado -------- */
export const GestorDashboard = ({ go }) => {
  const D = DATA;
  const dist = D.distribuicaoNiveis(D.alunosT1);
  const totalAlunos = D.alunosT1.length;

  // % habilidades trabalhadas por professor
  const porProf = [
    { label: 'Helena Martins', value: 67, display: '67%', color: '#2563eb', sub: 'LP · 1º Ano A' },
    { label: 'Rafael Souza',   value: 50, display: '50%', color: '#6d4bd1', sub: 'MAT · 1º Ano A' },
    { label: 'Beatriz Almeida',value: 33, display: '33%', color: '#0e8aa8', sub: 'LP · 1º Ano B' },
  ];
  // avaliações por habilidade (turma 1A LP)
  const avalHab = [
    { label: 'LP01', value: 3 }, { label: 'LP02', value: 2 }, { label: 'LP04', value: 4 },
    { label: 'LP07', value: 1 }, { label: 'LP01b', value: 0, color: 'var(--border-strong)' },
  ];
  const niveisSeg = D.NIVEIS.map((n, i) => ({ label: n.curto, value: dist[i], color: n.cor }));

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard consolidado"
        subtitle="Acompanhe o andamento de planejamentos, habilidades trabalhadas e evolução dos níveis de leitura das turmas sob sua responsabilidade."
        actions={<>
          <button className="btn btn-ghost"><I name="download" size={16} />Exportar relatório</button>
          <button className="btn btn-primary" onClick={() => go('planejamentos')}><I name="plus" size={16} />Novo planejamento</button>
        </>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Planejamentos ativos" value={D.PLANEJAMENTOS.filter(p => p.status === 'ativo').length} sub="1º Bimestre · 2 turmas" icon="plan" accent="#2563eb" />
        <Stat label="Habilidades direcionadas" value={D.PLANEJAMENTOS.reduce((s, p) => s + p.habilidades.length, 0)} sub="4 matrizes de referência" icon="skills" accent="#6d4bd1" />
        <Stat label="Habilidades trabalhadas" value="54%" delta={12} sub="entre as iniciadas" icon="target" accent="#15935f" />
        <Stat label="Avaliações registradas" value="68" delta={9} sub="nos últimos 30 dias" icon="check" accent="#0e8aa8" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 18 }}>
        {/* Habilidades trabalhadas por professor */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Habilidades trabalhadas por professor</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Percentual do planejamento já iniciado no período</p>
            </div>
            <button className="btn btn-subtle btn-sm" onClick={() => go('professores')}>Detalhes<I name="chevR" size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {porProf.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.label}</span>
                    <span className="chip" style={{ fontSize: 11, padding: '1px 8px' }}>{p.sub}</span>
                  </div>
                  <span className="num" style={{ fontWeight: 800, fontSize: 15 }}>{p.display}</span>
                </div>
                <Bar value={p.value} color={p.color} height={9} />
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição de leitura */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Distribuição de leitura</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>1º Ano A · {totalAlunos} alunos</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Donut segments={niveisSeg} centerLabel={totalAlunos} centerSub="alunos" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {D.NIVEIS.map((n, i) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: n.cor, flex: 'none' }} />
                  <span style={{ flex: 1, color: 'var(--text-2)' }}>{n.nome}</span>
                  <span className="num" style={{ fontWeight: 700 }}>{dist[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
        {/* Aderência ao planejamento */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Aderência ao planejamento</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 18 }}>Planejado pelo gestor × executado pelo professor</p>
          {[
            { l: 'Helena Martins · LP', plan: 6, exec: 4 },
            { l: 'Rafael Souza · MAT', plan: 4, exec: 2 },
            { l: 'Beatriz Almeida · LP', plan: 3, exec: 1 },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{r.l}</span>
                <span className="num" style={{ color: 'var(--text-3)' }}>{r.exec}/{r.plan} habilidades</span>
              </div>
              <div style={{ position: 'relative', height: 9, borderRadius: 20, background: 'var(--surface-3)' }}>
                <div style={{ position: 'absolute', inset: 0, width: '100%', borderRadius: 20, background: 'repeating-linear-gradient(90deg,var(--primary-100),var(--primary-100) 6px,transparent 6px,transparent 12px)' }} />
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (r.exec / r.plan * 100) + '%', borderRadius: 20, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11.5, color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 8, borderRadius: 3, background: 'var(--primary)' }} />Executado</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 8, borderRadius: 3, background: 'var(--primary-100)' }} />Planejado</span>
          </div>
        </div>

        {/* Avaliações por habilidade */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Avaliações por habilidade</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 6 }}>Quantas vezes cada habilidade foi avaliada · LP · 1º Ano A</p>
          <VBars data={avalHab.map(d => ({ ...d, label: d.label.replace('b', '') }))} height={170} />
        </div>
      </div>

      {/* Habilidades por matriz de referência */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Habilidades por matriz de referência</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Acompanhamento vinculado a BNCC, SAEB, SEAMA e Habilidades Leitoras</p>
          </div>
          <button className="btn btn-subtle btn-sm" onClick={() => go('habilidades')}>Ver catálogo<I name="chevR" size={14} /></button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {D.MATRIZES.map(m => {
            const vinc = D.PLANEJAMENTOS.reduce((s, p) => s + p.habilidades.filter(c => (D.habByCod[c] || {}).matriz === m.id).length, 0);
            const tot = D.HABILIDADES.filter(h => h.matriz === m.id).length;
            return (
              <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, borderTop: '3px solid ' + m.cor }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <MatrizBadge matriz={m.id} />
                  <span className="num" style={{ fontSize: 22, fontWeight: 800 }}>{vinc}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10, lineHeight: 1.35, minHeight: 32 }}>{m.desc}</div>
                <Bar value={tot ? (vinc / tot * 100) : 0} color={m.cor} height={7} />
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 7 }}>{vinc} de {tot} habilidades vinculadas</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolução temporal dos níveis de leitura */}
      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Evolução dos níveis de leitura</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Nível médio da turma 1º Ano A ao longo do bimestre</p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: '#2563eb' }} />1º Ano A</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: '#6d4bd1' }} />1º Ano B</span>
          </div>
        </div>
        <LineChart
          labels={['08/02', '24/02', '14/03', '02/04', '17/04']}
          yMax={6}
          yLabels={['', 'N.lê', 'Síl', 'Pal', 'Fra', 'T-sf', 'T-cf']}
          series={[
            { color: '#2563eb', data: [2.2, 2.6, 2.9, 3.1, 3.3] },
            { color: '#6d4bd1', data: [1.9, 2.2, 2.5, 2.8, 3.0] },
          ]}
        />
      </div>
    </div>
  );
};

/* -------- Planejamentos -------- */
export const Planejamentos = ({ go, openPlan }) => {
  const D = DATA;
  const [novo, setNovo] = useState(false);
  const podeCriar = ['admin', 'secretaria'].includes(D.CURRENT_USER?.perfil);
  const anosTxt = pl => pl.anos && pl.anos.length ? pl.anos.map(a => a + 'º').join(', ') + ' ano' : 'Todas as séries';
  const statusBadge = s => s === 'ativo' ? ['badge-green', 'Ativo'] : s === 'arquivado' ? ['badge-gray', 'Arquivado'] : ['badge-blue', 'Concluído'];

  return (
    <div className="fade-in">
      <PageHeader
        title="Planejamentos"
        subtitle={podeCriar
          ? 'Direcione as habilidades e a expectativa de aprendizagem por mês, série e grupo de escolas. Cada professor complementa com as sequências didáticas semanais.'
          : 'Planejamentos mensais direcionados pela Secretaria de Educação. Acompanhe as habilidades e as sequências didáticas dos professores.'}
        actions={podeCriar ? <button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={16} />Novo planejamento</button> : null}
      />

      {D.PLANEJAMENTOS.length === 0 && !podeCriar ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '54px 24px', color: 'var(--text-2)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="plan" size={28} /></div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhum planejamento no momento</h3>
          <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>Quando a Secretaria de Educação publicar planejamentos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {D.PLANEJAMENTOS.map(pl => {
            const [scls, slbl] = statusBadge(pl.status);
            return (
              <div key={pl.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', overflow: 'hidden' }}
                onClick={() => openPlan(pl.id)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ height: 5, background: pl.grupoCor || 'var(--primary)' }} />
                <div className="card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                    <span className="chip"><I name="calendar" size={13} />{D.periodoNome(pl.periodo)}</span>
                    <span className={'badge ' + scls}>{slbl}</span>
                  </div>
                  <h3 style={{ fontSize: 15.5, marginBottom: 8, lineHeight: 1.3 }}>{pl.titulo}</h3>
                  {pl.objetivo && <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pl.objetivo}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span className="chip"><I name="grad" size={13} />{anosTxt(pl)}</span>
                    {pl.grupoNome && <span className="chip"><I name="layers" size={13} />{pl.grupoNome}</span>}
                    <span className="chip"><I name="skills" size={13} />{pl.habilidades.length} habilidades</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: pl.nSemanas > 0 ? 'var(--green-bg)' : 'var(--surface-3)', color: pl.nSemanas > 0 ? 'var(--green)' : 'var(--text-3)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name="list" size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{pl.nSemanas || 0} {pl.nSemanas === 1 ? 'sequência semanal' : 'sequências semanais'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Criado em {pl.criadoEm}</div>
                    </div>
                    <I name="chevR" size={17} style={{ color: 'var(--text-4)' }} />
                  </div>
                </div>
              </div>
            );
          })}

          {podeCriar && (
            <button onClick={() => setNovo(true)} className="card" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 240, color: 'var(--text-2)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                <I name="plus" size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Novo planejamento</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Mês, série, grupo e habilidades</div>
              </div>
            </button>
          )}
        </div>
      )}

      {novo && <NovoPlanejamento onClose={() => setNovo(false)} />}
    </div>
  );
};
