/* ============================================================
   Professor (parte 2) — Níveis de leitura, Meus alunos,
   Meu planejamento
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, registrarLeituraLote, salvarSemanas, fetchTurmaFull } from './store.js';
import { PageHeader, I, Avatar, NivelPill, MatrizBadge } from './ui.jsx';
import { meuPlano } from './professor.jsx';

/* -------- Níveis de leitura (classificar + evolução) -------- */
export const NiveisLeitura = ({ openAluno }) => {
  const D = DATA;
  // turmas em que o professor leciona (seletor de turma)
  const prof = D.PROFESSORES.find(p => p.id === D.CURRENT_USER?.profId);
  const minhasTurmas = (prof?.turmaIds || []).map(id => D.TURMAS.find(t => t.id === id)).filter(Boolean);
  const turmasDisp = minhasTurmas.length ? minhasTurmas : (D.TURMA_ATUAL ? [D.TURMA_ATUAL] : D.TURMAS.slice(0, 1));
  const turmaNome = id => (turmasDisp.find(t => t.id === id) || {}).nome || '';

  const [turmaSel, setTurmaSel] = useState(turmasDisp[0]?.id || null);
  const [dataAplicacao, setDataAplicacao] = useState('15/04/2026');
  const [alunos, setAlunos] = useState(() => D.alunosT1.map(a => ({ ...a })));
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState(null);

  // carrega o roster da turma selecionada
  useEffect(() => {
    if (!turmaSel) return;
    if (D.TURMA_ATUAL && turmaSel === D.TURMA_ATUAL.id) { setAlunos(D.alunosT1.map(a => ({ ...a }))); return; }
    let ativo = true;
    fetchTurmaFull(turmaSel).then(t => { if (ativo) setAlunos(t.alunos.map(a => ({ ...a }))); }).catch(() => {});
    return () => { ativo = false; };
  }, [turmaSel]);

  const dist = [0, 0, 0, 0, 0, 0];
  alunos.forEach(a => dist[a.nivelLeitura - 1]++);

  const setNivel = (id, nv) => {
    const atual = alunos.find(a => a.id === id);
    // atualização otimista; a API persiste e o store re-hidrata a turma
    setAlunos(list => list.map(a => a.id === id
      ? { ...a, nivelLeitura: nv, justAdvanced: nv > a.nivelLeitura, aplicadoEm: dataAplicacao,
          histNivel: [...a.histNivel, { data: dataAplicacao, nivel: nv }] }
      : a));
    setEditId(null);
    setErro(null);
    registrarLeituraLote({ data: dataAplicacao, turmaId: turmaSel, registros: [{ alunoId: id, nivel: nv }] })
      .catch(err => {
        setErro(`Falha ao salvar o nível de ${atual?.nome || id}: ${err.message}`);
        if (turmaSel) fetchTurmaFull(turmaSel).then(t => setAlunos(t.alunos.map(a => ({ ...a })))).catch(() => {}); // desfaz a otimista
      });
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Níveis de leitura"
        subtitle="Classifique cada aluno no nível de leitura atual. O sistema mantém o histórico de evolução ao longo do período."
        actions={<button className="btn btn-ghost"><I name="download" size={15} />Exportar</button>}
      />

      {erro && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '11px 14px', borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          <I name="info" size={16} />{erro}
        </div>
      )}

      {/* distribuição */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 15 }}>Distribuição da turma · {alunos.length} alunos</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {turmasDisp.length > 1 ? (
              <select className="input" value={turmaSel || ''} onChange={e => setTurmaSel(e.target.value)} style={{ height: 34, fontSize: 13, width: 200 }}>
                {turmasDisp.map(t => <option key={t.id} value={t.id}>{t.nome}{t.turno ? ' · ' + t.turno : ''}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{turmaNome(turmaSel)} · {D.periodoNome((D.PERIODOS.find(p => p.atual) || {}).id)}</span>
            )}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>Data da aplicação:</span>
            <div style={{ position: 'relative', width: 148 }}>
              <input className="input" value={dataAplicacao} onChange={e => setDataAplicacao(e.target.value)} style={{ paddingLeft: 32, height: 34, fontSize: 13 }} />
              <I name="calendar" size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-3)' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', height: 30, borderRadius: 9, overflow: 'hidden', marginBottom: 14 }}>
          {D.NIVEIS.map((n, i) => dist[i] > 0 && (
            <div key={n.id} style={{ width: (dist[i] / alunos.length * 100) + '%', background: n.cor, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }} title={n.nome}>
              {dist[i]}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {D.NIVEIS.map((n, i) => (
            <span key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: n.cor }} />
              <span style={{ color: 'var(--text-2)' }}>{n.nome}</span>
              <b className="num">{dist[i]}</b>
            </span>
          ))}
        </div>
      </div>

      {/* lista de alunos */}
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 36 }}>Nº</th><th>Aluno</th><th style={{ width: 260 }}>Nível atual</th><th style={{ textAlign: 'right' }}>Última aplicação</th></tr></thead>
          <tbody>
            {alunos.map(a => {
              return (
                <tr key={a.id}>
                  <td className="num" style={{ color: 'var(--text-3)' }}>{String(a.numero).padStart(2, '0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => openAluno(a.id)}>
                      <Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} />
                      <span style={{ fontWeight: 600 }}>{a.nome}</span>
                    </div>
                  </td>
                  <td>
                    {editId === a.id ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {D.NIVEIS.map(n => (
                          <button key={n.id} onClick={() => setNivel(a.id, n.id)}
                            style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, border: '1.5px solid ' + n.cor,
                              background: a.nivelLeitura === n.id ? n.cor : 'transparent', color: a.nivelLeitura === n.id ? '#fff' : n.cor }}>
                            {n.curto}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setEditId(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
                        <NivelPill nivel={a.nivelLeitura} full />
                        <I name="edit" size={13} style={{ color: 'var(--text-3)', marginLeft: 4 }} />
                      </button>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      {a.justAdvanced && <span className="badge badge-green fade-in"><I name="trend" size={11} />avançou</span>}
                      <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: a.aplicadoEm ? 'var(--text-2)' : 'var(--text-3)' }}>
                        <I name="calendar" size={11} />{a.aplicadoEm || a.histNivel[a.histNivel.length - 1].data}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Meus alunos -------- */
export const MeusAlunos = ({ openAluno }) => {
  const D = DATA;
  const [q, setQ] = useState('');
  const list = D.alunosT1.filter(a => a.nome.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fade-in">
      <PageHeader title="Meus alunos" subtitle="Turma 1º Ano A · 24 alunos. Clique em um aluno para ver a ficha individual completa." />
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 18 }}>
        <I name="search" size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
        <input className="input" placeholder="Buscar aluno…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {list.map(a => {
          const avals = ['EF01LP01', 'EF01LP02', 'EF01LP04', 'EF01LP07'].reduce((s, h) => s + D.avalCount(a.id, h), 0);
          const d = a.nivelLeitura - a.histNivel[0].nivel;
          return (
            <button key={a.id} className="card card-pad" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow .15s, transform .15s' }}
              onClick={() => openAluno(a.id)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.nome}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Nº {String(a.numero).padStart(2, '0')} · 1º Ano A</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTop: '1px solid var(--border)' }}>
                <NivelPill nivel={a.nivelLeitura} full />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}><b className="num" style={{ color: 'var(--text-2)' }}>{avals}</b> avaliações</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------- Meu planejamento (sequências didáticas semanais) -------- */
const CAMPOS_SEMANA = [
  ['sequenciaDidatica', 'Sequência didática', 'Descreva a sequência didática da semana…', 4],
  ['recursosDidaticos', 'Recursos didáticos', 'Ex.: alfabeto móvel, livros, jogos…', 2],
  ['verificacaoAprendizagem', 'Verificação de aprendizagem', 'Como a aprendizagem será verificada nesta semana…', 2],
  ['referencias', 'Referências bibliográficas', 'Ex.: BRASIL. BNCC. MEC, 2018.', 2],
];

// acompanhamento (atingiu/não) de uma habilidade — vem da verificação contínua
const AcompanhamentoBadge = ({ t }) => {
  if (!t || !t.avaliados) return <span className="badge badge-gray">Aguardando verificação</span>;
  const pct = Math.round((t.atingiram / t.avaliados) * 100);
  const txt = `${t.atingiram}/${t.avaliados} atingiram · ${pct}%`;
  if (pct >= 70) return <span className="badge badge-green">{txt}</span>;
  if (pct >= 40) return <span className="badge badge-amber">{txt}</span>;
  return <span className="badge" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>{txt}</span>;
};

export const MeuPlanejamento = () => {
  const D = DATA;
  const pl = meuPlano();
  const profId = D.CURRENT_USER?.profId;
  const [semanas, setSemanas] = useState(() => {
    const minhas = (D.SEMANAS[pl?.id] || []).filter(s => s.prof === profId).slice().sort((a, b) => a.semana - b.semana);
    return minhas.length
      ? minhas.map(s => ({ habilidades: s.habilidades || [], sequenciaDidatica: s.sequenciaDidatica, recursosDidaticos: s.recursosDidaticos, verificacaoAprendizagem: s.verificacaoAprendizagem, referencias: s.referencias }))
      : [{ habilidades: [], sequenciaDidatica: '', recursosDidaticos: '', verificacaoAprendizagem: '', referencias: '' }];
  });
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState(null);

  if (!pl) return (
    <div className="fade-in">
      <PageHeader title="Meu planejamento" subtitle="Sequências didáticas semanais do planejamento direcionado pela Secretaria." />
      <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Nenhum planejamento direcionado no momento.</div>
    </div>
  );

  const anosTxt = pl.anos && pl.anos.length ? pl.anos.map(a => a + 'º').join(', ') + ' ano' : 'Todas as séries';
  const trab = D.TRABALHO[pl.id] || {}; // acompanhamento por habilidade (alimentado pela verificação contínua)
  const upd = (i, k, v) => setSemanas(ss => ss.map((s, j) => j === i ? { ...s, [k]: v } : s));
  const toggleHabSemana = (i, cod) => setSemanas(ss => ss.map((s, j) => j === i
    ? { ...s, habilidades: (s.habilidades || []).includes(cod) ? s.habilidades.filter(x => x !== cod) : [...(s.habilidades || []), cod] }
    : s));
  const addSemana = () => setSemanas(ss => [...ss, { habilidades: [], sequenciaDidatica: '', recursosDidaticos: '', verificacaoAprendizagem: '', referencias: '' }]);
  const removeSemana = i => setSemanas(ss => ss.length > 1 ? ss.filter((_, j) => j !== i) : ss);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const payload = semanas.map((s, i) => ({
        semana: i + 1,
        habilidades: s.habilidades || [],
        sequenciaDidatica: (s.sequenciaDidatica || '').trim(),
        recursosDidaticos: (s.recursosDidaticos || '').trim(),
        verificacaoAprendizagem: (s.verificacaoAprendizagem || '').trim(),
        referencias: (s.referencias || '').trim(),
      }));
      await salvarSemanas(pl.id, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Meu planejamento" subtitle="Organize a sequência didática semana a semana. As habilidades, a expectativa de aprendizagem e o mês são definidos pela Secretaria e não podem ser alterados." />

      {/* cabeçalho direcionado (somente leitura) */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}><I name="plan" size={20} /></div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15.5 }}>{pl.titulo}</h3>
            {pl.objetivo && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 4 }}>{pl.objetivo}</p>}
          </div>
          <span className="chip" style={{ flex: 'none' }}><I name="lock" size={12} />Definido pela Secretaria</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span className="chip"><I name="calendar" size={13} />{D.periodoNome(pl.periodo)}</span>
          <span className="chip"><I name="grad" size={13} />{anosTxt}</span>
          {pl.grupoNome && <span className="chip"><I name="layers" size={13} />{pl.grupoNome}</span>}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div className="section-title">Habilidades a trabalhar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pl.habilidades.map(c => {
              const h = D.habByCod[c] || { desc: c };
              return (
                <div key={c} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="code-pill" style={{ marginTop: 1 }}>{D.rotulo(c)}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{h.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* editor de semanas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>Sequências didáticas semanais</h3>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{semanas.length} semana(s)</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {semanas.map((s, i) => (
          <div key={i} className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flex: 'none' }}>{i + 1}</span>
              <h4 style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>Semana {i + 1}</h4>
              <button className="icon-btn" title="Remover semana" disabled={semanas.length === 1} style={{ opacity: semanas.length === 1 ? .4 : 1, color: 'var(--red)' }} onClick={() => removeSemana(i)}><I name="x" size={15} /></button>
            </div>

            {/* habilidades trabalhadas na semana (dentre as direcionadas) + acompanhamento */}
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Habilidades trabalhadas nesta semana <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(uma ou mais)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pl.habilidades.map(cod => {
                  const on = (s.habilidades || []).includes(cod);
                  const h = D.habByCod[cod] || { desc: cod };
                  return (
                    <label key={cod} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                      border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border)'), background: on ? 'var(--primary-50)' : 'var(--surface)' }}>
                      <input type="checkbox" checked={on} onChange={() => toggleHabSemana(i, cod)} style={{ marginTop: 3 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="code-pill">{D.rotulo(cod)}</span>
                          {on && <AcompanhamentoBadge t={trab[cod]} />}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4, marginTop: 3 }}>{h.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CAMPOS_SEMANA.map(([k, label, ph, rows]) => (
                <div key={k}>
                  <label className="field-label">{label}</label>
                  <textarea className="input" rows={rows} value={s[k] || ''} onChange={e => upd(i, k, e.target.value)} placeholder={ph} style={{ resize: 'vertical' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-subtle" style={{ width: '100%', marginTop: 14 }} onClick={addSemana}><I name="plus" size={15} />Adicionar semana</button>

      {/* barra de salvar */}
      <div className="card" style={{ marginTop: 18, padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {erro ? <span style={{ color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><I name="info" size={17} />{erro}</span>
            : saved ? <span style={{ color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><I name="check2" size={17} />Planejamento semanal salvo</span>
            : <>Preencha e salve as sequências didáticas das suas semanas.</>}
        </div>
        <button className="btn btn-primary" disabled={salvando} style={{ opacity: salvando ? .6 : 1 }} onClick={salvar}>
          <I name="check2" size={16} />{salvando ? 'Salvando…' : 'Salvar planejamento semanal'}
        </button>
      </div>
    </div>
  );
};
