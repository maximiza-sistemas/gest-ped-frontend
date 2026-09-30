/* ============================================================
   App shell — sidebar, topbar, navegação por perfil
   ============================================================ */
import React, { useState } from 'react';
import { DATA, login } from './store.js';
import { I, Avatar } from './ui.jsx';
import { avisar } from './dialogo.jsx';
import { planosDirecionados } from './professor.jsx';

// recursos de demonstração (atalhos de login/troca de perfil) só existem no build de desenvolvimento
const DEMO = import.meta.env.DEV;

// Rótulos amigáveis dos 4 perfis (a chave no banco continua curta)
export const PERFIL_LABEL = {
  admin: 'Administrador',
  secretaria: 'Secretaria de Educação',
  gestor: 'Gestor Escolar / Coordenador',
  professor: 'Professor',
};

// perfis com escopo de rede (superusuários): veem o município, não uma escola
export const isRede = perfil => perfil === 'admin' || perfil === 'secretaria';

// rótulo do escopo exibido no cabeçalho da sidebar, por perfil
const escopoLabel = (user, D) => {
  if (isRede(user.perfil)) return D.REDE.municipio;
  if (user.perfil === 'gestor') {
    const ids = D.ESCOLA_ATUAL || [];
    if (ids.length === 1) return D.escolaNome(ids[0]);
    if (ids.length > 1) return ids.length + ' escolas';
    return 'Sem escolas vinculadas';
  }
  // professor: escola(s) derivada(s) das turmas em que leciona (dados reais, não configuração fixa)
  const prof = (D.PROFESSORES || []).find(p => p.id === D.CURRENT_USER?.profId);
  const minhasTurmas = (prof?.turmaIds || []).map(id => (D.TURMAS || []).find(t => t.id === id)).filter(Boolean);
  const escolasProf = [...new Set(minhasTurmas.map(t => t.escola).filter(Boolean))];
  if (escolasProf.length === 1) return D.escolaNome(escolasProf[0]);
  if (escolasProf.length > 1) return escolasProf.length + ' escolas';
  return D.ESCOLA.nome || 'Sem turmas vinculadas';
};

const NAV = {
  gestor: [
    { grupo: 'Visão geral', itens: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    ]},
    { grupo: 'Planejamento', itens: [
      { id: 'planejamentos', label: 'Planejamentos', icon: 'plan', badge: D => D.PLANEJAMENTOS.filter(pl => pl.status === 'ativo').length },
    ]},
    { grupo: 'Acompanhamento', itens: [
      { id: 'professores', label: 'Professores & turmas', icon: 'users' },
      { id: 'periodos', label: 'Períodos', icon: 'calendar' },
    ]},
    { grupo: 'Sistema', itens: [
      { id: 'sag', label: 'Resultado avaliações', icon: 'external' },
    ]},
  ],
  professor: [
    { grupo: 'Meu trabalho', itens: [
      { id: 'painel', label: 'Dashboard', icon: 'dashboard' },
      // habilidades direcionadas ao professor no período atual
      { id: 'verificacao', label: 'Verificação contínua', icon: 'check', badge: D => {
        const mes = (D.PERIODOS.find(p => p.atual) || {}).id;
        return new Set(planosDirecionados(mes).flatMap(pl => pl.habilidades)).size;
      } },
      // 'Níveis de leitura' removido do menu provisoriamente (discussão futura) — rota mantida
    ]},
    { grupo: 'Turma', itens: [
      { id: 'alunos', label: 'Meus alunos', icon: 'users' },
      { id: 'planoprof', label: 'Meu planejamento', icon: 'plan' },
    ]},
    { grupo: 'Sistema', itens: [
      { id: 'sag', label: 'Resultado avaliações', icon: 'external' },
    ]},
  ],
  admin: [
    { grupo: 'Rede', itens: [
      { id: 'admrede', label: 'Dashboard', icon: 'dashboard' },
      { id: 'admgrupos', label: 'Grupos de escolas', icon: 'layers' },
      // escolas, turmas, alunos e anos escolares vêm do espelho do SAG (somente consulta,
      // pelo dashboard) — não há cadastro; o único catálogo editável é o de componentes
    ]},
    { grupo: 'Pedagógico', itens: [
      { id: 'planejamentos', label: 'Planejamentos', icon: 'plan' },
      { id: 'habilidades', label: 'Matrizes & habilidades', icon: 'skills' },
      { id: 'admcomponentes', label: 'Componentes curriculares', icon: 'book' },
    ]},
    { grupo: 'Sistema', itens: [
      { id: 'admusers', label: 'Usuários & acessos', icon: 'user' },
      { id: 'admconfig', label: 'Configurações', icon: 'settings' },
      { id: 'sag', label: 'Resultado avaliações', icon: 'external' },
    ]},
  ],
};

// Secretaria de Educação tem as mesmas atribuições do Admin (superusuário de rede)
NAV.secretaria = NAV.admin;

const TITLES = {
  dashboard: ['Dashboard', 'Visão geral e evolução das suas escolas, turmas e alunos'],
  planejamentos: ['Planejamentos', 'Cadastre, vincule habilidades e direcione aos professores'],
  habilidades: ['Matrizes & habilidades', 'Catálogo por matriz de referência: BNCC, SAEB, SEAMA e Habilidades Leitoras'],
  professores: ['Professores & turmas', 'Acompanhe o trabalho de cada professor'],
  periodos: ['Períodos avaliativos', 'Períodos avaliativos do ano letivo'],
  painel: ['Dashboard', 'Habilidades direcionadas e evolução das suas turmas e alunos'],
  verificacao: ['Verificação contínua', 'Registre o desempenho individual dos alunos'],
  alunos: D => ['Meus alunos', D.TURMA_ATUAL ? `${D.turmaRotulo(D.TURMA_ATUAL.nome)} · ${(D.alunosT1 || []).length} alunos` : 'Alunos das suas turmas'],
  planoprof: ['Meu planejamento', 'Edite atividades e estratégias do planejamento recebido'],
  admrede: ['Dashboard', 'Indicadores e evolução da rede de ensino'],
  admescolas: ['Escolas', 'Unidades escolares da rede municipal'],
  admgrupos: ['Grupos de escolas', 'Organize as escolas da rede em grupos (polos)'],
  admcomponentes: ['Componentes curriculares', 'Disciplinas usadas nas habilidades, professores e planejamentos'],
  admusers: ['Usuários & acessos', 'Gestão de contas e permissões'],
  admconfig: ['Configurações', 'Parâmetros gerais do sistema'],
  sag: ['Resultado avaliações', 'Resultados das avaliações — aplicação integrada da maXXimiza'],
};

// badge do menu calculado dos dados hidratados (nunca um número fixo); some quando é zero
const NavBadge = ({ badge }) => {
  const n = typeof badge === 'function' ? badge(DATA) : badge;
  return n ? <span className="nav-badge num">{n}</span> : null;
};

// item de menu expansível (ex.: Cadastro) — abre sozinho quando a rota ativa é de um submenu
const NavGrupo = ({ item, route, setRoute, onClose }) => {
  const filhoAtivo = item.children.some(c => c.id === route);
  const [override, setOverride] = useState(null); // null = segue a rota ativa
  const aberto = override ?? filhoAtivo;
  return (
    <>
      <button className={'nav-item' + (filhoAtivo && !aberto ? ' active' : '')} onClick={() => setOverride(!aberto)}>
        <I name={item.icon} size={18} />
        {item.label}
        <span className={'nav-chev' + (aberto ? ' open' : '')}><I name="chevD" size={15} /></span>
      </button>
      {aberto && item.children.map(c => (
        <button key={c.id} className={'nav-item sub' + (route === c.id ? ' active' : '')} onClick={() => { setRoute(c.id); onClose?.(); }}>
          <I name={c.icon} size={16} />
          {c.label}
          <NavBadge badge={c.badge} />
        </button>
      ))}
    </>
  );
};

export const Sidebar = ({ user, route, setRoute, onLogout, open, onClose }) => {
  const D = DATA;
  const nav = NAV[user.perfil] || [];
  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <div className="brand" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div className="brand-logo"><img src="/assets/logo-maximiza.png" alt="maXXimiza — Soluções Educacionais" /></div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 23, letterSpacing: '-.02em' }}>SAG</span>
        </div>
        <span style={{ fontSize: 11.5, color: '#8da0bf', paddingLeft: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I name="school" size={13} />{escopoLabel(user, D)}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {nav.map((g, gi) => (
          <div key={gi}>
            <div className="nav-group-label">{g.grupo}</div>
            {g.itens.map(it => it.children ? (
              <NavGrupo key={it.id} item={it} route={route} setRoute={setRoute} onClose={onClose} />
            ) : (
              <button key={it.id} className={'nav-item' + (route === it.id ? ' active' : '')} onClick={() => { setRoute(it.id); onClose?.(); }}>
                <I name={it.icon} size={18} />
                {it.label}
                <NavBadge badge={it.badge} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 8px' }}>
          <Avatar nome={user.nome} iniciais={user.iniciais} cor={user.cor} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nome}</div>
            <div style={{ fontSize: 11, color: '#7c8ba1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.cargo}</div>
          </div>
          <button className="nav-item" style={{ width: 'auto', padding: 8 }} title="Sair" onClick={onLogout}>
            <I name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const Topbar = ({ route, user, onSwitch, periodo, setPeriodo, onMenu }) => {
  const D = DATA;
  const tit = TITLES[route];
  const [t] = (typeof tit === 'function' ? tit(D) : tit) || ['', ''];
  const [openP, setOpenP] = useState(false);
  return (
    <header className="topbar">
      <button className="menu-toggle" title="Menu" onClick={onMenu}>
        <I name="menu" size={20} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</h1>
      </div>
      {/* Seletor de período */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpenP(o => !o)}>
          <I name="calendar" size={15} />{D.periodoNome(periodo)}
          <I name="chevD" size={14} />
        </button>
        {openP && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpenP(false)} />
            <div className="card" style={{ position: 'absolute', right: 0, top: 40, width: 230, zIndex: 11, padding: 6, boxShadow: 'var(--shadow-lg)' }}>
              {D.PERIODOS.map(p => (
                <button key={p.id} className="nav-item" style={{ color: 'var(--text)', padding: '9px 11px' }}
                  onClick={() => { setPeriodo(p.id); setOpenP(false); }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: periodo === p.id ? 'var(--primary)' : 'var(--border-strong)' }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.nome}</span>
                  {p.atual && <span className="badge badge-blue">Atual</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Trocar de perfil: só em desenvolvimento; em produção mostra apenas o usuário logado */}
      <div style={{ position: 'relative' }}>
        {DEMO ? <SwitchProfile user={user} onSwitch={onSwitch} /> : (
          <div className="btn btn-subtle btn-sm" style={{ paddingLeft: 6, cursor: 'default' }}>
            <Avatar nome={user.nome} iniciais={user.iniciais} cor={user.cor} size={26} />
            <span className="profile-name" style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nome.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </header>
  );
};

const SwitchProfile = ({ user, onSwitch }) => {
  const D = DATA;
  const [open, setOpen] = useState(false);
  const [trocando, setTrocando] = useState(null);

  // refaz o login real com o usuário alvo (senha demo compartilhada)
  const trocar = async u => {
    if (u.id === user.id) { setOpen(false); return; }
    setTrocando(u.id);
    try {
      const logged = await login(u.email, 'demo123');
      onSwitch(logged);
      setOpen(false);
    } catch (err) {
      avisar({ titulo: 'Não foi possível trocar de perfil', mensagem: err.message, tipo: 'erro' });
    } finally {
      setTrocando(null);
    }
  };

  return (
    <>
      <button className="btn btn-subtle btn-sm" onClick={() => setOpen(o => !o)} style={{ paddingLeft: 6 }}>
        <Avatar nome={user.nome} iniciais={user.iniciais} cor={user.cor} size={26} />
        <span className="profile-name" style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nome.split(' ')[0]}</span>
        <I name="chevD" size={14} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div className="card" style={{ position: 'absolute', right: 0, top: 42, width: 260, zIndex: 11, padding: 8, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '6px 10px' }}>Trocar de perfil (demo)</div>
            {D.USUARIOS.map(u => (
              <button key={u.id} className="nav-item" style={{ color: 'var(--text)', padding: 9, opacity: trocando && trocando !== u.id ? .5 : 1 }}
                disabled={!!trocando} onClick={() => trocar(u)}>
                <Avatar nome={u.nome} iniciais={u.iniciais} cor={u.cor} size={32} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{trocando === u.id ? 'entrando…' : (PERFIL_LABEL[u.perfil] || u.perfil)}</div>
                </div>
                {u.id === user.id && <I name="check2" size={16} style={{ color: 'var(--primary)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};
