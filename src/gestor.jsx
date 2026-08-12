/* ============================================================
   Módulo Gestor — Dashboard + Planejamentos
   ============================================================ */
import React, { useState } from 'react';
import { DATA } from './data.js';
import { PageHeader, I, Stat, Bar, VBars, MatrizBadge, Avatar, InfoDica } from './ui.jsx';
import { NovoPlanejamento } from './gestor2.jsx';
import { excluirPlanejamento } from './store.js';
import { EvolucaoEscopo } from './evolucao.jsx';

/* -------- Dashboard consolidado -------- */
export const GestorDashboard = ({ go }) => {
  const D = DATA;
  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Suas escolas, turmas e alunos: verificações contínuas, % de atingimento e planejamento."
        actions={
          <button className="btn btn-primary" onClick={() => go('planejamentos')}><I name="plan" size={16} />Ver planejamentos</button>
        }
      />

      <EvolucaoEscopo contagens secao>
      {/* Habilidades por matriz de referência — conteúdo do perfil, antes da seção Evolução */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              Habilidades por matriz de referência
              <InfoDica titulo="Habilidades por matriz" texto="Quantas habilidades de cada matriz de referência (BNCC, SAEB, SEAMA, CNCA) estão vinculadas aos planejamentos direcionados, sobre o total disponível no catálogo." />
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Acompanhamento vinculado a BNCC, SAEB, SEAMA e Habilidades Leitoras</p>
          </div>
          <button className="btn btn-subtle btn-sm" onClick={() => go('habilidades')}>Ver catálogo<I name="chevR" size={14} /></button>
        </div>
        <div className="grid grid-cols-4">
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
      </EvolucaoEscopo>
    </div>
  );
};

/* -------- Planejamentos -------- */
export const Planejamentos = ({ go, openPlan, periodoInicial }) => {
  const D = DATA;
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const [periodoSel, setPeriodoSel] = useState(periodoInicial || 'todos');
  const [escolaSel, setEscolaSel] = useState('todas');
  const [anoSel, setAnoSel] = useState('todos');
  const podeCriar = ['admin', 'secretaria'].includes(D.CURRENT_USER?.perfil);

  // filtros relacionados: a escola casa com o planejamento via grupo (grupo null = toda a rede)
  const grupoDaEscola = Object.fromEntries(D.ESCOLAS.map(e => [e.id, e.grupoId || null]));
  const casaMes = (pl, mes) => mes === 'todos' || pl.periodo === mes;
  const casaEscola = (pl, esc) => esc === 'todas' || !(pl.grupos || []).length || pl.grupos.some(g => g.id === grupoDaEscola[esc]);
  const casaAno = (pl, ano) => ano === 'todos' || !(pl.anos || []).length || pl.anos.includes(ano);

  // as opções de cada filtro consideram a seleção dos outros dois
  const mesesDisp = D.PERIODOS.filter(p => D.PLANEJAMENTOS.some(pl => pl.periodo === p.id && casaEscola(pl, escolaSel) && casaAno(pl, anoSel)));
  const escolasDisp = D.ESCOLAS.filter(e => D.PLANEJAMENTOS.some(pl => casaMes(pl, periodoSel) && casaEscola(pl, e.id) && casaAno(pl, anoSel)));
  const anosDisp = D.ANOS.filter(a => D.PLANEJAMENTOS.some(pl => casaMes(pl, periodoSel) && casaEscola(pl, escolaSel) && casaAno(pl, a.ordem)));
  // a opção selecionada continua visível mesmo quando os outros filtros a excluem
  const mesesOpts = periodoSel !== 'todos' && !mesesDisp.some(p => p.id === periodoSel) ? [...mesesDisp, D.PERIODOS.find(p => p.id === periodoSel)].filter(Boolean) : mesesDisp;
  const escolasOpts = escolaSel !== 'todas' && !escolasDisp.some(e => e.id === escolaSel) ? [...escolasDisp, D.ESCOLAS.find(e => e.id === escolaSel)].filter(Boolean) : escolasDisp;
  const anosOpts = anoSel !== 'todos' && !anosDisp.some(a => a.ordem === anoSel) ? [...anosDisp, D.ANOS.find(a => a.ordem === anoSel)].filter(Boolean) : anosDisp;

  const filtroAtivo = periodoSel !== 'todos' || escolaSel !== 'todas' || anoSel !== 'todos';
  const lista = D.PLANEJAMENTOS.filter(pl => casaMes(pl, periodoSel) && casaEscola(pl, escolaSel) && casaAno(pl, anoSel));
  const anosTxt = pl => pl.anos && pl.anos.length ? pl.anos.map(a => D.anoNome(a)).join(', ') : 'Todas as séries';
  const statusBadge = s => s === 'ativo' ? ['badge-green', 'Ativo'] : s === 'arquivado' ? ['badge-gray', 'Arquivado'] : ['badge-blue', 'Concluído'];
  const excluir = async pl => {
    if (!window.confirm(`Excluir o planejamento "${pl.titulo}"?\n\nAs habilidades vinculadas, as sequências didáticas semanais dos professores e os registros de verificação contínua deste planejamento serão removidos. Esta ação não pode ser desfeita.`)) return;
    try { await excluirPlanejamento(pl.id); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Planejamentos"
        subtitle={podeCriar
          ? 'Direcione as habilidades e a expectativa de aprendizagem por mês, série e grupo de escolas. Cada professor complementa com as sequências didáticas semanais.'
          : 'Planejamentos mensais direcionados pela Secretaria de Educação. Acompanhe as habilidades e as sequências didáticas dos professores.'}
        actions={podeCriar ? <button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={16} />Novo planejamento</button> : null}
      />

      {D.PLANEJAMENTOS.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="input" style={{ maxWidth: 200 }} value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}>
            <option value="todos">Todos os meses</option>
            {mesesOpts.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 250 }} value={escolaSel} onChange={e => setEscolaSel(e.target.value)}>
            <option value="todas">Todas as escolas</option>
            {escolasOpts.map(esc => <option key={esc.id} value={esc.id}>{esc.nome}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 170 }} value={anoSel} onChange={e => setAnoSel(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
            <option value="todos">Todos os anos</option>
            {anosOpts.map(a => <option key={a.ordem} value={a.ordem}>{a.nome}</option>)}
          </select>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {lista.length} planejamento{lista.length === 1 ? '' : 's'}
          </span>
          {filtroAtivo && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setPeriodoSel('todos'); setEscolaSel('todas'); setAnoSel('todos'); }}>
              <I name="x" size={13} />Limpar filtros
            </button>
          )}
        </div>
      )}

      {D.PLANEJAMENTOS.length === 0 && !podeCriar ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '54px 24px', color: 'var(--text-2)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="plan" size={28} /></div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhum planejamento no momento</h3>
          <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>Quando a Secretaria de Educação publicar planejamentos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {lista.map(pl => {
            const [scls, slbl] = statusBadge(pl.status);
            return (
              <div key={pl.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', overflow: 'hidden' }}
                onClick={() => openPlan(pl.id)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ height: 5, background: (pl.grupos && pl.grupos[0] && pl.grupos[0].cor) || 'var(--primary)' }} />
                <div className="card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                    <span className="chip"><I name="calendar" size={13} />{D.periodoNome(pl.periodo)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={'badge ' + scls}>{slbl}</span>
                      {podeCriar && (
                        <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                          <button className="icon-btn" title="Editar planejamento" onClick={() => setEditar(pl)}><I name="edit" size={14} /></button>
                          <button className="icon-btn" title="Excluir planejamento" onClick={() => excluir(pl)}><I name="x" size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 15.5, marginBottom: 8, lineHeight: 1.3 }}>{pl.titulo}</h3>
                  {pl.objetivo && <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pl.objetivo}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span className="chip"><I name="grad" size={13} />{anosTxt(pl)}</span>
                    <span className="chip"><I name="layers" size={13} />{(pl.grupos && pl.grupos.length) ? pl.grupos.map(g => g.nome).join(', ') : 'Toda a rede'}</span>
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

          {lista.length === 0 && (
            <div className="card card-pad" style={{ color: 'var(--text-3)', fontSize: 13.5, gridColumn: '1 / -1' }}>
              Nenhum planejamento{filtroAtivo ? ' com os filtros selecionados' : ''}.
            </div>
          )}

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
      {editar && <NovoPlanejamento plano={editar} onClose={() => setEditar(null)} />}
    </div>
  );
};
