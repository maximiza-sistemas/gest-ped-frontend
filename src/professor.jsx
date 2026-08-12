/* ============================================================
   Módulo Professor — Meu painel + Verificação contínua
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, registrarAvaliacaoLote, fetchTurmaFull, fetchAvaliacoesTurma, fetchEventosTurma, fetchEvento } from './store.js';
import { PageHeader, Stat, I, MatrizBadge, Bar, Avatar, ICONS } from './ui.jsx';
import { EvolucaoProfessor } from './evolucao.jsx';

// ícone lock extra (registrado no catálogo compartilhado de ícones)
ICONS.lock = ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'];

// Planos ativos direcionados AO PROFESSOR LOGADO (opcionalmente de um mês):
// casam pelo componente curricular e pela escola (grupos do plano × grupo da
// escola das turmas do professor). Campo vazio no plano = vale para todos.
// A(s) série(s) do plano são informativas (exibidas nos chips) e não
// restringem o professor. Regra única usada no painel, na verificação
// contínua e no Meu planejamento.
export const planosDirecionados = mes => {
  const D = DATA;
  const prof = D.PROFESSORES.find(p => p.id === D.CURRENT_USER?.profId);
  const comp = prof ? prof.comp : null;
  const doComp = c => !comp || (D.habByCod[c] || {}).comp === comp;
  const turmas = (prof?.turmaIds || []).map(id => (D.TURMAS || []).find(t => t.id === id)).filter(Boolean);
  const temTurmas = turmas.length > 0;
  const meusGrupos = new Set(turmas.map(t => ((D.ESCOLAS || []).find(e => e.id === t.escola) || {}).grupoId).filter(Boolean));
  return D.PLANEJAMENTOS.filter(pl => pl.status === 'ativo'
    && (mes ? pl.periodo === mes : true)
    && pl.habilidades.some(doComp)
    && (!temTurmas || !(pl.grupos || []).length || pl.grupos.some(g => meusGrupos.has(g.id))));
};

/* -------- Meu painel -------- */
export const ProfessorPainel = ({ go, openAluno }) => {
  const D = DATA;
  // professor logado e seu componente — só vê habilidades do seu componente
  const prof = D.PROFESSORES.find(p => p.id === D.CURRENT_USER?.profId);
  const profComp = prof ? prof.comp : null;
  const doComp = c => !profComp || (D.habByCod[c] || {}).comp === profComp;
  const meses = D.PERIODOS.filter(p => planosDirecionados(p.id).length > 0); // meses com direcionamento p/ o professor
  const mesAtual = (D.PERIODOS.find(p => p.atual) || {}).id;
  const [mesSel, setMesSel] = useState(meses.some(m => m.id === mesAtual) ? mesAtual : (meses[0] ? meses[0].id : null));

  if (!meses.length) return (
    <div className="fade-in">
      <PageHeader title="Dashboard" subtitle="Habilidades direcionadas pela Secretaria de Educação por mês." />
      <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="plan" size={28} /></div>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhum planejamento direcionado</h3>
        <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>Quando a Secretaria publicar o planejamento de um mês, as habilidades aparecerão aqui.</p>
      </div>
      <EvolucaoProfessor embutido openAluno={openAluno} />
    </div>
  );

  // habilidades do componente do professor, agregadas dos planejamentos do mês (cada uma com seu trabalho)
  const planosMes = planosDirecionados(mesSel);
  const habs = planosMes.flatMap(pl => pl.habilidades.filter(doComp).map(c => {
    const t = (D.TRABALHO[pl.id] || {})[c] || { status: 'pendente', avaliacoes: 0 };
    return { cod: c, planoId: pl.id, ...D.habByCod[c], ...t };
  }));
  const total = habs.length || 1; // evita divisão por zero
  const trabalhadas = habs.filter(h => h.status === 'trabalhada').length;
  const pendentes = habs.filter(h => h.status === 'pendente').length;
  const totAval = habs.reduce((s, h) => s + (h.avaliacoes || 0), 0);
  const stMap = { trabalhada: ['badge-green', 'Trabalhada'], andamento: ['badge-amber', 'Em andamento'], pendente: ['badge-gray', 'Pendente'] };
  const proximas = habs.filter(h => h.proxima).map(h => ({ cod: h.cod, rotulo: h.rotulo || h.cod, txt: h.proxima }));

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Habilidades direcionadas pela Secretaria de Educação e evolução das suas turmas e alunos. Selecione o mês, preencha o planejamento semanal e registre a verificação contínua."
        actions={<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <I name="calendar" size={15} style={{ color: 'var(--text-3)' }} />
            <select className="input" value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ height: 38, width: 180 }}>
              {meses.map(m => <option key={m.id} value={m.id}>{m.nome}{m.id === mesAtual ? ' (mês atual)' : ''}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => go('verificacao')}><I name="check" size={15} />Nova verificação</button>
        </>}
      />

      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Habilidades direcionadas" value={habs.length} sub={`${planosMes.length} planejamento${planosMes.length === 1 ? '' : 's'} · ${D.periodoNome(mesSel)}`} icon="skills" accent="#2563eb"
          info="Habilidades do seu componente curricular presentes nos planejamentos que a Secretaria direcionou para o mês selecionado." />
        <Stat label="Trabalhadas" value={trabalhadas} sub={`${Math.round(trabalhadas / total * 100)}% do planejamento`} icon="check2" accent="#15935f"
          info='Habilidades do mês que você marcou como "trabalhada" no acompanhamento do planejamento.' />
        <Stat label="Pendentes" value={pendentes} sub="ainda não iniciadas" icon="flag" accent="#c77a07"
          info="Habilidades direcionadas para o mês que ainda não foram iniciadas (sem atividade registrada)." />
        <Stat label="Avaliações realizadas" value={totAval} sub={D.periodoNome(mesSel)} icon="check" accent="#0e8aa8"
          info="Verificações contínuas registradas nas habilidades direcionadas do mês selecionado." />
      </div>

      <div className="grid grid-side-320">
        {/* habilidades */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 15 }}>Habilidades de {D.periodoNome(mesSel)}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{planosMes.map(p => p.titulo).join(' · ') || 'Sem planejamento'}</p>
            </div>
            <span className="chip" style={{ flex: 'none' }}><I name="lock" size={12} />Definidas pela Secretaria</span>
          </div>
          {habs.length === 0 && (
            <div style={{ padding: '28px 22px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>Sem habilidades direcionadas neste mês.</div>
          )}
          {habs.map(h => {
            const [cls, lbl] = stMap[h.status] || stMap.pendente;
            return (
              <div key={h.planoId + ':' + h.cod} style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
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
              <span className="num" style={{ fontSize: 30, fontWeight: 800 }}>{Math.round((habs.length - pendentes) / total * 100)}%</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>iniciado</span>
            </div>
            <Bar value={(habs.length - pendentes) / total * 100} height={10} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12.5 }}>
              <span style={{ color: 'var(--text-3)' }}>{trabalhadas} concluídas</span>
              <span style={{ color: 'var(--text-3)' }}>{pendentes} pendentes</span>
            </div>
          </div>
        </div>
      </div>

      <EvolucaoProfessor embutido openAluno={openAluno} />
    </div>
  );
};

/* -------- Verificação contínua -------- */
const RESULTS = [
  { v: 1, label: 'Não atingiu', cor: 'var(--red)', bg: 'var(--red-bg)' },
  { v: 2, label: 'Atingiu', cor: 'var(--green)', bg: 'var(--green-bg)' },
];

const hojeBR = () => {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
};

export const VerificacaoContinua = ({ openAluno }) => {
  const D = DATA;
  // professor logado e seu componente — só vê habilidades do seu componente
  const prof = D.PROFESSORES.find(p => p.id === D.CURRENT_USER?.profId);
  const profComp = prof ? prof.comp : null;
  // habilidades direcionadas em um mês, do componente do professor (com plano de origem)
  const habsDoMes = mes => planosDirecionados(mes)
    .flatMap(p => p.habilidades.map(c => ({ cod: c, planoId: p.id })))
    .filter(h => !profComp || (D.habByCod[h.cod] || {}).comp === profComp);
  const meses = D.PERIODOS.filter(p => habsDoMes(p.id).length > 0); // só meses com direcionamento para o professor
  const mesAtual = (D.PERIODOS.find(p => p.atual) || {}).id;
  const mesInicial = meses.some(m => m.id === mesAtual) ? mesAtual : (meses[0] ? meses[0].id : null);

  // turmas em que o professor leciona (para o seletor de turma)
  const minhasTurmas = (prof?.turmaIds || []).map(id => D.TURMAS.find(t => t.id === id)).filter(Boolean);
  const turmasDisp = minhasTurmas.length ? minhasTurmas : (D.TURMA_ATUAL ? [D.TURMA_ATUAL] : D.TURMAS.slice(0, 1));

  const [mesSel, setMesSel] = useState(mesInicial);
  const [turmaSel, setTurmaSel] = useState(turmasDisp[0]?.id || null);
  const [habSel, setHabSel] = useState(habsDoMes(mesInicial)[0]?.cod || null);
  const [alunos, setAlunos] = useState(D.alunosT1);
  const [avaliacoes, setAvaliacoes] = useState(D.AVALIACOES);
  const [data, setData] = useState(hojeBR());
  const [marks, setMarks] = useState({}); // alunoId -> resultado (rodada atual)
  const [saved, setSaved] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [eventos, setEventos] = useState([]);       // eventos de acompanhamento da turma
  const [eventoSel, setEventoSel] = useState(null); // { id, data } — completando um evento
  const [forcarNovo, setForcarNovo] = useState(false); // criação explícita: não reaproveita evento de mesma data
  const [bloqueados, setBloqueados] = useState(() => new Set()); // alunos já analisados no evento (imutáveis)

  // ao trocar de mês, limpa a rodada atual (a habilidade ativa é recalculada abaixo)
  useEffect(() => { setMarks({}); setSaved(false); setEventoSel(null); setBloqueados(new Set()); setForcarNovo(false); }, [mesSel]);

  // carrega o roster + avaliações + eventos de acompanhamento da turma selecionada
  useEffect(() => {
    if (!turmaSel) return;
    let ativo = true;
    setEventoSel(null);
    setBloqueados(new Set());
    setForcarNovo(false);
    setMarks({});
    fetchEventosTurma(turmaSel).then(evs => { if (ativo) setEventos(evs || []); }).catch(() => {});
    if (D.TURMA_ATUAL && turmaSel === D.TURMA_ATUAL.id) {
      setAlunos(D.alunosT1); setAvaliacoes(D.AVALIACOES);
      return () => { ativo = false; };
    }
    Promise.all([fetchTurmaFull(turmaSel), fetchAvaliacoesTurma(turmaSel)])
      .then(([t, av]) => { if (ativo) { setAlunos(t.alunos); setAvaliacoes(av || {}); setMarks({}); } })
      .catch(() => {});
    return () => { ativo = false; };
  }, [turmaSel]);

  if (!meses.length) return (
    <div className="fade-in">
      <PageHeader title="Verificação contínua" subtitle="Registre o desempenho individual dos alunos nas habilidades direcionadas." />
      <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Nenhum planejamento direcionado no momento.</div>
    </div>
  );

  // habilidades do mês selecionado + mapa habilidade → planejamento de origem
  const habsMes = habsDoMes(mesSel);
  const habCods = habsMes.map(h => h.cod);
  const planoDaHab = Object.fromEntries(habsMes.map(h => [h.cod, h.planoId]));
  const habAtivo = habCods.includes(habSel) ? habSel : (habCods[0] || null); // robusto à troca de mês
  const planoIdSel = planoDaHab[habAtivo];

  const hab = D.habByCod[habAtivo] || {};
  const marcados = Object.keys(marks).length;
  const novasMarcas = Object.keys(marks).filter(id => !bloqueados.has(id)).length;
  // toda verificação precisa estar ligada a um evento: ou completando um
  // existente (eventoSel) ou criando um novo explicitamente (forcarNovo)
  const eventoAtivo = !!eventoSel || forcarNovo;
  const trab = D.TRABALHO[planoIdSel] || {};
  const vezesAvaliada = (trab[habAtivo] && trab[habAtivo].avaliacoes) || 0;

  const setMark = (id, v) => {
    if (!eventoAtivo) return; // sem evento selecionado/criado não há verificação
    if (bloqueados.has(id)) return; // já analisado no evento — imutável
    setMarks(m => ({ ...m, [id]: v }));
    setSaved(false);
  };
  const marcarTodos = v => {
    if (!eventoAtivo) return;
    setMarks(m => {
      const o = { ...m };
      alunos.forEach(a => { if (!bloqueados.has(a.id)) o[a.id] = v; });
      return o;
    });
    setSaved(false);
  };
  const registrar = async () => {
    if (!eventoAtivo || !planoIdSel || !habAtivo) return;
    setSalvando(true);
    setErro(null);
    try {
      // envia somente as marcas novas — alunos já analisados são imutáveis
      const marksNovas = Object.fromEntries(Object.entries(marks).filter(([id]) => !bloqueados.has(id)));
      const { avaliacoes: av, eventoId } = await registrarAvaliacaoLote({
        planejamentoId: planoIdSel, habCod: habAtivo, turmaId: turmaSel, data, marks: marksNovas,
        ...(eventoSel ? { eventoId: eventoSel.id } : (forcarNovo ? { novo: true } : {})),
      });
      setAvaliacoes(av || {});
      // segue no mesmo evento: salvar de novo (hoje ou outro dia) só completa pendentes
      if (!eventoSel && eventoId) setEventoSel({ id: eventoId, data });
      setBloqueados(new Set(Object.keys(marks)));
      setForcarNovo(false);
      fetchEventosTurma(turmaSel).then(evs => setEventos(evs || [])).catch(() => {});
      setSaved(eventoSel ? 'completado' : 'criado');
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const dist = [0, 0];
  Object.values(marks).forEach(v => dist[v - 1]++);

  // eventos de acompanhamento do mês (habilidades direcionadas), na turma selecionada
  const eventosMes = eventos.filter(e => habCods.includes(e.habCod));

  // comparativo entre os eventos da habilidade selecionada (todas as aplicações)
  const comparativo = eventos
    .filter(e => e.habCod === habAtivo)
    .map(e => ({ ...e, pct: e.avaliados ? Math.round((e.atingiram / e.avaliados) * 100) : null }))
    .sort((a, b) => a.data.split('/').reverse().join('').localeCompare(b.data.split('/').reverse().join('')));
  const compComDados = comparativo.filter(e => e.pct != null);
  const deltaComp = compComDados.length >= 2
    ? compComDados[compComDados.length - 1].pct - compComDados[0].pct
    : null;

  // completa um evento salvo: carrega as marcas atuais na grade TRAVADAS
  // (imutáveis) — somente os alunos ainda não analisados podem ser marcados,
  // em qualquer dia (a data é só registro).
  const continuarEvento = async ev => {
    try {
      const d = await fetchEvento(ev.id);
      setHabSel(d.habCod);
      setMarks(d.marks || {});
      setBloqueados(new Set(Object.keys(d.marks || {})));
      setEventoSel({ id: d.id, data: d.data });
      setForcarNovo(false);
      setData(hojeBR());
      setSaved(false);
      setErro(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { alert(err.message); }
  };

  // criação explícita de um novo evento (comparativo): limpa a grade, não
  // reaproveita evento existente (mesmo com data igual) e leva o professor
  // direto à área de marcação com um aviso visível
  const novoEvento = () => {
    setEventoSel(null); setMarks({}); setBloqueados(new Set()); setData(hojeBR());
    setForcarNovo(true); setSaved(false); setErro(null);
    setTimeout(() => document.getElementById('novo-evento-aviso')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  };

  // acompanhamento das habilidades leitoras (matriz LEITORA) do mês, na turma selecionada
  const leitoras = habCods.filter(c => (D.habByCod[c] || {}).matriz === 'LEITORA').map(cod => {
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
        subtitle="Registre o desempenho de cada estudante em eventos de acompanhamento. A data é somente registro: se não concluir a verificação no dia, continue o evento em outro dia — os resultados dos alunos são atualizados, sem duplicar."
        actions={
          <button className="btn btn-primary" onClick={novoEvento} title="Começa um novo evento da habilidade selecionada — permite comparar com os eventos anteriores">
            <I name="plus" size={16} />Novo evento de acompanhamento
          </button>
        }
      />

      {/* seletor de habilidade */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 150 }}>
            <label className="field-label">Período (mês)</label>
            <select className="input" value={mesSel || ''} onChange={e => setMesSel(e.target.value)}>
              {meses.map(m => <option key={m.id} value={m.id}>{m.nome}{m.id === mesAtual ? ' (atual)' : ''}</option>)}
            </select>
          </div>
          {turmasDisp.length > 1 && (
            <div style={{ width: 200 }}>
              <label className="field-label">Turma avaliada</label>
              <select className="input" value={turmaSel || ''} onChange={e => setTurmaSel(e.target.value)}>
                {turmasDisp.map(t => <option key={t.id} value={t.id}>{t.nome}{t.turno ? ' · ' + t.turno : ''}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <label className="field-label">Habilidade avaliada</label>
            <select className="input" value={habAtivo || ''} onChange={e => { setHabSel(e.target.value); setMarks({}); setSaved(false); setEventoSel(null); setBloqueados(new Set()); setForcarNovo(false); }}>
              {D.MATRIZES.filter(m => habCods.some(c => (D.habByCod[c] || {}).matriz === m.id)).map(m => (
                <optgroup key={m.id} label={m.nome + ' — ' + m.desc}>
                  {habCods.filter(c => (D.habByCod[c] || {}).matriz === m.id).map(c => (
                    <option key={c} value={c}>{(D.habByCod[c].rotulo || c)} — {(D.habByCod[c].desc || '').slice(0, 52)}…</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ width: 170 }}>
            <label className="field-label">Data (somente registro)</label>
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
          <span className="code-pill" style={{ marginTop: 1 }}>{hab.rotulo || habAtivo}</span>
          <MatrizBadge matriz={hab.matriz} />
          <span style={{ flex: 1 }}>{hab.desc}</span>
        </div>
      </div>

      {/* comparativo entre os eventos da habilidade selecionada */}
      {comparativo.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15 }}>Comparativo dos eventos — {hab.rotulo || habAtivo}</h3>
            {deltaComp != null && (
              <span className="badge" style={{ background: deltaComp >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', color: deltaComp >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                {deltaComp > 0 ? '+' : ''}{deltaComp} pp do 1º ao último evento
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>
            % de atingimento em cada evento desta habilidade na turma. Eventos incompletos podem ser completados (resultados registrados são imutáveis); use “Novo evento de acompanhamento” para registrar uma nova aplicação e comparar.
          </p>
          <div className="grid grid-cols-4" style={{ gap: 12 }}>
            {comparativo.map((ev, i) => {
              const incompleto = ev.avaliados < alunos.length;
              return (
                <div key={ev.id} onClick={incompleto ? () => continuarEvento(ev) : undefined}
                  title={incompleto ? 'Completar este evento (somente alunos ainda não analisados)' : 'Evento completo — imutável'}
                  style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', cursor: incompleto ? 'pointer' : 'default',
                    background: eventoSel && eventoSel.id === ev.id ? 'var(--primary-50)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)' }}>{i + 1}º evento</span>
                    <span className="num" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{ev.data}</span>
                  </div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{ev.pct != null ? ev.pct + '%' : '—'}</div>
                  <Bar value={ev.pct || 0} color={ev.pct >= 70 ? '#15935f' : ev.pct >= 40 ? '#c77a07' : '#d3433a'} height={7} />
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>{ev.atingiram} de {ev.avaliados} atingiram{!incompleto && ' · completo'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* aviso de novo evento iniciado (criação explícita) */}
      {forcarNovo && !eventoSel && (
        <div id="novo-evento-aviso" className="card" style={{ marginBottom: 14, padding: '13px 18px', border: '1.5px solid var(--primary)',
          background: 'var(--primary-50)', display: 'flex', gap: 11, alignItems: 'center' }}>
          <I name="sparkle" size={19} style={{ color: 'var(--primary)', flex: 'none' }} />
          <div style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>
            <b>Novo evento de acompanhamento iniciado.</b> Confira a habilidade e a data de registro acima, marque os alunos abaixo e clique em <b>Registrar acompanhamento</b>.
            {comparativo.length > 0 && <> Esta habilidade já tem {comparativo.length} evento{comparativo.length > 1 ? 's' : ''} — este será um novo, para comparativo.</>}
          </div>
          <button className="icon-btn" title="Cancelar novo evento" onClick={() => { setForcarNovo(false); setMarks({}); }}><I name="x" size={15} /></button>
        </div>
      )}

      {/* sem evento ativo: a grade fica travada — toda verificação exige um evento */}
      {!eventoAtivo && (
        <div className="card" style={{ marginBottom: 14, padding: '13px 18px', border: '1.5px dashed var(--border-2, var(--border))',
          display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap' }}>
          <I name="info" size={19} style={{ color: 'var(--primary)', flex: 'none' }} />
          <div style={{ fontSize: 13, color: 'var(--text-2)', flex: 1, minWidth: 220 }}>
            Toda verificação fica ligada a um <b>evento de acompanhamento</b>. Para marcar os alunos, crie um novo evento ou clique em <b>Completar</b> em um evento incompleto abaixo.
          </div>
          <button className="btn btn-primary btn-sm" onClick={novoEvento}><I name="plus" size={14} />Novo evento de acompanhamento</button>
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
            <button key={r.v} className="btn btn-sm" disabled={!eventoAtivo}
              title={eventoAtivo ? r.label : 'Crie ou selecione um evento de acompanhamento para marcar'}
              style={{ background: r.bg, color: r.cor, fontWeight: 700, opacity: eventoAtivo ? 1 : .45, cursor: eventoAtivo ? 'pointer' : 'not-allowed' }}
              onClick={() => marcarTodos(r.v)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* grade de alunos */}
      <div className="grid grid-cols-2" style={{ gap: 12 }}>
        {alunos.map(a => {
          const cur = marks[a.id];
          const travado = !!eventoSel && bloqueados.has(a.id); // analisado no evento — imutável
          const inerte = travado || !eventoAtivo; // sem evento ativo a grade fica travada
          return (
            <div key={a.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderColor: cur ? RESULTS[cur - 1].cor : 'var(--border)', transition: 'border-color .15s', opacity: travado ? .72 : !eventoAtivo ? .6 : 1 }}>
              <Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</div>
                {travado && (
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I name="lock" size={11} />Já analisado neste evento
                  </div>
                )}
              </div>
              <div className="seg" style={{ flex: 'none' }}>
                {RESULTS.map(r => (
                  <button key={r.v} onClick={() => setMark(a.id, r.v)} disabled={inerte}
                    style={{ padding: '6px 10px', fontSize: 12, background: cur === r.v ? r.cor : 'transparent', color: cur === r.v ? '#fff' : 'var(--text-2)', borderRadius: 8, fontWeight: 700, cursor: inerte ? 'not-allowed' : 'pointer' }}
                    title={travado ? 'Já analisado neste evento (imutável)' : !eventoAtivo ? 'Crie ou selecione um evento de acompanhamento para marcar' : r.label}>
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
            : saved ? <span style={{ color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><I name="check2" size={17} />{saved === 'criado' ? `Evento de acompanhamento criado · registro ${data}` : 'Acompanhamento completado — os alunos já analisados foram preservados'}</span>
            : eventoSel ? <>Completando o acompanhamento de <b>{hab.rotulo || habAtivo}</b> (registro {eventoSel.data}) · alunos já analisados são <b>imutáveis</b> · {novasMarcas} pendente{novasMarcas === 1 ? '' : 's'} marcado{novasMarcas === 1 ? '' : 's'}</>
            : forcarNovo ? <>Novo evento de acompanhamento de <b>{hab.rotulo || habAtivo}</b> · registro {data} · {marcados} de {alunos.length} alunos marcados</>
            : <>Toda verificação fica ligada a um evento — crie um <b>novo evento de acompanhamento</b> ou complete um evento existente para registrar.</>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {eventoSel && (
            <button className="btn btn-ghost" onClick={novoEvento}><I name="plus" size={15} />Novo evento</button>
          )}
          {eventoAtivo ? (
            <button className="btn btn-primary" disabled={(eventoSel ? novasMarcas === 0 : marcados === 0) || salvando}
              style={{ opacity: (eventoSel ? novasMarcas === 0 : marcados === 0) || salvando ? .5 : 1 }} onClick={registrar}>
              <I name="check" size={16} />{salvando ? 'Salvando…' : eventoSel ? 'Completar acompanhamento' : 'Registrar acompanhamento'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={novoEvento}>
              <I name="plus" size={16} />Novo evento de acompanhamento
            </button>
          )}
        </div>
      </div>

      {/* eventos de acompanhamento — continuar atualiza os resultados; excluir remove o evento */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-pad" style={{ borderBottom: eventosMes.length ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Eventos de acompanhamento</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {D.periodoNome(mesSel)} · {(turmasDisp.find(t => t.id === turmaSel) || {}).nome || ''} — a data é somente registro; complete em outro dia os alunos ainda não analisados (resultados registrados são imutáveis)
            </p>
          </div>
          <span className="badge badge-blue num">{eventosMes.length}</span>
        </div>
        {eventosMes.length === 0 ? (
          <div style={{ padding: '24px 22px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>Nenhum evento de acompanhamento neste mês para esta turma.</div>
        ) : eventosMes.map(ev => {
          const h = D.habByCod[ev.habCod] || {};
          const continuando = eventoSel && eventoSel.id === ev.id;
          return (
            <div key={ev.id} style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: continuando ? 'var(--primary-50)' : undefined }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', width: 108, flex: 'none' }}>
                <I name="calendar" size={14} />{ev.data}
              </span>
              <span className="code-pill" style={{ flex: 'none' }}>{h.rotulo || ev.habCod}</span>
              <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.desc || ''}</span>
              {ev.atualizadoEm && ev.atualizadoEm !== ev.data && <span className="chip" style={{ fontSize: 11, flex: 'none' }}>atualizado {ev.atualizadoEm}</span>}
              <span className="badge badge-gray num">{ev.avaliados} aluno{ev.avaliados === 1 ? '' : 's'}</span>
              <span className="badge badge-green num">{ev.atingiram} atingiram</span>
              {ev.avaliados < alunos.length ? (
                <button className="btn btn-subtle btn-sm" title="Completar: marcar somente os alunos ainda não analisados"
                  onClick={() => continuarEvento(ev)}>
                  <I name="plus" size={14} />Completar
                </button>
              ) : (
                <span className="badge badge-green" title="Todos os alunos da turma foram analisados neste evento">
                  <I name="check2" size={12} />Completo
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
