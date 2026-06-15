/* ============================================================
   Módulo Professor — Meu painel + Verificação contínua
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, registrarAvaliacaoLote, fetchTurmaFull, fetchAvaliacoesTurma } from './store.js';
import { PageHeader, Stat, I, MatrizBadge, Bar, Avatar, ICONS } from './ui.jsx';

// ícone lock extra (registrado no catálogo compartilhado de ícones)
ICONS.lock = ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'];

// planejamento direcionado para o mês corrente (a secretaria direciona por mês,
// não mais por professor). Fallback: primeiro ativo / primeiro da lista.
export const meuPlano = () => {
  const mes = (DATA.PERIODOS.find(p => p.atual) || {}).id;
  const ativos = DATA.PLANEJAMENTOS.filter(p => p.status === 'ativo');
  return ativos.find(p => p.periodo === mes) || ativos[0] || DATA.PLANEJAMENTOS[0] || null;
};

/* -------- Meu painel -------- */
export const ProfessorPainel = ({ go }) => {
  const D = DATA;
  const pl = meuPlano();
  if (!pl) return (
    <div className="fade-in">
      <PageHeader title="Meu painel" subtitle="Habilidades direcionadas pela Secretaria de Educação para o mês." />
      <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="plan" size={28} /></div>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhum planejamento no momento</h3>
        <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>Quando a Secretaria publicar o planejamento do mês, as habilidades aparecerão aqui.</p>
      </div>
    </div>
  );
  const trab = D.TRABALHO[pl.id] || {};
  const habs = pl.habilidades.map(c => ({ cod: c, ...D.habByCod[c], ...(trab[c] || { status: 'pendente', avaliacoes: 0 }) }));
  const trabalhadas = habs.filter(h => h.status === 'trabalhada').length;
  const pendentes = habs.filter(h => h.status === 'pendente').length;
  const totAval = habs.reduce((s, h) => s + h.avaliacoes, 0);
  const stMap = { trabalhada: ['badge-green', 'Trabalhada'], andamento: ['badge-amber', 'Em andamento'], pendente: ['badge-gray', 'Pendente'] };
  const proximas = habs.filter(h => h.proxima).map(h => ({ cod: h.cod, rotulo: h.rotulo || h.cod, txt: h.proxima }));

  return (
    <div className="fade-in">
      <PageHeader
        title="Meu painel"
        subtitle={`Habilidades direcionadas pela Secretaria de Educação para ${D.periodoNome(pl.periodo)}. Preencha o planejamento semanal e registre a verificação contínua dos alunos.`}
        actions={<button className="btn btn-primary" onClick={() => go('verificacao')}><I name="check" size={15} />Nova verificação</button>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Habilidades direcionadas" value={habs.length} sub="LP · 1º Ano A" icon="skills" accent="#2563eb" />
        <Stat label="Trabalhadas" value={trabalhadas} sub={`${Math.round(trabalhadas / habs.length * 100)}% do planejamento`} icon="check2" accent="#15935f" />
        <Stat label="Pendentes" value={pendentes} sub="ainda não iniciadas" icon="flag" accent="#c77a07" />
        <Stat label="Avaliações realizadas" value={totAval} sub="no período" icon="check" accent="#0e8aa8" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* habilidades */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Habilidades do período</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{pl.titulo}</p>
            </div>
            <span className="chip"><I name="lock" size={12} />Definidas pela Secretaria</span>
          </div>
          {habs.map(h => {
            const [cls, lbl] = stMap[h.status];
            return (
              <div key={h.cod} style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span className="code-pill" style={{ marginTop: 2 }}>{h.rotulo || h.cod}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <MatrizBadge matriz={h.matriz} />
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{h.desc}</div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                        <I name="check" size={13} />
                        <b className="num" style={{ color: 'var(--text-2)' }}>{h.avaliacoes}</b> avaliações
                      </span>
                      {h.ultima && <span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 12, color: 'var(--text-3)' }}><I name="clock" size={13} />última {h.ultima}</span>}
                      {h.proxima && <span className="badge badge-amber" style={{ fontWeight: 600 }}>Próx.: {h.proxima}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={'badge ' + cls}>{lbl}</span>
                    <button className="btn btn-subtle btn-sm" onClick={() => go('verificacao')}>Avaliar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <div className="section-title">Próximas atividades</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proximas.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--amber-bg)', color: 'var(--amber)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name="calendar" size={16} /></div>
                  <div>
                    <span className="code-pill" style={{ fontSize: 10.5 }}>{p.rotulo}</span>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>{p.txt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-title">Progresso do planejamento</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span className="num" style={{ fontSize: 30, fontWeight: 800 }}>{Math.round((habs.length - pendentes) / habs.length * 100)}%</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>iniciado</span>
            </div>
            <Bar value={(habs.length - pendentes) / habs.length * 100} height={10} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12.5 }}>
              <span style={{ color: 'var(--text-3)' }}>{trabalhadas} concluídas</span>
              <span style={{ color: 'var(--text-3)' }}>{pendentes} pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------- Verificação contínua -------- */
const RESULTS = [
  { v: 1, label: 'Não atingiu', cor: 'var(--red)', bg: 'var(--red-bg)' },
  { v: 2, label: 'Atingiu', cor: 'var(--green)', bg: 'var(--green-bg)' },
];

export const VerificacaoContinua = ({ openAluno }) => {
  const D = DATA;
  const pl = meuPlano();
  // turmas em que o professor leciona (para o seletor de turma)
  const prof = D.PROFESSORES.find(p => p.id === D.CURRENT_USER?.profId);
  const minhasTurmas = (prof?.turmaIds || []).map(id => D.TURMAS.find(t => t.id === id)).filter(Boolean);
  const turmasDisp = minhasTurmas.length ? minhasTurmas : (D.TURMA_ATUAL ? [D.TURMA_ATUAL] : D.TURMAS.slice(0, 1));

  const [turmaSel, setTurmaSel] = useState(turmasDisp[0]?.id || null);
  const [alunos, setAlunos] = useState(D.alunosT1);
  const [avaliacoes, setAvaliacoes] = useState(D.AVALIACOES);
  const [habSel, setHabSel] = useState(pl?.habilidades?.[0] || null);
  const [data, setData] = useState('15/04/2026');
  const [marks, setMarks] = useState({}); // alunoId -> resultado (rodada atual)
  const [saved, setSaved] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // carrega o roster + avaliações da turma selecionada
  useEffect(() => {
    if (!turmaSel) return;
    if (D.TURMA_ATUAL && turmaSel === D.TURMA_ATUAL.id) { setAlunos(D.alunosT1); setAvaliacoes(D.AVALIACOES); return; }
    let ativo = true;
    Promise.all([fetchTurmaFull(turmaSel), fetchAvaliacoesTurma(turmaSel)])
      .then(([t, av]) => { if (ativo) { setAlunos(t.alunos); setAvaliacoes(av || {}); setMarks({}); } })
      .catch(() => {});
    return () => { ativo = false; };
  }, [turmaSel]);

  if (!pl) return (
    <div className="fade-in">
      <PageHeader title="Verificação contínua" subtitle="Registre o desempenho individual dos alunos nas habilidades direcionadas." />
      <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Nenhum planejamento direcionado no momento.</div>
    </div>
  );

  const hab = D.habByCod[habSel] || {};
  const marcados = Object.keys(marks).length;
  const trab = D.TRABALHO[pl.id] || {};
  const vezesAvaliada = (trab[habSel] && trab[habSel].avaliacoes) || 0;

  const setMark = (id, v) => { setMarks(m => ({ ...m, [id]: v })); setSaved(false); };
  const marcarTodos = v => { const o = {}; alunos.forEach(a => o[a.id] = v); setMarks(o); setSaved(false); };
  const registrar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const av = await registrarAvaliacaoLote({ planejamentoId: pl.id, habCod: habSel, turmaId: turmaSel, data, marks });
      setAvaliacoes(av || {});
      setSaved(true);
      setTimeout(() => { setMarks({}); setSaved(false); }, 1800);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const dist = [0, 0];
  Object.values(marks).forEach(v => dist[v - 1]++);

  // acompanhamento das habilidades leitoras (matriz LEITORA) na turma selecionada
  const leitoras = pl.habilidades.filter(c => (D.habByCod[c] || {}).matriz === 'LEITORA').map(cod => {
    const h = D.habByCod[cod] || {};
    let avaliados = 0, atingiram = 0;
    alunos.forEach(a => {
      const arr = avaliacoes[a.id] && avaliacoes[a.id][cod];
      if (arr && arr.length) { avaliados++; if (arr[arr.length - 1].resultado === 2) atingiram++; }
    });
    return { cod, rotulo: h.rotulo || cod, desc: h.desc || cod, avaliados, atingiram, pct: avaliados ? Math.round(atingiram / avaliados * 100) : 0 };
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Verificação contínua"
        subtitle="Registre o desempenho individual de cada estudante em relação à habilidade trabalhada. A mesma habilidade pode ser avaliada várias vezes ao longo do período."
      />

      {/* seletor de habilidade */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {turmasDisp.length > 1 && (
            <div style={{ width: 220 }}>
              <label className="field-label">Turma avaliada</label>
              <select className="input" value={turmaSel || ''} onChange={e => setTurmaSel(e.target.value)}>
                {turmasDisp.map(t => <option key={t.id} value={t.id}>{t.nome}{t.turno ? ' · ' + t.turno : ''}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <label className="field-label">Habilidade avaliada</label>
            <select className="input" value={habSel} onChange={e => { setHabSel(e.target.value); setMarks({}); setSaved(false); }}>
              {D.MATRIZES.filter(m => pl.habilidades.some(c => (D.habByCod[c] || {}).matriz === m.id)).map(m => (
                <optgroup key={m.id} label={m.nome + ' — ' + m.desc}>
                  {pl.habilidades.filter(c => (D.habByCod[c] || {}).matriz === m.id).map(c => (
                    <option key={c} value={c}>{(D.habByCod[c].rotulo || c)} — {D.habByCod[c].desc.slice(0, 52)}…</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ width: 170 }}>
            <label className="field-label">Data da avaliação</label>
            <div style={{ position: 'relative' }}>
              <input className="input" value={data} onChange={e => setData(e.target.value)} style={{ paddingLeft: 34 }} />
              <I name="calendar" size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-3)' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '4px 18px', borderLeft: '1px solid var(--border)' }}>
            <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{vezesAvaliada}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>vezes avaliada</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 13, background: 'var(--surface-2)', borderRadius: 11, fontSize: 12.5, color: 'var(--text-2)' }}>
          <span className="code-pill" style={{ marginTop: 1 }}>{hab.rotulo || habSel}</span>
          <MatrizBadge matriz={hab.matriz} />
          <span style={{ flex: 1 }}>{hab.desc}</span>
        </div>
      </div>

      {/* dash: acompanhamento das habilidades leitoras */}
      {leitoras.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15 }}>Acompanhamento das habilidades leitoras</h3>
            <span className="chip"><I name="book" size={13} />{leitoras.length} habilidade{leitoras.length > 1 ? 's' : ''}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16 }}>Percentual de alunos que atingiram cada habilidade leitora nesta turma · registrado na verificação contínua.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {leitoras.map(l => (
              <div key={l.cod}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span className="code-pill" style={{ flex: 'none' }}>{l.rotulo}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.desc}</span>
                  </div>
                  <span className="num" style={{ fontWeight: 800, fontSize: 14, flex: 'none' }}>{l.avaliados ? l.pct + '%' : '—'}</span>
                </div>
                <Bar value={l.pct} color={l.pct >= 70 ? '#15935f' : l.pct >= 40 ? '#c77a07' : '#d3433a'} height={9} />
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{l.avaliados ? `${l.atingiram} de ${l.avaliados} avaliados atingiram` : 'Ainda sem avaliações nesta turma'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* barra de ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{alunos.length} alunos</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 12.5, color: marcados === alunos.length ? 'var(--green)' : 'var(--text-3)', fontWeight: 600 }}>
            {marcados}/{alunos.length} marcados
          </span>
          {dist.some(d => d > 0) && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 6 }}>
              {RESULTS.map((r, i) => dist[i] > 0 && <span key={r.v} className="badge" style={{ background: r.bg, color: r.cor }}>{dist[i]} {r.label.toLowerCase()}</span>)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Marcar todos:</span>
          {RESULTS.map(r => (
            <button key={r.v} className="btn btn-sm" style={{ background: r.bg, color: r.cor, fontWeight: 700 }} onClick={() => marcarTodos(r.v)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* grade de alunos */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {alunos.map(a => {
          const cur = marks[a.id];
          const prev = avaliacoes[a.id] && avaliacoes[a.id][habSel];
          const last = prev && prev.length ? prev[prev.length - 1].resultado : null;
          return (
            <div key={a.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderColor: cur ? RESULTS[cur - 1].cor : 'var(--border)', transition: 'border-color .15s' }}>
              <Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</div>
                {last && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Última avaliação: {D.RES_LABEL[last]}</div>}
              </div>
              <div className="seg" style={{ flex: 'none' }}>
                {RESULTS.map(r => (
                  <button key={r.v} onClick={() => setMark(a.id, r.v)}
                    style={{ padding: '6px 10px', fontSize: 12, background: cur === r.v ? r.cor : 'transparent', color: cur === r.v ? '#fff' : 'var(--text-2)', borderRadius: 8, fontWeight: 700 }}
                    title={r.label}>
                    {r.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* barra de salvar — rodapé no final da lista */}
      <div className="card" style={{ marginTop: 18, padding: '16px 22px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {erro ? <span style={{ color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><I name="info" size={17} />{erro}</span>
            : saved ? <span style={{ color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><I name="check2" size={17} />Avaliação registrada em {data} · contador atualizado</span>
            : <>Registrando <b>{hab.rotulo || habSel}</b> · {data} · {marcados} de {alunos.length} alunos marcados</>}
        </div>
        <button className="btn btn-primary" disabled={marcados === 0 || salvando} style={{ opacity: marcados === 0 || salvando ? .5 : 1 }} onClick={registrar}>
          <I name="check" size={16} />{salvando ? 'Registrando…' : 'Registrar avaliação'}
        </button>
      </div>
    </div>
  );
};
