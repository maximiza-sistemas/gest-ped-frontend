/* ============================================================
   Professor (parte 2) — Meus alunos, Meu planejamento
   ============================================================ */
import React, { useState } from 'react';
import { DATA, salvarSemanas } from './store.js';
import { PageHeader, I, Avatar } from './ui.jsx';
import { meuPlano } from './professor.jsx';

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
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}><b className="num" style={{ color: 'var(--text-2)' }}>{avals}</b> avaliações</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>Ver ficha<I name="chevR" size={14} /></span>
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
