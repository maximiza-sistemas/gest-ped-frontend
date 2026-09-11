/* ============================================================
   Admin (parte 2) — Detalhe da escola (espelho do SAG, consulta),
   Usuários & acessos, Configurações
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, adminCriarUsuario, adminEditarUsuario, adminExcluirUsuario, adminConfig, adminSalvarConfig,
  fetchTurmas } from './store.js';
import { PageHeader, Stat, I, Avatar, Modal, Bar } from './ui.jsx';
import { confirmar } from './dialogo.jsx';
import { useEvolucao } from './evolucao.jsx';
import { ZonaBadge } from './admin.jsx';

const Carregando = ({ back }) => (
  <div className="fade-in">
    {back && <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>}
    <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Carregando…</div>
  </div>
);

/* -------- Detalhe da escola -------- */
export const AdminEscolaDetail = ({ escolaId, back }) => {
  const D = DATA;
  // aplicação e atingimento por turma (drill do endpoint de evolução)
  const { dados: evolucao } = useEvolucao({ escola: escolaId });
  const e = D.escola(escolaId);
  if (!e) return <Carregando back={back} />;
  const statsTurma = new Map(((evolucao && evolucao.turmasDetalhe) || []).map(t => [t.id, t]));
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar às escolas</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, flex: 'none' }}>{e.sigla}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>{e.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <ZonaBadge zona={e.zona} />
            <span className="chip"><I name="pin" size={13} />{e.bairro}</span>
            <span className="chip"><I name="user" size={13} />Dir. {e.diretor}</span>
            <span className="chip">Anos: {e.anos.map(a => D.anoNome(a)).join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 18 }}>
        <Stat label="Turmas" value={e.totTurmas} icon="grid" accent={e.cor} />
        <Stat label="Alunos" value={e.totAlunos} icon="users" accent="#6d4bd1" />
        <Stat label="Professores" value={e.professores} icon="grad" accent="#0e8aa8" />
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Turmas · {e.totTurmas}</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Turma</th><th>Ano</th><th>Turno</th>
            <th style={{ textAlign: 'center' }}>Alunos</th>
            <th>% aplicado</th>
            <th>Atingiu × Não atingiu</th>
          </tr></thead>
          <tbody>
            {e.turmas.map(t => {
              const s = statsTurma.get(t.id);
              const aplicado = s && t.alunos.length ? Math.round((s.alunosAvaliados / t.alunos.length) * 100) : 0;
              const nao = s ? s.avaliacoes - s.atingiram : 0;
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.nome}</td>
                  <td style={{ color: 'var(--text-2)' }}>{D.anoNome(t.ano)}</td>
                  <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                  <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="num" style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right' }}>{aplicado}%</span>
                      <div style={{ flex: 1 }}><Bar value={aplicado} height={7} /></div>
                      <span className="num" style={{ fontSize: 11, color: 'var(--text-3)', width: 42 }}>{s ? s.alunosAvaliados : 0}/{t.alunos.length}</span>
                    </div>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    {s && s.avaliacoes > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${s.atingiram} atingiram · ${nao} não atingiram`}>
                        <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', width: 24, textAlign: 'right' }}>{s.atingiram}</span>
                        <div style={{ flex: 1, display: 'flex', height: 8, borderRadius: 20, overflow: 'hidden', background: 'var(--surface-3)' }}>
                          <div style={{ width: (s.atingiram / s.avaliacoes * 100) + '%', background: 'var(--green)' }} />
                          <div style={{ width: (nao / s.avaliacoes * 100) + '%', background: 'var(--red)' }} />
                        </div>
                        <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', width: 24 }}>{nao}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Sem avaliações</span>
                    )}
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

/* Turmas e alunos são espelho do SAG: no perfil de rede não há telas de cadastro nem
   de listagem — a consulta é agregada, pelo dashboard e pelo detalhe da escola. */

/* -------- Usuários & acessos -------- */
const UserForm = ({ titulo, inicial, onSave, onClose, editando }) => {
  const D = DATA;
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  // escolas do gestor: busca na rede inteira + seleção múltipla
  const [buscaEscola, setBuscaEscola] = useState('');
  const escolasSel = f.escolaIds || [];
  const termo = buscaEscola.trim().toLowerCase();
  const tokensE = termo.split(/\s+/).filter(Boolean); // cada palavra precisa aparecer (nome, sigla ou zona)
  const escolasFiltradas = (D.ESCOLAS || []).filter(e => {
    const alvo = `${e.nome} ${e.sigla || ''} ${e.zona || ''}`.toLowerCase();
    return tokensE.every(tk => alvo.includes(tk));
  });
  const toggleEscola = id => set('escolaIds',
    escolasSel.includes(id) ? escolasSel.filter(x => x !== id) : [...escolasSel, id]);

  // vínculo do professor: turmas de toda a rede, com busca por turma / escola / ano
  const [turmasRede, setTurmasRede] = useState(DATA.TURMAS);
  const [buscaTurma, setBuscaTurma] = useState('');
  useEffect(() => {
    let ativo = true;
    fetchTurmas().then(ts => { if (ativo) setTurmasRede(ts); }).catch(() => {});
    return () => { ativo = false; };
  }, []);
  const turmasSel = f.turmaIds || [];
  const termoT = buscaTurma.trim().toLowerCase();
  const tokensT = termoT.split(/\s+/).filter(Boolean); // cada palavra precisa aparecer (turma, escola ou ano)
  const turmasFiltradas = turmasRede.filter(t => {
    const alvo = `${t.nome} ${D.escolaNome(t.escola)} ${D.anoNome(t.ano)}`.toLowerCase();
    return tokensT.every(tk => alvo.includes(tk));
  });
  const toggleTurma = tid => set('turmaIds',
    turmasSel.includes(tid) ? turmasSel.filter(x => x !== tid) : [...turmasSel, tid]);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await onSave(f);
      onClose();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  const foot = (
    <>
      {erro && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12.5 }}>{erro}</span>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={salvando} onClick={salvar} style={{ opacity: salvando ? .6 : 1 }}>
        <I name="check2" size={15} />{salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal title={titulo} icon="user" width={480} onClose={onClose} footer={foot}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Nome completo</label>
          <input className="input" value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Maria da Silva" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div>
            <label className="field-label">E-mail</label>
            <input className="input" value={f.email} onChange={e => set('email', e.target.value)} placeholder="email@rededeensino.edu.br" />
          </div>
          <div>
            <label className="field-label">{editando ? 'Nova senha (opcional)' : 'Senha'}</label>
            <input className="input" type="password" value={f.senha} onChange={e => set('senha', e.target.value)} placeholder={editando ? 'Manter atual' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className="field-label">Perfil</label>
            <select className="input" value={f.perfil} onChange={e => set('perfil', e.target.value)}>
              <option value="secretaria">Secretaria de Educação</option>
              <option value="gestor">Gestor Escolar / Coordenador</option>
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="field-label">Cargo</label>
            <input className="input" value={f.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex.: Coordenadora" />
          </div>
        </div>
        {f.perfil === 'professor' && (
          <>
            <div className="grid grid-cols-2" style={{ gap: 14 }}>
              <div>
                <label className="field-label">Professor vinculado</label>
                <select className="input" value={f.profId || ''} onChange={e => {
                  const pid = e.target.value || null;
                  const prof = D.PROFESSORES.find(x => x.id === pid);
                  setF(x => ({ ...x, profId: pid, ...(prof ? { comp: prof.comp, turmaIds: prof.turmaIds || [] } : {}) }));
                }}>
                  <option value="">— novo professor —</option>
                  {D.PROFESSORES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Componente curricular</label>
                <select className="input" value={f.comp || (D.COMPONENTES[0] || {}).id || ''} onChange={e => set('comp', e.target.value)}>
                  {D.COMPONENTES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">
                Turmas do professor{' '}
                <span style={{ color: turmasSel.length ? 'var(--primary)' : 'var(--red)', fontWeight: 700 }}>({turmasSel.length} selecionada{turmasSel.length === 1 ? '' : 's'})</span>
                <span style={{ color: 'var(--text-4)', fontWeight: 400 }}> — recebe as habilidades direcionadas ao ano e ao grupo dessas turmas</span>
              </label>
              {turmasSel.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {turmasSel.map(id => {
                    const t = turmasRede.find(x => x.id === id);
                    return (
                      <span key={id} className="chip" style={{ background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 600, paddingRight: 4 }}>
                        {t ? `${t.nome} · ${D.escolaNome(t.escola)}` : id}
                        <button type="button" className="icon-btn" title="Remover turma" onClick={() => toggleTurma(id)}
                          style={{ width: 20, height: 20, marginLeft: 4, background: 'transparent', border: 'none', color: 'inherit' }}>
                          <I name="x" size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <I name="search" size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-3)' }} />
                <input className="input" placeholder="Buscar turma, escola ou ano…" value={buscaTurma}
                  onChange={e => setBuscaTurma(e.target.value)} style={{ paddingLeft: 34 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 6 }}>
                {turmasFiltradas.slice(0, 80).map(t => {
                  const on = turmasSel.includes(t.id);
                  return (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 9px', borderRadius: 8, cursor: 'pointer',
                      background: on ? 'var(--primary-50)' : 'transparent' }}>
                      <input type="checkbox" checked={on} onChange={() => toggleTurma(t.id)} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.nome}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{D.anoNome(t.ano)} · {D.escolaNome(t.escola)}</span>
                      {t.turno && <span className="badge badge-gray">{t.turno}</span>}
                    </label>
                  );
                })}
                {turmasFiltradas.length === 0 && (
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '6px 9px' }}>
                    {turmasRede.length ? 'Nenhuma turma encontrada para essa busca.' : 'Nenhuma turma cadastrada.'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 6 }}>
                {turmasFiltradas.length} de {turmasRede.length} turmas da rede{termoT ? ' correspondem à busca' : ''}{turmasFiltradas.length > 80 ? ' · refine a busca para ver as demais' : ''}.
              </div>
            </div>
          </>
        )}
        {f.perfil === 'gestor' && (
          <div>
            <label className="field-label">
              Escolas do gestor{' '}
              <span style={{ color: escolasSel.length ? 'var(--primary)' : 'var(--red)', fontWeight: 700 }}>({escolasSel.length} selecionada{escolasSel.length === 1 ? '' : 's'})</span>
              <span style={{ color: 'var(--text-4)', fontWeight: 400 }}> — o gestor acessa somente os dados dessas escolas</span>
            </label>
            {escolasSel.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {escolasSel.map(id => {
                  const e = (D.ESCOLAS || []).find(x => x.id === id) || { nome: id };
                  return (
                    <span key={id} className="chip" style={{ background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 600, paddingRight: 4 }}>
                      {e.nome}
                      <button type="button" className="icon-btn" title="Remover escola" onClick={() => toggleEscola(id)}
                        style={{ width: 20, height: 20, marginLeft: 4, background: 'transparent', border: 'none', color: 'inherit' }}>
                        <I name="x" size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <I name="search" size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-3)' }} />
              <input className="input" placeholder="Buscar escola por nome, sigla ou zona…" value={buscaEscola}
                onChange={e => setBuscaEscola(e.target.value)} style={{ paddingLeft: 34 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 6 }}>
              {escolasFiltradas.map(e => {
                const on = escolasSel.includes(e.id);
                return (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 9px', borderRadius: 8, cursor: 'pointer',
                    background: on ? 'var(--primary-50)' : 'transparent' }}>
                    <input type="checkbox" checked={on} onChange={() => toggleEscola(e.id)} />
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.nome}</span>
                    {e.sigla && <span className="num" style={{ fontSize: 11, color: 'var(--text-4)' }}>{e.sigla}</span>}
                    {e.zona && <span className="badge badge-gray">{e.zona}</span>}
                  </label>
                );
              })}
              {escolasFiltradas.length === 0 && (
                <span style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '6px 9px' }}>
                  {(D.ESCOLAS || []).length ? 'Nenhuma escola encontrada para essa busca.' : 'Nenhuma escola cadastrada.'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 6 }}>
              {escolasFiltradas.length} de {(D.ESCOLAS || []).length} escolas da rede{termo ? ' correspondem à busca' : ''}.
            </div>
          </div>
        )}
        {editando && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.ativo} onChange={e => set('ativo', e.target.checked)} />
            Conta ativa
          </label>
        )}
      </div>
    </Modal>
  );
};

export const AdminUsers = () => {
  const D = DATA;
  const users = D.USUARIOS;
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);

  const vinculoProf = f => f.perfil === 'professor'
    ? { ...(f.comp ? { comp: f.comp } : {}), turmaIds: f.turmaIds || [] }
    : {};
  const criar = f => adminCriarUsuario({
    nome: f.nome, email: f.email, senha: f.senha, perfil: f.perfil,
    cargo: f.cargo, profId: f.profId || null, escolaIds: f.escolaIds || [],
    ...vinculoProf(f),
  });
  const salvarEdicao = f => adminEditarUsuario(editar.id, {
    nome: f.nome, email: f.email, perfil: f.perfil, cargo: f.cargo,
    ativo: f.ativo, profId: f.profId || null, escolaIds: f.escolaIds || [],
    ...(f.senha ? { senha: f.senha } : {}),
    ...vinculoProf(f),
  });
  const profDe = id => D.PROFESSORES.find(x => x.id === id) || {};
  const excluir = u => confirmar({
    titulo: `Excluir o usuário ${u.nome}?`,
    mensagem: `A conta ${u.email} perde o acesso à plataforma imediatamente.`,
    perigo: true,
    textoConfirmar: 'Excluir usuário',
    aoConfirmar: () => adminExcluirUsuario(u.id),
  });

  return (
    <div className="fade-in">
      <PageHeader title="Usuários & acessos" subtitle="Contas da rede com quatro perfis: Secretaria de Educação, gestor escolar/coordenador, professor e administrador."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo usuário</button>} />
      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Total de contas" value={users.length} icon="users" accent="#2563eb" />
        <Stat label="Secretaria" value={users.filter(u => u.perfil === 'secretaria').length} icon="layers" accent="#0e7490" />
        <Stat label="Gestores" value={users.filter(u => u.perfil === 'gestor').length} icon="grad" accent="#6d4bd1" />
        <Stat label="Administradores" value={users.filter(u => u.perfil === 'admin').length} icon="settings" accent="#475569" />
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Usuário</th><th>Perfil</th><th>Cargo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="clickable">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar {...u} size={34} /><div><div style={{ fontWeight: 600 }}>{u.nome}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{u.email}</div></div></div></td>
                <td><span className={'badge ' + ({ admin: 'badge-gray', secretaria: 'badge-violet', professor: 'badge-cyan', gestor: 'badge-blue' }[u.perfil] || 'badge-blue')}>{{ admin: 'Admin', secretaria: 'Secretaria', gestor: 'Gestor', professor: 'Professor' }[u.perfil] || u.perfil}</span></td>
                <td style={{ color: 'var(--text-2)' }}>{u.cargo}</td>
                <td>{u.ativo !== false ? <span className="badge badge-green">Ativo</span> : <span className="badge badge-gray">Inativo</span>}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" title="Editar" onClick={() => setEditar(u)}><I name="edit" size={15} /></button>
                  <button className="icon-btn" title="Excluir" onClick={() => excluir(u)}><I name="x" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {novo && (
        <UserForm titulo="Novo usuário" onClose={() => setNovo(false)} onSave={criar}
          inicial={{ nome: '', email: '', senha: '', perfil: 'gestor', cargo: '', profId: null, escolaIds: [], comp: null, turmaIds: [] }} />
      )}
      {editar && (
        <UserForm titulo={'Editar — ' + editar.nome} editando onClose={() => setEditar(null)} onSave={salvarEdicao}
          inicial={{ nome: editar.nome, email: editar.email, senha: '', perfil: editar.perfil, cargo: editar.cargo, profId: editar.profId || null, escolaIds: editar.escolaIds || [], ativo: editar.ativo !== false,
            comp: profDe(editar.profId).comp || null, turmaIds: profDe(editar.profId).turmaIds || [] }} />
      )}
    </div>
  );
};

/* -------- Configurações + permissões -------- */
export const AdminConfig = ({ go }) => {
  const D = DATA;
  // cartões alimentados pelos catálogos reais (nada fixo) com atalho para a página de gestão
  const periodoAtual = D.PERIODOS.find(p => p.atual);
  const cartoes = [
    ['Componentes curriculares', D.COMPONENTES.length ? D.COMPONENTES.map(c => c.nome).join(', ') : 'Nenhum cadastrado', 'skills', 'admcomponentes'],
    ['Períodos avaliativos', `${D.PERIODOS.length} período${D.PERIODOS.length === 1 ? '' : 's'} · atual: ${periodoAtual ? periodoAtual.nome : '—'}`, 'calendar', 'periodos'],
    // anos escolares vêm do espelho do SAG (série de cada turma) — sem cadastro
    ['Anos escolares (do SAG)', D.ANOS.length ? D.ANOS.map(a => a.nome).join(', ') : 'Nenhum sincronizado', 'grad', null],
  ];
  const [cfg, setCfg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let ativo = true;
    adminConfig().then(c => { if (ativo) setCfg(c); }).catch(() => { if (ativo) setCfg({}); });
    return () => { ativo = false; };
  }, []);

  const trocarPeriodo = async id => {
    setSalvando(true);
    setMsg(null);
    try {
      await adminSalvarConfig({ periodoAtual: id });
      setCfg(c => ({ ...c, periodoAtual: id }));
      setMsg('Período atual alterado.');
      setTimeout(() => setMsg(null), 2200);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
  <div className="fade-in">
    <PageHeader title="Configurações" subtitle="Parâmetros gerais do sistema e permissões por perfil." />

    {/* período avaliativo atual */}
    <div className="card card-pad" style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>Período avaliativo atual</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Define o bimestre vigente em toda a plataforma.</p>
        </div>
        {msg && <span style={{ fontSize: 12.5, fontWeight: 700, color: msg.includes('alterado') ? 'var(--green)' : 'var(--red)' }}>{msg}</span>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {D.PERIODOS.map(p => {
          const atual = cfg ? cfg.periodoAtual === p.id : p.atual;
          return (
            <button key={p.id} disabled={salvando || !cfg} onClick={() => trocarPeriodo(p.id)}
              style={{ padding: '10px 16px', borderRadius: 11, fontWeight: 700, fontSize: 13,
                border: '1.5px solid ' + (atual ? 'var(--primary)' : 'var(--border)'),
                background: atual ? 'var(--primary-50)' : 'var(--surface)',
                color: atual ? 'var(--primary)' : 'var(--text-2)', opacity: salvando ? .6 : 1 }}>
              {p.nome}{atual && ' · atual'}
            </button>
          );
        })}
      </div>
    </div>

    <div className="grid grid-cols-2" style={{ marginBottom: 22 }}>
      {cartoes.map(([titulo, resumo, icone, rota]) => (
        <div key={titulo} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name={icone} size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{titulo}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={resumo}>{resumo}</div>
          </div>
          {go && rota && <button className="btn btn-subtle btn-sm" onClick={() => go(rota)}>Gerenciar<I name="chevR" size={14} /></button>}
        </div>
      ))}
    </div>

    <div className="card card-pad">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Permissões por perfil</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>Secretaria de Educação e Administrador têm as mesmas atribuições (superusuários de rede).</p>
      <table className="tbl">
        <thead><tr><th>Funcionalidade</th>
          <th style={{ textAlign: 'center' }}>Secretaria</th>
          <th style={{ textAlign: 'center' }}>Gestor</th>
          <th style={{ textAlign: 'center' }}>Professor</th>
          <th style={{ textAlign: 'center' }}>Admin</th></tr></thead>
        <tbody>
          {[
            // [funcionalidade, secretaria, gestor, professor, admin]
            ['Cadastrar planejamento', 0, 1, 0, 1],
            ['Vincular habilidades BNCC', 0, 1, 0, 1],
            ['Editar atividades e recursos', 0, 0, 1, 0],
            ['Registrar verificação contínua', 0, 0, 1, 0],
            ['Classificar nível de leitura', 0, 0, 1, 0],
            ['Ver dashboards da escola', 1, 1, 0, 1],
            ['Ver indicadores de toda a rede', 1, 0, 0, 1],
            ['Gerenciar escolas e turmas', 1, 0, 0, 1],
            ['Gerenciar usuários e acessos', 1, 0, 0, 1],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{r[0]}</td>
              {[1, 2, 3, 4].map(c => (
                <td key={c} style={{ textAlign: 'center' }}>
                  {r[c] ? <span style={{ color: 'var(--green)', display: 'inline-flex' }}><I name="check2" size={17} sw={2.4} /></span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};
