/* ============================================================
   Admin (parte 2) — Detalhe da escola, Turmas, Alunos,
   Ficha de leitura, Usuários, Configurações
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, adminCriarUsuario, adminEditarUsuario, adminExcluirUsuario, adminConfig, adminSalvarConfig,
  fetchTurmas, fetchAlunos } from './store.js';
import { PageHeader, Stat, I, Avatar, Modal, Paginacao, Bar } from './ui.jsx';
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

/* -------- Turmas (rede inteira) -------- */
export const AdminTurmas = () => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [escFilter, setEscFilter] = useState('todas');
  const [anoFilter, setAnoFilter] = useState('todos');
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(50);
  useEffect(() => { setPagina(0); }, [escFilter, anoFilter]);
  let turmas = [];
  escolas.forEach(e => { if (escFilter === 'todas' || escFilter === e.id) e.turmas.forEach(t => turmas.push({ ...t, escolaId: e.id, escolaNome: e.nome, escolaCor: e.cor, sigla: e.sigla })); });
  if (anoFilter !== 'todos') turmas = turmas.filter(t => t.ano === +anoFilter);
  const visiveis = turmas.slice(pagina * tamanho, (pagina + 1) * tamanho);

  return (
    <div className="fade-in">
      <PageHeader title="Turmas" subtitle="Turmas sincronizadas automaticamente do SAG (somente leitura). Filtre por escola ou ano para localizar rapidamente." />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 280 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
          <option value="todos">Todos os anos</option>
          {D.ANOS.map(a => <option key={a.ordem} value={a.ordem}>{a.nome}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--text-3)' }}>{turmas.length} turmas</span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Turma</th><th>Escola</th><th>Ano</th><th>Turno</th><th style={{ textAlign: 'center' }}>Alunos</th></tr></thead>
          <tbody>
            {visiveis.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.nome}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: t.escolaCor + '18', color: t.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9.5, flex: 'none' }}>{t.sigla}</div>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{t.escolaNome}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{D.anoNome(t.ano)}</td>
                <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacao total={turmas.length} pagina={pagina} setPagina={setPagina}
          tamanho={tamanho} setTamanho={setTamanho} rotulo="turmas" />
      </div>
    </div>
  );
};

/* O detalhe da turma (roster) não existe no perfil de rede — o fluxo
   para nas turmas; alunos ficam apenas no diretório "Alunos". */

/* -------- Diretório de alunos (paginação no servidor) -------- */
export const AdminAlunos = () => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [q, setQ] = useState('');
  const [escFilter, setEscFilter] = useState('todas');
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(50);
  const [dados, setDados] = useState(null); // { total, alunos } · null = carregando

  const carregar = () => fetchAlunos({
    busca: q.trim() || undefined,
    escola: escFilter !== 'todas' ? escFilter : undefined,
    limit: tamanho,
    offset: pagina * tamanho,
  }).then(setDados).catch(() => setDados({ total: 0, alunos: [] }));

  // busca com debounce; troca de filtro/página/tamanho recarrega direto
  // (mantém os dados anteriores na tela durante o refetch — sem piscar)
  useEffect(() => {
    const t = setTimeout(carregar, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, escFilter, pagina, tamanho]);
  useEffect(() => { setPagina(0); }, [q, escFilter]);

  const total = dados ? dados.total : 0;
  const alunos = dados ? dados.alunos : [];

  return (
    <div className="fade-in">
      <PageHeader title="Alunos" subtitle="Diretório de estudantes sincronizado automaticamente do SAG (somente leitura). Busque por nome ou filtre por escola." />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <I name="search" size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Buscar aluno…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ maxWidth: 240 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>
      <div className="card">
        {dados === null && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>Carregando…</div>
        )}
        <table className="tbl">
          <thead><tr><th>Aluno</th><th>Escola</th><th>Turma</th></tr></thead>
          <tbody>
            {dados !== null && alunos.length === 0 && (
              <tr><td colSpan={3} style={{ color: 'var(--text-3)', padding: '18px 16px' }}>Nenhum aluno encontrado.</td></tr>
            )}
            {alunos.map(a => (
              <tr key={a.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: a.escolaCor + '18', color: a.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9, flex: 'none' }}>{a.escolaSigla}</div>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{a.escolaNome}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{a.turmaNome}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacao total={total} pagina={pagina} setPagina={setPagina}
          tamanho={tamanho} setTamanho={setTamanho} rotulo="alunos" />
      </div>
    </div>
  );
};

/* A análise individual de alunos não está disponível no perfil de rede
   (admin/secretaria) — o acompanhamento é agregado por escola e turma. */

/* -------- Usuários & acessos -------- */
const UserForm = ({ titulo, inicial, onSave, onClose, editando }) => {
  const D = DATA;
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  // vínculo do professor: turmas de toda a rede + escola em foco no seletor
  const [turmasRede, setTurmasRede] = useState(DATA.TURMAS);
  const [escolaProf, setEscolaProf] = useState((D.ESCOLAS[0] || {}).id || '');
  useEffect(() => {
    let ativo = true;
    fetchTurmas().then(ts => {
      if (!ativo) return;
      setTurmasRede(ts);
      const t0 = ts.find(t => (inicial.turmaIds || []).includes(t.id));
      if (t0) setEscolaProf(t0.escola);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);
  const toggleTurma = tid => set('turmaIds',
    (f.turmaIds || []).includes(tid) ? f.turmaIds.filter(x => x !== tid) : [...(f.turmaIds || []), tid]);

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
              <label className="field-label">Escola</label>
              <select className="input" value={escolaProf} onChange={e => setEscolaProf(e.target.value)}>
                {(D.ESCOLAS || []).map(e2 => <option key={e2.id} value={e2.id}>{e2.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Turmas do professor <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>({(f.turmaIds || []).length} selecionada(s))</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                {turmasRede.filter(t => t.escola === escolaProf).map(t => {
                  const on = (f.turmaIds || []).includes(t.id);
                  return (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                      background: on ? 'var(--primary-50)' : 'transparent' }}>
                      <input type="checkbox" checked={on} onChange={() => toggleTurma(t.id)} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.nome}</span>
                      {t.turno && <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{t.turno}</span>}
                    </label>
                  );
                })}
                {turmasRede.filter(t => t.escola === escolaProf).length === 0 && (
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nenhuma turma nesta escola.</span>
                )}
              </div>
            </div>
          </>
        )}
        {f.perfil === 'gestor' && (
          <div>
            <label className="field-label">Escolas do gestor <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(acesso automático a todas as turmas dessas escolas)</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
              {(D.ESCOLAS || []).map(e => {
                const on = (f.escolaIds || []).includes(e.id);
                return (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                    background: on ? 'var(--primary-50)' : 'transparent' }}>
                    <input type="checkbox" checked={on} onChange={() => set('escolaIds',
                      on ? f.escolaIds.filter(x => x !== e.id) : [...(f.escolaIds || []), e.id])} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{e.nome}</span>
                    {e.zona && <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{e.zona}</span>}
                  </label>
                );
              })}
              {(!D.ESCOLAS || D.ESCOLAS.length === 0) && <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nenhuma escola cadastrada.</span>}
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
  const excluir = async u => {
    if (!window.confirm(`Excluir o usuário ${u.nome}?`)) return;
    try { await adminExcluirUsuario(u.id); } catch (err) { alert(err.message); }
  };

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
export const AdminConfig = () => {
  const D = DATA;
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
      {[
        ['Componentes curriculares', 'Língua Portuguesa, Matemática', 'skills'],
        ['Períodos avaliativos', 'Bimestral · 4 períodos', 'calendar'],
        ['Recuperação de senha', 'Via e-mail cadastrado', 'lock'],
      ].map((c, i) => (
        <div key={i} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name={c[2]} size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c[0]}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{c[1]}</div>
          </div>
          <button className="btn btn-subtle btn-sm">Editar</button>
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
