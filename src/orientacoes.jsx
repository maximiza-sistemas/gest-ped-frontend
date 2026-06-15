/* ============================================================
   Orientações (gestor) + Trilhas de aprendizagem (professor)

   - Gestor: indica habilidade(s)/expectativas (ou "trabalho geral"),
     define o escopo (toda a rede ou escolas) e a(s) série(s).
   - Professor: complementa com a trilha de aprendizagem (etapas
     ordenadas) para o melhor desenvolvimento da habilidade.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, criarOrientacao, salvarTrilha, atualizarOrientacao, fetchOrientacao } from './store.js';
import { PageHeader, Modal, I, MatrizBadge, Avatar } from './ui.jsx';

/* ---------------- helpers de exibição ---------------- */
const escopoTxt = o => o.escopo === 'geral'
  ? 'Toda a rede'
  : (o.escolaIds.length === 1 ? DATA.escolaNome(o.escolaIds[0]) : `${o.escolaIds.length} escolas`);
const anosTxt = o => o.anos && o.anos.length ? o.anos.map(a => a + 'º').join(', ') + ' ano' : 'Todas as séries';
const habTxt = o => o.modoGeral ? 'Trabalho geral' : `${o.habilidades.length} habilidade${o.habilidades.length === 1 ? '' : 's'}`;

const OrientacaoChips = ({ o }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <span className="chip"><I name={o.escopo === 'geral' ? 'layers' : 'users'} size={13} />{escopoTxt(o)}</span>
    <span className="chip"><I name="grad" size={13} />{anosTxt(o)}</span>
    {o.comp && <span className="chip"><I name="book" size={13} />{DATA.compNome(o.comp)}</span>}
    <span className="chip"><I name={o.modoGeral ? 'target' : 'skills'} size={13} />{habTxt(o)}</span>
  </div>
);

/* ============================================================
   SECRETARIA — lista de orientações (gestor escolar: somente leitura)
   ============================================================ */
export const Orientacoes = ({ openOrientacao }) => {
  const D = DATA;
  const [novo, setNovo] = useState(false);
  const lista = D.ORIENTACOES;
  // só a Secretaria de Educação (e o admin, superusuário) cria orientações;
  // o gestor escolar acompanha em modo somente-leitura
  const podeCriar = ['admin', 'secretaria'].includes(D.CURRENT_USER?.perfil);

  return (
    <div className="fade-in">
      <PageHeader
        title="Orientações pedagógicas"
        subtitle={podeCriar
          ? 'Indique as habilidades ou expectativas de aprendizagem a trabalhar (ou um trabalho geral), defina o escopo (toda a rede ou escolas) e a série. Cada professor complementa com a sua trilha de aprendizagem.'
          : 'Orientações da Secretaria de Educação para a rede. Acompanhe o escopo, as séries e as trilhas de aprendizagem enviadas pelos professores.'}
        actions={podeCriar ? <button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={16} />Nova orientação</button> : null}
      />

      {lista.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '54px 24px', color: 'var(--text-2)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="target" size={28} /></div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhuma orientação ainda</h3>
          <p style={{ fontSize: 13.5, maxWidth: 440, margin: '0 auto 18px' }}>{podeCriar
            ? 'Crie a primeira orientação para direcionar habilidades aos professores e acompanhar as trilhas de aprendizagem.'
            : 'Quando a Secretaria de Educação publicar orientações, elas aparecerão aqui.'}</p>
          {podeCriar && <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setNovo(true)}><I name="plus" size={16} />Nova orientação</button>}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {lista.map(o => (
            <div key={o.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', overflow: 'hidden' }}
              onClick={() => openOrientacao(o.id)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ height: 5, background: o.modoGeral ? 'var(--violet)' : 'var(--primary)' }} />
              <div className="card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15.5, lineHeight: 1.3 }}>{o.titulo}</h3>
                  <span className={'badge ' + (o.status === 'ativa' ? 'badge-green' : 'badge-gray')} style={{ flex: 'none' }}>{o.status === 'ativa' ? 'Ativa' : 'Arquivada'}</span>
                </div>
                {o.objetivo && <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{o.objetivo}</p>}
                <OrientacaoChips o={o} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: o.respostas > 0 ? 'var(--green-bg)' : 'var(--surface-3)', color: o.respostas > 0 ? 'var(--green)' : 'var(--text-3)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name="layers" size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{o.respostas} {o.respostas === 1 ? 'trilha recebida' : 'trilhas recebidas'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Criada em {o.criadoEm}</div>
                  </div>
                  <I name="chevR" size={17} style={{ color: 'var(--text-4)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {novo && <NovaOrientacao onClose={() => setNovo(false)} />}
    </div>
  );
};

/* ============================================================
   SECRETARIA — wizard de nova orientação
   ============================================================ */
export const NovaOrientacao = ({ onClose }) => {
  const D = DATA;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    titulo: '', objetivo: '', comp: '', periodo: '',
    modoGeral: false, habs: [],
    escopo: 'geral', escolaIds: [], anos: [],
  });
  const [matFilter, setMatFilter] = useState('todas');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const steps = ['Informações', 'Habilidades', 'Escopo e séries'];

  const habsDisp = D.HABILIDADES.filter(h => !form.comp || h.comp === form.comp);
  const toggleHab = c => set('habs', form.habs.includes(c) ? form.habs.filter(x => x !== c) : [...form.habs, c]);
  const toggleEscola = id => set('escolaIds', form.escolaIds.includes(id) ? form.escolaIds.filter(x => x !== id) : [...form.escolaIds, id]);
  const toggleAno = a => set('anos', form.anos.includes(a) ? form.anos.filter(x => x !== a) : [...form.anos, a]);

  const podeAvancar = step === 1
    ? form.titulo.trim().length >= 3
    : step === 2
      ? (form.modoGeral || form.habs.length > 0)
      : (form.escopo === 'geral' || form.escolaIds.length > 0);

  const criar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await criarOrientacao({ ...form, habilidades: form.habs });
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
      {step < 3
        ? <button className="btn btn-primary" disabled={!podeAvancar} style={{ opacity: podeAvancar ? 1 : .5 }} onClick={() => setStep(step + 1)}>Continuar<I name="chevR" size={15} /></button>
        : <button className="btn btn-primary" disabled={salvando || !podeAvancar} style={{ opacity: salvando || !podeAvancar ? .6 : 1 }} onClick={criar}><I name="check2" size={15} />{salvando ? 'Criando…' : 'Criar orientação'}</button>}
    </>
  );

  return (
    <Modal title="Nova orientação pedagógica" subtitle={`Etapa ${step} de 3 · ${steps[step - 1]}`} icon="target" width={660} onClose={onClose} footer={foot}>
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
            <label className="field-label">Título da orientação</label>
            <input className="input" placeholder="Ex.: Consolidar a decodificação na alfabetização" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Objetivo / orientação ao professor</label>
            <textarea className="input" rows={3} placeholder="Descreva o que deve ser priorizado e por quê…" value={form.objetivo} onChange={e => set('objetivo', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Componente <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(opcional)</span></label>
              <select className="input" value={form.comp} onChange={e => { set('comp', e.target.value); set('habs', []); setMatFilter('todas'); }}>
                <option value="">Todos os componentes</option>
                {D.COMPONENTES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Período <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(opcional)</span></label>
              <select className="input" value={form.periodo} onChange={e => set('periodo', e.target.value)}>
                <option value="">Sem período definido</option>
                {D.PERIODOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          {/* modo geral */}
          <button onClick={() => set('modoGeral', !form.modoGeral)}
            style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', textAlign: 'left', borderRadius: 11, marginBottom: 16,
              border: '1.5px solid ' + (form.modoGeral ? 'var(--violet)' : 'var(--border)'), background: form.modoGeral ? 'var(--violet-bg)' : 'var(--surface)' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, flex: 'none', marginTop: 1, display: 'grid', placeItems: 'center',
              border: '2px solid ' + (form.modoGeral ? 'var(--violet)' : 'var(--border-strong)'), background: form.modoGeral ? 'var(--violet)' : 'transparent', color: '#fff' }}>
              {form.modoGeral && <I name="check2" size={13} sw={3} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Trabalho geral (sem habilidade específica)</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>Orientação de prática pedagógica ampla, sem vincular a uma habilidade do catálogo.</div>
            </div>
          </button>

          {!form.modoGeral && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
                Selecione as habilidades / expectativas a trabalhar. <b>{form.habs.length}</b> selecionada(s).
              </p>
              <div className="seg" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <button className={matFilter === 'todas' ? 'active' : ''} onClick={() => setMatFilter('todas')}>Todas</button>
                {D.MATRIZES.filter(m => habsDisp.some(h => h.matriz === m.id)).map(m => (
                  <button key={m.id} className={matFilter === m.id ? 'active' : ''} onClick={() => setMatFilter(m.id)}>{m.nome}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {D.MATRIZES.filter(m => (matFilter === 'todas' || matFilter === m.id) && habsDisp.some(h => h.matriz === m.id)).map(m => (
                  <div key={m.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                      <MatrizBadge matriz={m.id} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.desc}</span>
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
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="field-label">Escopo</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['geral', 'Toda a rede', 'layers'], ['escolas', 'Escola(s) específica(s)', 'users']].map(([v, lbl, ic]) => (
                <button key={v} onClick={() => set('escopo', v)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, textAlign: 'left',
                    border: '1.5px solid ' + (form.escopo === v ? 'var(--primary)' : 'var(--border)'), background: form.escopo === v ? 'var(--primary-50)' : 'var(--surface)' }}>
                  <I name={ic} size={18} style={{ color: form.escopo === v ? 'var(--primary)' : 'var(--text-3)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          {form.escopo === 'escolas' && (
            <div>
              <label className="field-label">Escolas <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(uma ou mais — grupo de escolas)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {D.ESCOLAS.map(e => {
                  const on = form.escolaIds.includes(e.id);
                  return (
                    <button key={e.id} onClick={() => toggleEscola(e.id)}
                      style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '10px 13px', textAlign: 'left', borderRadius: 10,
                        border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border)'), background: on ? 'var(--primary-50)' : 'var(--surface)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, flex: 'none', display: 'grid', placeItems: 'center',
                        border: '2px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'), background: on ? 'var(--primary)' : 'transparent', color: '#fff' }}>
                        {on && <I name="check2" size={12} sw={3} />}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{e.nome}</span>
                      <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{e.zona}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Séries <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(vazio = todas)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {D.ANOS.map(a => {
                const on = form.anos.includes(a);
                return (
                  <button key={a} onClick={() => toggleAno(a)}
                    style={{ padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                      border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'),
                      background: on ? 'var(--primary)' : 'transparent', color: on ? '#fff' : 'var(--text-2)' }}>
                    {a}º ano
                  </button>
                );
              })}
            </div>
          </div>

          {/* resumo */}
          <div className="card" style={{ background: 'var(--surface-2)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Resumo</div>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>{form.titulo || 'Orientação sem título'}</h3>
            <OrientacaoChips o={{ escopo: form.escopo, escolaIds: form.escolaIds, anos: form.anos, comp: form.comp, modoGeral: form.modoGeral, habilidades: form.habs }} />
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ============================================================
   SECRETARIA — detalhe da orientação + trilhas recebidas
   ============================================================ */
export const OrientacaoDetail = ({ orientacaoId, back }) => {
  const D = DATA;
  const [o, setO] = useState(null);
  const [erro, setErro] = useState(null);
  // editar/arquivar é exclusivo da Secretaria (e do admin); gestor é view-only
  const podeEditar = ['admin', 'secretaria'].includes(D.CURRENT_USER?.perfil);

  useEffect(() => {
    let ativo = true;
    fetchOrientacao(orientacaoId)
      .then(d => { if (ativo) setO(d); })
      .catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [orientacaoId]);

  const arquivar = async () => {
    await atualizarOrientacao(orientacaoId, { status: o.status === 'ativa' ? 'arquivada' : 'ativa' });
    setO(await fetchOrientacao(orientacaoId));
  };

  if (erro) return <div className="card card-pad" style={{ color: 'var(--red)' }}><I name="info" size={16} /> {erro}</div>;
  if (!o) return <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Carregando orientação…</div>;

  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar às orientações</button>
      <PageHeader
        title={o.titulo}
        subtitle={o.objetivo}
        actions={podeEditar ? <button className="btn btn-ghost" onClick={arquivar}><I name={o.status === 'ativa' ? 'x' : 'check2'} size={15} />{o.status === 'ativa' ? 'Arquivar' : 'Reativar'}</button> : null}
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* trilhas recebidas */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15 }}>Trilhas de aprendizagem</h3>
            <span className="badge badge-blue">{o.trilhas.length} {o.trilhas.length === 1 ? 'professor' : 'professores'}</span>
          </div>
          {o.trilhas.length === 0 ? (
            <div style={{ padding: '34px 22px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
              Nenhum professor enviou a trilha ainda.
            </div>
          ) : o.trilhas.map(t => {
            const prof = D.prof(t.prof) || { nome: D.profNome(t.prof), iniciais: '?', cor: '#64748b' };
            return (
              <div key={t.id} style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <Avatar nome={prof.nome} iniciais={prof.iniciais} cor={prof.cor} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{prof.nome}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t.etapas.length} etapas · atualizada em {t.atualizadoEm}</div>
                  </div>
                  <span className={'badge ' + (t.status === 'publicada' ? 'badge-green' : 'badge-amber')}>{t.status === 'publicada' ? 'Publicada' : 'Rascunho'}</span>
                </div>
                <Etapas etapas={t.etapas} />
                {t.observacao && <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 12, padding: '10px 13px', background: 'var(--surface-2)', borderRadius: 9 }}><b>Observação:</b> {t.observacao}</p>}
              </div>
            );
          })}
        </div>

        {/* lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <div className="section-title">Escopo</div>
            {[['Alcance', escopoTxt(o)], ['Séries', anosTxt(o)], ['Componente', o.comp ? D.compNome(o.comp) : 'Todos'], ['Período', o.periodo ? D.periodoNome(o.periodo) : '—'], ['Criada por', D.usuarioNome(o.criadoPor)], ['Status', o.status === 'ativa' ? 'Ativa' : 'Arquivada']].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{r[0]}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{r[1]}</span>
              </div>
            ))}
          </div>

          {o.escopo === 'escolas' && o.escolaIds.length > 0 && (
            <div className="card card-pad">
              <div className="section-title">Escolas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {o.escolaIds.map(id => <span key={id} style={{ fontSize: 13, fontWeight: 600 }}>{D.escolaNome(id)}</span>)}
              </div>
            </div>
          )}

          <div className="card card-pad">
            <div className="section-title">{o.modoGeral ? 'Foco' : 'Habilidades indicadas'}</div>
            {o.modoGeral ? (
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Trabalho geral, sem habilidade específica do catálogo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {o.habilidades.map(c => {
                  const h = D.habByCod[c] || { desc: c };
                  return (
                    <div key={c} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span className="code-pill" style={{ marginTop: 1 }}>{D.rotulo(c)}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{h.desc}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* etapas ordenadas (somente leitura) */
const Etapas = ({ etapas }) => (
  <div style={{ position: 'relative', paddingLeft: 6 }}>
    {etapas.map((e, i) => (
      <div key={e.id || i} style={{ display: 'flex', gap: 13, paddingBottom: i < etapas.length - 1 ? 16 : 0, position: 'relative' }}>
        {i < etapas.length - 1 && <div style={{ position: 'absolute', left: 13, top: 28, bottom: 0, width: 2, background: 'var(--border)' }} />}
        <div style={{ width: 28, height: 28, borderRadius: '50%', flex: 'none', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, zIndex: 1 }}>{i + 1}</div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.titulo}</div>
          {e.descricao && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.45 }}>{e.descricao}</div>}
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   PROFESSOR — orientações recebidas + editor de trilha
   ============================================================ */
export const OrientacoesProfessor = () => {
  const D = DATA;
  const [editar, setEditar] = useState(null); // orientação em edição
  const lista = D.ORIENTACOES;

  return (
    <div className="fade-in">
      <PageHeader
        title="Orientações"
        subtitle="Orientações da coordenação para as suas turmas. Complemente cada uma com a sua trilha de aprendizagem: as etapas e estratégias que você vai usar para desenvolver a habilidade."
      />

      {lista.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '54px 24px', color: 'var(--text-2)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><I name="target" size={28} /></div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Nenhuma orientação no momento</h3>
          <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>Quando a coordenação publicar orientações para as suas turmas, elas aparecerão aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lista.map(o => {
            const respondida = !!o.minhaTrilha;
            return (
              <div key={o.id} className="card card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15.5 }}>{o.titulo}</h3>
                      {respondida
                        ? <span className="badge badge-green"><I name="check2" size={11} />Trilha enviada</span>
                        : <span className="badge badge-amber">Pendente</span>}
                    </div>
                    {o.objetivo && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>{o.objetivo}</p>}
                    <OrientacaoChips o={o} />

                    {!o.modoGeral && o.habilidades.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                        {o.habilidades.map(c => <span key={c} className="code-pill">{D.rotulo(c)}</span>)}
                      </div>
                    )}

                    {respondida && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Minha trilha · {o.minhaTrilha.etapas.length} etapas</div>
                        <Etapas etapas={o.minhaTrilha.etapas} />
                      </div>
                    )}
                  </div>
                  <button className={'btn ' + (respondida ? 'btn-ghost' : 'btn-primary')} style={{ flex: 'none' }} onClick={() => setEditar(o)}>
                    <I name={respondida ? 'edit' : 'plus'} size={15} />{respondida ? 'Editar trilha' : 'Adicionar trilha'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editar && <TrilhaEditor orientacao={editar} onClose={() => setEditar(null)} />}
    </div>
  );
};

/* ============================================================
   PROFESSOR — editor da trilha (etapas ordenadas)
   ============================================================ */
export const TrilhaEditor = ({ orientacao, onClose }) => {
  const D = DATA;
  const inicial = orientacao.minhaTrilha?.etapas?.length
    ? orientacao.minhaTrilha.etapas.map(e => ({ titulo: e.titulo, descricao: e.descricao || '' }))
    : [{ titulo: '', descricao: '' }];
  const [etapas, setEtapas] = useState(inicial);
  const [obs, setObs] = useState(orientacao.minhaTrilha?.observacao || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const upd = (i, k, v) => setEtapas(es => es.map((e, j) => j === i ? { ...e, [k]: v } : e));
  const add = () => setEtapas(es => [...es, { titulo: '', descricao: '' }]);
  const remove = i => setEtapas(es => es.length > 1 ? es.filter((_, j) => j !== i) : es);
  const move = (i, dir) => setEtapas(es => {
    const j = i + dir;
    if (j < 0 || j >= es.length) return es;
    const cp = es.slice(); [cp[i], cp[j]] = [cp[j], cp[i]]; return cp;
  });

  const validas = etapas.filter(e => e.titulo.trim());
  const podeSalvar = validas.length > 0;

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await salvarTrilha(orientacao.id, {
        etapas: validas.map(e => ({ titulo: e.titulo.trim(), descricao: e.descricao.trim() })),
        observacao: obs.trim(),
        status: 'publicada',
      });
      onClose();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}><I name="info" size={14} />{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={!podeSalvar || salvando} style={{ opacity: !podeSalvar || salvando ? .5 : 1 }} onClick={salvar}>
        <I name="check2" size={15} />{salvando ? 'Salvando…' : 'Salvar trilha'}
      </button>
    </>
  );

  return (
    <Modal title="Trilha de aprendizagem" subtitle={orientacao.titulo} icon="layers" width={680} onClose={onClose} footer={foot}>
      {/* contexto da orientação */}
      <div className="card" style={{ background: 'var(--surface-2)', padding: 14, marginBottom: 18 }}>
        {orientacao.objetivo && <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>{orientacao.objetivo}</p>}
        {orientacao.modoGeral ? (
          <span className="chip"><I name="target" size={13} />Trabalho geral</span>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {orientacao.habilidades.map(c => <span key={c} className="code-pill" title={(D.habByCod[c] || {}).desc}>{D.rotulo(c)}</span>)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label className="field-label" style={{ margin: 0 }}>Etapas da trilha <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(ordenadas)</span></label>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{validas.length} etapa(s)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {etapas.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 13, border: '1px solid var(--border)', borderRadius: 11, background: 'var(--surface)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, marginTop: 2 }}>{i + 1}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="input" placeholder="Título da etapa (ex.: Sondagem inicial)" value={e.titulo} onChange={ev => upd(i, 'titulo', ev.target.value)} />
              <textarea className="input" rows={2} placeholder="Estratégia / descrição (opcional)" value={e.descricao} onChange={ev => upd(i, 'descricao', ev.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none' }}>
              <button className="icon-btn" title="Mover para cima" disabled={i === 0} style={{ opacity: i === 0 ? .4 : 1, width: 30, height: 30 }} onClick={() => move(i, -1)}><I name="arrowUp" size={14} /></button>
              <button className="icon-btn" title="Mover para baixo" disabled={i === etapas.length - 1} style={{ opacity: i === etapas.length - 1 ? .4 : 1, width: 30, height: 30 }} onClick={() => move(i, 1)}><I name="arrowDown" size={14} /></button>
              <button className="icon-btn" title="Remover etapa" disabled={etapas.length === 1} style={{ opacity: etapas.length === 1 ? .4 : 1, width: 30, height: 30, color: 'var(--red)' }} onClick={() => remove(i)}><I name="x" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-subtle" style={{ width: '100%', marginBottom: 18 }} onClick={add}><I name="plus" size={15} />Adicionar etapa</button>

      <div>
        <label className="field-label">Observação <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(opcional)</span></label>
        <textarea className="input" rows={2} placeholder="Notas gerais sobre a trilha…" value={obs} onChange={e => setObs(e.target.value)} style={{ resize: 'vertical' }} />
      </div>
    </Modal>
  );
};
