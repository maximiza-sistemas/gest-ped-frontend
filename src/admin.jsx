/* ============================================================
   Admin — primitivos compartilhados + Visão da rede + Escolas
   ============================================================ */
import React from 'react';
import { DATA } from './data.js';
import { PageHeader, Stat, Donut, Bar, I, ICONS } from './ui.jsx';

// ícones extras (registrados no catálogo compartilhado de ícones)
ICONS.school = ['M3 21h18', 'M5 21V8l7-5 7 5v13', 'M9 21v-6h6v6', 'M9 11h.01M15 11h.01'];
ICONS.pin = ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
ICONS.grid = ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'];

/* barra de distribuição empilhada (6 níveis) */
export const DistBar = ({ dist, height = 10, radius = 6 }) => {
  const D = DATA;
  const total = dist.reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ display: 'flex', height, borderRadius: radius, overflow: 'hidden', background: 'var(--surface-3)' }}>
      {D.NIVEIS.map((n, i) => dist[i] > 0 && (
        <div key={n.id} title={`${n.nome}: ${dist[i]}`} style={{ width: (dist[i] / total * 100) + '%', background: n.cor }} />
      ))}
    </div>
  );
};

export const NiveisLegend = ({ compact }) => {
  const D = DATA;
  return (
    <div style={{ display: 'flex', gap: compact ? 12 : 18, flexWrap: 'wrap' }}>
      {D.NIVEIS.map(n => (
        <span key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: n.cor, flex: 'none' }} />
          <span style={{ color: 'var(--text-2)' }}>{compact ? n.curto : n.nome}</span>
        </span>
      ))}
    </div>
  );
};

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
  const totalDist = r.dist.reduce((a, b) => a + b, 0);
  const ranking = [...escolas].sort((a, b) => b.alfInicial - a.alfInicial);
  const urbanas = escolas.filter(e => e.zona === 'Urbana');
  const rurais = escolas.filter(e => e.zona === 'Rural');
  const sumAl = arr => arr.reduce((s, e) => s + e.totAlunos, 0);

  return (
    <div className="fade-in">
      <PageHeader
        title="Visão da rede"
        subtitle={`${D.REDE.secretaria} · ${D.REDE.municipio}/${D.REDE.uf} · ano letivo ${D.REDE.ano}. Acompanhe a alfabetização e os níveis de leitura em todas as escolas.`}
        actions={<>
          <button className="btn btn-ghost"><I name="download" size={16} />Relatório da rede</button>
          <button className="btn btn-primary" onClick={() => openEscola(null)}><I name="school" size={16} />Gerenciar escolas</button>
        </>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Escolas" value={r.escolas} sub={`${urbanas.length} urbanas · ${rurais.length} rurais`} icon="school" accent="#2563eb" />
        <Stat label="Alunos matriculados" value={fmt(r.alunos)} sub="anos iniciais" icon="users" accent="#6d4bd1" />
        <Stat label="Turmas" value={r.turmas} sub="na rede" icon="grid" accent="#0e8aa8" />
        <Stat label="Professores" value={r.professores} sub="ativos" icon="grad" accent="#15935f" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.3fr', marginBottom: 18 }}>
        {/* Alfabetização */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Alfabetização nos anos iniciais</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16 }}>% de alunos do 1º ao 3º ano que leem frases ou textos</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut size={140} thickness={20} centerLabel={r.alfInicial + '%'} centerSub="alfabetizados"
              segments={[{ value: r.alfInicial, color: 'var(--primary)' }, { value: 100 - r.alfInicial, color: 'var(--surface-3)' }]} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Meta da rede para 2026</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span className="num" style={{ fontSize: 22, fontWeight: 800 }}>70%</span>
                <span style={{ fontSize: 12, color: r.alfInicial >= 70 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                  {r.alfInicial >= 70 ? 'meta atingida' : `faltam ${70 - r.alfInicial} p.p.`}
                </span>
              </div>
              <Bar value={r.alfInicial} height={9} color={r.alfInicial >= 70 ? 'var(--green)' : 'var(--primary)'} />
            </div>
          </div>
        </div>

        {/* Distribuição de leitura da rede */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Níveis de leitura na rede</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{fmt(totalDist)} alunos classificados</p>
            </div>
          </div>
          <div style={{ display: 'flex', height: 32, borderRadius: 9, overflow: 'hidden', marginBottom: 16 }}>
            {D.NIVEIS.map((n, i) => r.dist[i] > 0 && (
              <div key={n.id} title={n.nome} style={{ width: (r.dist[i] / totalDist * 100) + '%', background: n.cor, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {Math.round(r.dist[i] / totalDist * 100)}%
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {D.NIVEIS.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: n.cor, flex: 'none' }} />
                <span style={{ flex: 1, color: 'var(--text-2)' }}>{n.nome}</span>
                <span className="num" style={{ fontWeight: 700 }}>{fmt(r.dist[i])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking de escolas */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Desempenho por escola</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Ordenado por taxa de alfabetização nos anos iniciais</p>
          </div>
          <NiveisLegend compact />
        </div>
        <table className="tbl">
          <thead><tr><th style={{ width: 34 }}>#</th><th>Escola</th><th>Zona</th><th style={{ textAlign: 'center' }}>Alunos</th><th style={{ width: 200 }}>Distribuição de leitura</th><th style={{ textAlign: 'right' }}>Alfabetização</th><th></th></tr></thead>
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
                <td><DistBar dist={e.dist} /></td>
                <td style={{ textAlign: 'right' }}>
                  <span className={'badge ' + (e.alfInicial >= 70 ? 'badge-green' : e.alfInicial >= 50 ? 'badge-amber' : 'badge-red')} style={{ fontSize: 12.5 }}>{e.alfInicial}%</span>
                </td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparativo urbana x rural */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {[['Urbana', urbanas], ['Rural', rurais]].map(([z, arr]) => (
          <div key={z} className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ZonaBadge zona={z} /><span style={{ fontWeight: 700 }}>{arr.length} escolas</span></div>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{fmt(sumAl(arr))} alunos</span>
            </div>
            <DistBar dist={arr.reduce((acc, e) => acc.map((v, i) => v + e.dist[i]), [0, 0, 0, 0, 0, 0])} height={24} radius={8} />
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-2)' }}>
              Alfabetização média: <b className="num">{Math.round(arr.reduce((s, e) => s + e.alfInicial, 0) / arr.length)}%</b>
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
  return (
    <div className="fade-in">
      <PageHeader title="Escolas" subtitle="Unidades escolares da rede municipal. Selecione uma escola para ver turmas, alunos e indicadores."
        actions={<button className="btn btn-primary"><I name="plus" size={15} />Nova escola</button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {escolas.map(e => (
          <button key={e.id} className="card card-pad" onClick={() => openEscola(e.id)} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, transition: 'box-shadow .15s, transform .15s' }}
            onMouseEnter={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow-sm)'; ev.currentTarget.style.transform = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{e.sigla}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25 }}>{e.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}><I name="pin" size={12} />{e.bairro}</div>
              </div>
              <ZonaBadge zona={e.zona} />
            </div>
            <div style={{ display: 'flex', gap: 18, paddingTop: 4 }}>
              {[['Turmas', e.totTurmas], ['Alunos', e.totAlunos], ['Professores', e.professores]].map((s, i) => (
                <div key={i}><div className="num" style={{ fontSize: 18, fontWeight: 800 }}>{s[1]}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s[0]}</div></div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>
                <span>Alfabetização (1º–3º)</span><span className="num" style={{ fontWeight: 700, color: 'var(--text)' }}>{e.alfInicial}%</span>
              </div>
              <DistBar dist={e.dist} height={8} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
              <span>Dir. {e.diretor}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>Abrir<I name="chevR" size={14} /></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
