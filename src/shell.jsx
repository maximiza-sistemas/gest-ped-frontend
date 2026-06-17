/* ============================================================
   App shell — sidebar, topbar, navegação por perfil
   ============================================================ */
import React, { useState } from 'react';
import { DATA, login } from './store.js';
import { I, Avatar } from './ui.jsx';

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
  return D.ESCOLA.nome;
};

const NAV = {
  gestor: [
    { grupo: 'Visão geral', itens: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    ]},
    { grupo: 'Planejamento', itens: [
      { id: 'planejamentos', label: 'Planejamentos', icon: 'plan', badge: '3' },
      { id: 'habilidades', label: 'Matrizes & habilidades', icon: 'skills' },
    ]},
    { grupo: 'Acompanhamento', itens: [
      { id: 'professores', label: 'Professores & turmas', icon: 'users' },
      { id: 'periodos', label: 'Períodos', icon: 'calendar' },
    ]},
  ],
  professor: [
    { grupo: 'Meu trabalho', itens: [
      { id: 'painel', label: 'Meu painel', icon: 'dashboard' },
      { id: 'verificacao', label: 'Verificação contínua', icon: 'check', badge: '4' },
      // 'Níveis de leitura' removido do menu provisoriamente (discussão futura) — rota mantida
    ]},
    { grupo: 'Turma', itens: [
      { id: 'alunos', label: 'Meus alunos', icon: 'users' },
      { id: 'planoprof', label: 'Meu planejamento', icon: 'plan' },
    ]},
  ],
  admin: [
    { grupo: 'Rede', itens: [
      { id: 'admrede', label: 'Visão da rede', icon: 'dashboard' },
      { id: 'admescolas', label: 'Escolas', icon: 'school', badge: '6' },
      { id: 'admgrupos', label: 'Grupos de escolas', icon: 'layers' },
    ]},
    { grupo: 'Pedagógico', itens: [
      { id: 'planejamentos', label: 'Planejamentos', icon: 'plan' },
    ]},
    { grupo: 'Cadastros', itens: [
      { id: 'admanos', label: 'Anos escolares', icon: 'grad' },
      { id: 'admturmas', label: 'Turmas', icon: 'grid' },
      { id: 'admalunos', label: 'Alunos', icon: 'users' },
    ]},
    { grupo: 'Sistema', itens: [
      { id: 'admusers', label: 'Usuários & acessos', icon: 'user' },
      { id: 'admconfig', label: 'Configurações', icon: 'settings' },
    ]},
  ],
};

// Secretaria de Educação tem as mesmas atribuições do Admin (superusuário de rede)
NAV.secretaria = NAV.admin;

const TITLES = {
  dashboard: ['Dashboard consolidado', 'Visão geral do andamento de todos os professores e turmas'],
  planejamentos: ['Planejamentos', 'Cadastre, vincule habilidades e direcione aos professores'],
  habilidades: ['Matrizes & habilidades', 'Catálogo por matriz de referência: BNCC, SAEB, SEAMA e Habilidades Leitoras'],
  professores: ['Professores & turmas', 'Acompanhe o trabalho de cada professor'],
  periodos: ['Períodos avaliativos', 'Períodos avaliativos do ano letivo'],
  painel: ['Meu painel', 'Habilidades direcionadas para o período vigente'],
  verificacao: ['Verificação contínua', 'Registre o desempenho individual dos alunos'],
  alunos: ['Meus alunos', 'Turma 1º Ano A · 24 alunos'],
  planoprof: ['Meu planejamento', 'Edite atividades e estratégias do planejamento recebido'],
  admrede: ['Visão da rede', 'Indicadores da rede de ensino'],
  admescolas: ['Escolas', 'Unidades escolares da rede municipal'],
  admgrupos: ['Grupos de escolas', 'Organize as escolas da rede em grupos (polos)'],
  admanos: ['Anos escolares', 'Séries usadas para direcionar os planejamentos'],
  admturmas: ['Turmas', 'Todas as turmas da rede, por escola e ano'],
  admalunos: ['Alunos', 'Diretório de estudantes da rede'],
  admusers: ['Usuários & acessos', 'Gestão de contas e permissões'],
  admconfig: ['Configurações', 'Parâmetros gerais do sistema'],
};

export const Sidebar = ({ user, route, setRoute, onLogout }) => {
  const D = DATA;
  const nav = NAV[user.perfil] || [];
  return (
    <aside className="sidebar">
      <div className="brand" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 9 }}>
        <div className="brand-logo"><img src="/assets/logo-maximiza.png" alt="maXXimiza — Soluções Educacionais" /></div>
        <span style={{ fontSize: 11.5, color: '#8da0bf', paddingLeft: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I name="school" size={13} />{escopoLabel(user, D)}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {nav.map((g, gi) => (
          <div key={gi}>
            <div className="nav-group-label">{g.grupo}</div>
            {g.itens.map(it => (
              <button key={it.id} className={'nav-item' + (route === it.id ? ' active' : '')} onClick={() => setRoute(it.id)}>
                <I name={it.icon} size={18} />
                {it.label}
                {it.badge && <span className="nav-badge num">{it.badge}</span>}
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

export const Topbar = ({ route, user, onSwitch, periodo, setPeriodo }) => {
  const D = DATA;
  const [t, sub] = TITLES[route] || ['', ''];
  const [openP, setOpenP] = useState(false);
  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        <h1>{t}</h1>
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
      <button className="icon-btn" title="Notificações" style={{ position: 'relative' }}>
        <I name="bell" size={18} />
        <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid #fff' }} />
      </button>
      {/* Trocar de perfil (demo) */}
      <div style={{ position: 'relative' }}>
        <SwitchProfile user={user} onSwitch={onSwitch} />
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
      alert('Não foi possível trocar de perfil: ' + err.message);
    } finally {
      setTrocando(null);
    }
  };

  return (
    <>
      <button className="btn btn-subtle btn-sm" onClick={() => setOpen(o => !o)} style={{ paddingLeft: 6 }}>
        <Avatar nome={user.nome} iniciais={user.iniciais} cor={user.cor} size={26} />
        <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nome.split(' ')[0]}</span>
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
