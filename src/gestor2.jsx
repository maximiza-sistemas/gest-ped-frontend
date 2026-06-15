/* ============================================================
   Gestor (parte 2) — Wizard de planejamento, detalhe,
   habilidades, níveis, professores, períodos
   ============================================================ */
import React, { useState } from 'react';
import { DATA, criarPlanejamento } from './store.js';
import { Modal, I, MatrizBadge, Avatar, PageHeader } from './ui.jsx';

/* -------- Wizard: novo planejamento -------- */
export const NovoPlanejamento = ({ onClose }) => {
  const D = DATA;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({
    titulo: '', objetivo: '',
    periodo: (DATA.PERIODOS.find(p => p.atual) || DATA.PERIODOS[0] || {}).id || 'm01',
    anos: [], grupo: '', habs: [],
  }));
  const [matFilter, setMatFilter] = useState('todas');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const habsDisp = D.HABILIDADES;
  const grupos = (D.GRUPOS && D.GRUPOS.grupos) || [];
  const toggleHab = c => set('habs', form.habs.includes(c) ? form.habs.filter(x => x !== c) : [...form.habs, c]);
  const toggleAno = a => set('anos', form.anos.includes(a) ? form.anos.filter(x => x !== a) : [...form.anos, a]);
  const steps = ['Mês e expectativa', 'Habilidades direcionadas'];

  const podeAvancar = step === 1 ? (form.titulo.trim().length >= 3 && !!form.periodo) : form.habs.length > 0;

  const cadastrar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await criarPlanejamento(form);
      onClose();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  const foot = (
    <>
      {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}><I name="chevL" size={15} />Voltar</button>}
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}><I name="info" size={14} />{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      {step < 2
        ? <button className="btn btn-primary" disabled={!podeAvancar} style={{ opacity: podeAvancar ? 1 : .5 }} onClick={() => setStep(step + 1)}>Continuar<I name="chevR" size={15} /></button>
        : <button className="btn btn-primary" disabled={salvando || !podeAvancar} style={{ opacity: salvando || !podeAvancar ? .6 : 1 }} onClick={cadastrar}><I name="check2" size={15} />{salvando ? 'Cadastrando…' : 'Cadastrar planejamento'}</button>}
    </>
  );

  return (
    <Modal title="Novo planejamento mensal" subtitle={`Etapa ${step} de 2 · ${steps[step - 1]}`} icon="plan" width={640} onClose={onClose} footer={foot}>
      {/* stepper */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 4, background: i + 1 <= step ? 'var(--primary)' : 'var(--surface-3)' }} />
            <div style={{ fontSize: 11.5, marginTop: 7, fontWeight: 600, color: i + 1 <= step ? 'var(--text)' : 'var(--text-3)' }}>{i + 1}. {s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Título do planejamento</label>
            <input className="input" placeholder="Ex.: Alfabetização — Leitura e escrita inicial" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Mês</label>
              <select className="input" value={form.periodo} onChange={e => set('periodo', e.target.value)}>
                {D.PERIODOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Grupo que vai desenvolver</label>
              <select className="input" value={form.grupo} onChange={e => set('grupo', e.target.value)}>
                <option value="">Toda a rede</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Ano(s) escolar(es) <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(vazio = todas as séries)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {D.ANOS.map(a => {
                const on = form.anos.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAno(a)}
                    style={{ padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                      border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'),
                      background: on ? 'var(--primary)' : 'transparent', color: on ? '#fff' : 'var(--text-2)' }}>
                    {a}º ano
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="field-label">Expectativa de aprendizagem</label>
            <textarea className="input" rows={4} placeholder="Descreva a expectativa de aprendizagem direcionada para o mês…" value={form.objetivo} onChange={e => set('objetivo', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
            Selecione as habilidades de cada matriz de referência. <b>{form.habs.length}</b> selecionada(s).
          </p>
          {/* filtro por matriz */}
          <div className="seg" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <button className={matFilter === 'todas' ? 'active' : ''} onClick={() => setMatFilter('todas')}>Todas</button>
            {D.MATRIZES.filter(m => D.HABILIDADES.some(h => h.matriz === m.id)).map(m => (
              <button key={m.id} className={matFilter === m.id ? 'active' : ''} onClick={() => setMatFilter(m.id)}>{m.nome}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {D.MATRIZES.filter(m => (matFilter === 'todas' || matFilter === m.id) && habsDisp.some(h => h.matriz === m.id)).map(m => (
              <div key={m.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <MatrizBadge matriz={m.id} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.desc}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-4)', marginLeft: 'auto' }}>
                    {habsDisp.filter(h => h.matriz === m.id && form.habs.includes(h.cod)).length}/{habsDisp.filter(h => h.matriz === m.id).length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {habsDisp.filter(h => h.matriz === m.id).map(h => {
                    const on = form.habs.includes(h.cod);
                    return (
                      <button key={h.cod} onClick={() => toggleHab(h.cod)}
                        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', textAlign: 'left', borderRadius: 11,
                          border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border)'), background: on ? 'var(--primary-50)' : 'var(--surface)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, flex: 'none', marginTop: 1, display: 'grid', placeItems: 'center',
                          border: '2px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'), background: on ? 'var(--primary)' : 'transparent', color: '#fff' }}>
                          {on && <I name="check2" size={13} sw={3} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span className="code-pill" style={{ marginBottom: 5, display: 'inline-block' }}>{h.rotulo || h.cod}</span>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>{h.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </Modal>
  );
};

/* -------- Card de uma semana (somente leitura) -------- */
export const SemanaCard = ({ s }) => {
  const habs = s.habilidades || [];
  const campos = [
    ['Sequência didática', s.sequenciaDidatica],
    ['Recursos didáticos', s.recursosDidaticos],
    ['Verificação de aprendizagem', s.verificacaoAprendizagem],
    ['Referências bibliográficas', s.referencias],
  ].filter(([, v]) => v && v.trim());
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 11, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: (campos.length || habs.length) ? 10 : 0 }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>{s.semana}</span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Semana {s.semana}</span>
        {s.atualizadoEm && <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 'auto' }}>atualizada em {s.atualizadoEm}</span>}
      </div>
      {habs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: campos.length ? 10 : 0 }}>
          {habs.map(c => <span key={c} className="code-pill" title={(DATA.habByCod[c] || {}).desc}>{DATA.rotulo(c)}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {campos.map(([lbl, v]) => (
          <div key={lbl}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{lbl}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{v}</div>
          </div>
        ))}
        {!campos.length && <div style={{ fontSize: 12.5, color: 'var(--text-4)' }}>Sem conteúdo preenchido.</div>}
      </div>
    </div>
  );
};

/* -------- Detalhe do planejamento -------- */
export const PlanDetail = ({ planId, back }) => {
  const D = DATA;
  const pl = D.PLANEJAMENTOS.find(p => p.id === planId);
  if (!pl) return <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Planejamento não encontrado.</div>;
  const trab = D.TRABALHO[pl.id] || {};
  const semanas = D.SEMANAS[pl.id] || [];
  const stMap = { trabalhada: ['badge-green', 'Trabalhada'], andamento: ['badge-amber', 'Em andamento'], pendente: ['badge-gray', 'Pendente'] };
  const anosTxt = pl.anos && pl.anos.length ? pl.anos.map(a => a + 'º').join(', ') + ' ano' : 'Todas as séries';
  const grupoTxt = pl.grupoNome || 'Toda a rede';
  const statusTxt = { ativo: 'Ativo', 'concluído': 'Concluído', arquivado: 'Arquivado' }[pl.status] || pl.status;
  const porProf = {};
  semanas.forEach(s => { (porProf[s.prof] ||= []).push(s); });
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar aos planejamentos</button>
      <PageHeader
        title={pl.titulo}
        subtitle={pl.objetivo}
      />
      <div className="grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15 }}>Habilidades vinculadas</h3>
            <span className="badge badge-blue">{pl.habilidades.length} habilidades</span>
          </div>
          {D.MATRIZES.filter(m => pl.habilidades.some(c => (D.habByCod[c] || {}).matriz === m.id)).map(m => (
            <div key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <MatrizBadge matriz={m.id} />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.desc}</span>
              </div>
              {pl.habilidades.filter(c => (D.habByCod[c] || {}).matriz === m.id).map(c => {
                const h = D.habByCod[c];
                const t = trab[c] || { status: 'pendente', avaliacoes: 0 };
                const [cls, lbl] = stMap[t.status];
                return (
                  <div key={c} style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span className="code-pill" style={{ marginTop: 2 }}>{h.rotulo || c}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 }}>{h.desc}</div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I name="check" size={13} />{t.avaliacoes} avaliações</span>
                        {t.ultima && <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I name="clock" size={13} />última {t.ultima}</span>}
                      </div>
                    </div>
                    <span className={'badge ' + cls}>{lbl}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <div className="section-title">Habilidades por matriz</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {D.MATRIZES.filter(m => pl.habilidades.some(c => (D.habByCod[c] || {}).matriz === m.id)).map(m => {
                const n = pl.habilidades.filter(c => (D.habByCod[c] || {}).matriz === m.id).length;
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: m.cor, flex: 'none' }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.nome}</span>
                    <span className="num" style={{ fontWeight: 700 }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-title">Direcionamento</div>
            {[['Mês', D.periodoNome(pl.periodo)], ['Séries', anosTxt], ['Grupo', grupoTxt], ['Criado por', pl.criadoPor ? D.usuarioNome(pl.criadoPor) : '—'], ['Criado em', pl.criadoEm], ['Status', statusTxt]].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{r[0]}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* sequências didáticas semanais recebidas dos professores */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-pad" style={{ borderBottom: Object.keys(porProf).length ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15 }}>Sequências didáticas semanais</h3>
          <span className="badge badge-blue">{Object.keys(porProf).length} {Object.keys(porProf).length === 1 ? 'professor' : 'professores'}</span>
        </div>
        {Object.keys(porProf).length === 0 ? (
          <div style={{ padding: '30px 22px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>Nenhum professor preencheu as sequências semanais ainda.</div>
        ) : Object.entries(porProf).map(([profId, lista]) => (
          <div key={profId} style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Avatar {...(D.prof(profId) || { nome: D.profNome(profId), iniciais: '?', cor: '#64748b' })} size={30} />
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{D.profNome(profId)}</span>
              <span className="badge badge-gray">{lista.length} {lista.length === 1 ? 'semana' : 'semanas'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lista.slice().sort((a, b) => a.semana - b.semana).map(s => <SemanaCard key={s.id} s={s} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------- Catálogo de matrizes & habilidades -------- */
export const HabilidadesBNCC = () => {
  const D = DATA;
  const [comp, setComp] = useState('todos');
  const [mat, setMat] = useState('todas');
  const list = D.HABILIDADES.filter(h => (comp === 'todos' || h.comp === comp) && (mat === 'todas' || h.matriz === mat));
  return (
    <div className="fade-in">
      <PageHeader title="Matrizes & habilidades" subtitle="Catálogo de habilidades disponíveis para vínculo aos planejamentos, organizadas por matriz de referência (BNCC, SAEB, SEAMA e Habilidades Leitoras) e componente." />

      {/* resumo por matriz */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        {D.MATRIZES.map(m => {
          const n = D.HABILIDADES.filter(h => h.matriz === m.id).length;
          return (
            <button key={m.id} className="card card-pad" onClick={() => setMat(mat === m.id ? 'todas' : m.id)}
              style={{ textAlign: 'left', borderColor: mat === m.id ? m.cor : 'var(--border)', borderWidth: mat === m.id ? 1.5 : 1, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: m.cor + '18', color: m.cor, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11 }}>{m.id === 'LEITORA' ? 'HL' : m.nome.slice(0, 4)}</span>
                <span className="num" style={{ fontSize: 24, fontWeight: 800 }}>{n}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.nome}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.35, marginTop: 2 }}>{m.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="seg">
            <button className={mat === 'todas' ? 'active' : ''} onClick={() => setMat('todas')}>Todas matrizes</button>
            {D.MATRIZES.map(m => <button key={m.id} className={mat === m.id ? 'active' : ''} onClick={() => setMat(m.id)}>{m.nome}</button>)}
          </div>
          <div className="seg">
            <button className={comp === 'todos' ? 'active' : ''} onClick={() => setComp('todos')}>Todos</button>
            {D.COMPONENTES.map(c => <button key={c.id} className={comp === c.id ? 'active' : ''} onClick={() => setComp(c.id)}>{c.nome}</button>)}
          </div>
        </div>
        <button className="btn btn-primary"><I name="plus" size={15} />Adicionar habilidade</button>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Código</th><th>Matriz</th><th>Componente</th><th>Descrição</th><th style={{ textAlign: 'right' }}>Em uso</th></tr></thead>
          <tbody>
            {list.map(h => {
              const usos = D.PLANEJAMENTOS.filter(p => p.habilidades.includes(h.cod)).length;
              return (
                <tr key={h.cod} className="clickable">
                  <td><span className="code-pill">{h.rotulo || h.cod}</span></td>
                  <td><MatrizBadge matriz={h.matriz} /></td>
                  <td><span className={'badge ' + (h.comp === 'lp' ? 'badge-blue' : 'badge-gray')} style={h.comp !== 'lp' ? { background: 'var(--violet-bg)', color: 'var(--violet)' } : {}}>{D.compNome(h.comp)}</span></td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 460 }}>{h.desc}</td>
                  <td style={{ textAlign: 'right' }}>{usos > 0 ? <span className="badge badge-green">{usos} planej.</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
