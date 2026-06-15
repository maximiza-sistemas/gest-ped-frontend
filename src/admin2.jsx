/* ============================================================
   Admin (parte 2) — Detalhe da escola, Turmas, Alunos,
   Ficha de leitura, Usuários, Configurações
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA, fetchTurmaFull, fetchAlunoFull, fetchAvaliacoesAluno, adminCriarUsuario, adminEditarUsuario, adminExcluirUsuario, adminConfig, adminSalvarConfig } from './store.js';
import { PageHeader, Stat, I, Avatar, NivelPill, LineChart, Modal } from './ui.jsx';
import { DistBar, ZonaBadge, NiveisLegend, fmt } from './admin.jsx';

const Carregando = ({ back }) => (
  <div className="fade-in">
    {back && <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>}
    <div className="card card-pad" style={{ color: 'var(--text-3)' }}>Carregando…</div>
  </div>
);

/* -------- Detalhe da escola -------- */
export const AdminEscolaDetail = ({ escolaId, back, openTurma }) => {
  const D = DATA;
  const e = D.escola(escolaId);
  const totalDist = e.dist.reduce((a, b) => a + b, 0);
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
            <span className="chip">Anos: {e.anos.map(a => a + 'º').join(', ')}</span>
          </div>
        </div>
        <button className="btn btn-ghost"><I name="edit" size={15} />Editar escola</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Turmas" value={e.totTurmas} icon="grid" accent={e.cor} />
        <Stat label="Alunos" value={e.totAlunos} icon="users" accent="#6d4bd1" />
        <Stat label="Professores" value={e.professores} icon="grad" accent="#0e8aa8" />
        <Stat label="Alfabetização 1º–3º" value={e.alfInicial + '%'} icon="book" accent={e.alfInicial >= 70 ? '#15935f' : '#c77a07'} />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15 }}>Distribuição de níveis de leitura</h3>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{e.totAlunos} alunos</span>
        </div>
        <div style={{ display: 'flex', height: 28, borderRadius: 9, overflow: 'hidden', marginBottom: 14 }}>
          {D.NIVEIS.map((n, i) => e.dist[i] > 0 && (
            <div key={n.id} title={n.nome} style={{ width: (e.dist[i] / totalDist * 100) + '%', background: n.cor, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{e.dist[i]}</div>
          ))}
        </div>
        <NiveisLegend />
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Turmas · {e.totTurmas}</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Turma</th><th>Ano</th><th>Turno</th><th style={{ textAlign: 'center' }}>Alunos</th><th style={{ width: 200 }}>Leitura</th><th></th></tr></thead>
          <tbody>
            {e.turmas.map(t => {
              const d = [0, 0, 0, 0, 0, 0]; t.alunos.forEach(a => d[a.nivelLeitura - 1]++);
              return (
                <tr key={t.id} className="clickable" onClick={() => openTurma(t.id)}>
                  <td style={{ fontWeight: 600 }}>{t.nome}</td>
                  <td style={{ color: 'var(--text-2)' }}>{t.ano}º ano</td>
                  <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                  <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
                  <td><DistBar dist={d} /></td>
                  <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
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
export const AdminTurmas = ({ openTurma }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [escFilter, setEscFilter] = useState('todas');
  const [anoFilter, setAnoFilter] = useState('todos');
  let turmas = [];
  escolas.forEach(e => { if (escFilter === 'todas' || escFilter === e.id) e.turmas.forEach(t => turmas.push({ ...t, escolaNome: e.nome, escolaCor: e.cor, sigla: e.sigla })); });
  if (anoFilter !== 'todos') turmas = turmas.filter(t => t.ano === +anoFilter);
  return (
    <div className="fade-in">
      <PageHeader title="Turmas" subtitle="Todas as turmas da rede. Filtre por escola ou ano para localizar rapidamente." />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 280 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 160 }} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
          <option value="todos">Todos os anos</option>
          {[1, 2, 3, 4, 5].map(a => <option key={a} value={a}>{a}º ano</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--text-3)' }}>{turmas.length} turmas</span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Turma</th><th>Escola</th><th>Turno</th><th style={{ textAlign: 'center' }}>Alunos</th><th style={{ width: 180 }}>Leitura</th><th></th></tr></thead>
          <tbody>
            {turmas.map(t => {
              const d = [0, 0, 0, 0, 0, 0]; t.alunos.forEach(a => d[a.nivelLeitura - 1]++);
              return (
                <tr key={t.id} className="clickable" onClick={() => openTurma(t.id)}>
                  <td style={{ fontWeight: 600 }}>{t.nome}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: t.escolaCor + '18', color: t.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9.5, flex: 'none' }}>{t.sigla}</div>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{t.escolaNome}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{t.turno}</td>
                  <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{t.alunos.length}</td>
                  <td><DistBar dist={d} /></td>
                  <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Detalhe da turma (roster) -------- */
export const AdminTurmaDetail = ({ turmaId, back, openAluno }) => {
  const [t, setT] = useState(null);
  useEffect(() => {
    let ativo = true;
    fetchTurmaFull(turmaId).then(x => { if (ativo) setT(x); }).catch(() => { if (ativo) setT(false); });
    return () => { ativo = false; };
  }, [turmaId]);
  if (t === null) return <Carregando back={back} />;
  if (t === false) return <Carregando back={back} />;
  const d = t.dist;
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: t.escolaCor + '18', color: t.escolaCor, display: 'grid', placeItems: 'center', flex: 'none' }}><I name="grid" size={24} /></div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 21 }}>{t.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
            <span className="chip"><I name="school" size={13} />{t.escolaNome}</span>
            <span className="chip">{t.turno}</span>
            <span className="chip"><I name="users" size={13} />{t.alunos.length} alunos</span>
          </div>
        </div>
        <div style={{ width: 220 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>Distribuição de leitura</div>
          <DistBar dist={d} height={10} />
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th style={{ width: 40 }}>Nº</th><th>Aluno</th><th>Nível de leitura</th><th>Evolução</th><th></th></tr></thead>
          <tbody>
            {t.alunos.map(a => {
              const hist = a.histNivel || [];
              const delta = hist.length ? a.nivelLeitura - hist[0].nivel : 0;
              return (
                <tr key={a.id} className="clickable" onClick={() => openAluno(a.id)}>
                  <td className="num" style={{ color: 'var(--text-3)' }}>{String(a.numero).padStart(2, '0')}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                  <td><NivelPill nivel={a.nivelLeitura} full /></td>
                  <td>{delta > 0 ? <span className="badge badge-green"><I name="arrowUp" size={11} sw={2.6} />+{delta}</span> : <span className="badge badge-gray">Estável</span>}</td>
                  <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Diretório de alunos -------- */
export const AdminAlunos = ({ openAluno }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [q, setQ] = useState('');
  const [escFilter, setEscFilter] = useState('todas');
  const [nivelFilter, setNivelFilter] = useState('todos');
  let alunos = [];
  escolas.forEach(e => { if (escFilter === 'todas' || escFilter === e.id) e.turmas.forEach(t => t.alunos.forEach(a => alunos.push({ ...a, escolaNome: e.nome, escolaCor: e.cor, sigla: e.sigla, turmaNome: t.nome }))); });
  if (q) alunos = alunos.filter(a => a.nome.toLowerCase().includes(q.toLowerCase()));
  if (nivelFilter !== 'todos') alunos = alunos.filter(a => a.nivelLeitura === +nivelFilter);
  const total = alunos.length;
  const shown = alunos.slice(0, 50);
  return (
    <div className="fade-in">
      <PageHeader title="Alunos" subtitle="Diretório de estudantes de toda a rede. Busque por nome ou filtre por escola e nível de leitura." />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <I name="search" size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Buscar aluno…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ maxWidth: 240 }} value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="todas">Todas as escolas</option>
          {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={nivelFilter} onChange={e => setNivelFilter(e.target.value)}>
          <option value="todos">Todos os níveis</option>
          {D.NIVEIS.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
        </select>
      </div>
      <div className="card">
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
          {fmt(total)} alunos encontrados {total > 50 && <>· exibindo os primeiros 50</>}
        </div>
        <table className="tbl">
          <thead><tr><th>Aluno</th><th>Escola</th><th>Turma</th><th>Nível de leitura</th><th></th></tr></thead>
          <tbody>
            {shown.map(a => (
              <tr key={a.id} className="clickable" onClick={() => openAluno(a.id)}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} cor="#64748b" size={30} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: a.escolaCor + '18', color: a.escolaCor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 9, flex: 'none' }}>{a.sigla}</div>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{a.escolaNome}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{a.turmaNome}</td>
                <td><NivelPill nivel={a.nivelLeitura} full /></td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------- Ficha de leitura do aluno (admin) -------- */
export const AdminAlunoFicha = ({ alunoId, back }) => {
  const D = DATA;
  const [a, setA] = useState(null);
  useEffect(() => {
    let ativo = true;
    fetchAlunoFull(alunoId).then(x => { if (ativo) setA(x); }).catch(() => { if (ativo) setA(false); });
    return () => { ativo = false; };
  }, [alunoId]);
  if (!a) return <Carregando back={back} />;
  const hist = a.histNivel || [];
  const delta = hist.length ? a.nivelLeitura - hist[0].nivel : 0;
  const nivelLabels = ['', 'N.lê', 'Síl', 'Pal', 'Fra', 'T-sf', 'T-cf'];
  return (
    <div className="fade-in">
      <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={back}><I name="chevL" size={15} />Voltar</button>
      <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <Avatar nome={a.nome} iniciais={a.iniciais} cor="#475569" size={64} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22 }}>{a.nome}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip">Nº {String(a.numero).padStart(2, '0')}</span>
            <span className="chip"><I name="school" size={13} />{a.escolaNome}</span>
            <span className="chip"><I name="grid" size={13} />{a.turmaNome} · {a.turno}</span>
          </div>
        </div>
        <button className="btn btn-ghost"><I name="download" size={15} />Relatório</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 18 }}>
        <Stat label="Nível de leitura atual" value={D.nivel(a.nivelLeitura).curto} sub={D.nivel(a.nivelLeitura).nome} icon="book" accent={['', '#d3433a', '#e0822b', '#d9b421', '#2f9bb0', '#2f74d0', '#15935f'][a.nivelLeitura]} />
        <Stat label="Evolução no bimestre" value={delta > 0 ? '+' + delta : '0'} sub={delta > 0 ? 'níveis avançados' : 'estável'} icon="trend" accent="#15935f" />
        <Stat label="Registros de leitura" value={hist.length} sub="no período" icon="history" accent="#0e8aa8" />
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Evolução do nível de leitura</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 18 }}>Histórico de classificação ao longo do bimestre</p>
        <LineChart labels={hist.map(h => h.data.slice(0, 5))} yMax={6} yLabels={nivelLabels}
          series={[{ color: 'var(--primary)', data: hist.map(h => h.nivel) }]} height={210} />
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {hist.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 13px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <span className="num" style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.data}</span>
              <NivelPill nivel={h.nivel} full />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------- Usuários & acessos -------- */
const UserForm = ({ titulo, inicial, onSave, onClose, editando }) => {
  const D = DATA;
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

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
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
          <div>
            <label className="field-label">Professor vinculado</label>
            <select className="input" value={f.profId || ''} onChange={e => set('profId', e.target.value || null)}>
              <option value="">— sem vínculo —</option>
              {D.PROFESSORES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}
        {f.perfil === 'gestor' && (
          <div>
            <label className="field-label">Escolas do gestor <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(grupo de escolas que ele coordena)</span></label>
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

  const criar = f => adminCriarUsuario({
    nome: f.nome, email: f.email, senha: f.senha, perfil: f.perfil,
    cargo: f.cargo, profId: f.profId || null, escolaIds: f.escolaIds || [],
  });
  const salvarEdicao = f => adminEditarUsuario(editar.id, {
    nome: f.nome, email: f.email, perfil: f.perfil, cargo: f.cargo,
    ativo: f.ativo, profId: f.profId || null, escolaIds: f.escolaIds || [],
    ...(f.senha ? { senha: f.senha } : {}),
  });
  const excluir = async u => {
    if (!window.confirm(`Excluir o usuário ${u.nome}?`)) return;
    try { await adminExcluirUsuario(u.id); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Usuários & acessos" subtitle="Contas da rede com quatro perfis: Secretaria de Educação, gestor escolar/coordenador, professor e administrador."
        actions={<button className="btn btn-primary" onClick={() => setNovo(true)}><I name="plus" size={15} />Novo usuário</button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
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
          inicial={{ nome: '', email: '', senha: '', perfil: 'gestor', cargo: '', profId: null, escolaIds: [] }} />
      )}
      {editar && (
        <UserForm titulo={'Editar — ' + editar.nome} editando onClose={() => setEditar(null)} onSave={salvarEdicao}
          inicial={{ nome: editar.nome, email: editar.email, senha: '', perfil: editar.perfil, cargo: editar.cargo, profId: editar.profId || null, escolaIds: editar.escolaIds || [], ativo: editar.ativo !== false }} />
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

    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
      {[
        ['Componentes curriculares', 'Língua Portuguesa, Matemática', 'skills'],
        ['Períodos avaliativos', 'Bimestral · 4 períodos', 'calendar'],
        ['Níveis de leitura', '6 níveis configurados', 'book'],
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
            ['Criar/arquivar orientações da rede', 1, 0, 0, 1],
            ['Cadastrar planejamento', 0, 1, 0, 1],
            ['Vincular habilidades BNCC', 0, 1, 0, 1],
            ['Responder com trilha de aprendizagem', 0, 0, 1, 0],
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
