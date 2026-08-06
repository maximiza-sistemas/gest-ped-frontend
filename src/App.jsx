/* ============================================================
   App root — autenticação, roteamento, layout
   ============================================================ */
import React, { useState, useEffect, useReducer } from 'react';
import { DATA, subscribe, restoreSession, logout } from './store.js';
import { Login } from './auth.jsx';
import { Sidebar, Topbar } from './shell.jsx';
import { GestorDashboard, Planejamentos } from './gestor.jsx';
import { PlanDetail, HabilidadesBNCC } from './gestor2.jsx';
import { ProfessoresTurmas, Periodos } from './gestor3.jsx';
import { ProfessorPainel, VerificacaoContinua } from './professor.jsx';
import { MeusAlunos, MeuPlanejamento } from './professor2.jsx';
import { FichaAluno } from './aluno.jsx';
import { AdminRedeDashboard, AdminEscolas } from './admin.jsx';
import { AdminEscolaDetail, AdminTurmas, AdminTurmaDetail, AdminAlunos, AdminAlunoFicha, AdminUsers, AdminConfig } from './admin2.jsx';
import { GruposEscolas } from './grupos.jsx';
import { AnosEscolares } from './anos.jsx';
import { ComponentesCurriculares } from './componentes.jsx';
import { SagApp } from './sag.jsx';

const DEFAULT_ROUTE = { gestor: 'dashboard', professor: 'painel', admin: 'admrede', secretaria: 'admrede' };

const Splash = ({ erro, onRetry }) => (
  <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: 'var(--surface-2)' }}>
    <div style={{ textAlign: 'center' }} className="fade-in">
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'inline-flex', boxShadow: 'var(--shadow)' }}>
        <img src="/assets/logo-maximiza.png" alt="maXXimiza" style={{ height: 40 }} />
      </div>
      {erro ? (
        <>
          <p style={{ marginTop: 18, color: 'var(--red)', fontWeight: 600, fontSize: 14 }}>{erro}</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onRetry}>Tentar novamente</button>
        </>
      ) : (
        <p style={{ marginTop: 18, color: 'var(--text-3)', fontSize: 13.5 }}>Carregando a plataforma…</p>
      )}
    </div>
  </div>
);

const App = () => {
  const [, force] = useReducer(x => x + 1, 0);
  const [boot, setBoot] = useState('carregando'); // carregando | pronto
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('dashboard');
  const [periodo, setPeriodo] = useState('m01');
  const [planId, setPlanId] = useState(null);
  const [planPeriodo, setPlanPeriodo] = useState(null); // filtro de mês ao abrir Planejamentos
  const [alunoId, setAlunoId] = useState(null);
  // drill-down admin
  const [escolaId, setEscolaId] = useState(null);
  const [turmaId, setTurmaId] = useState(null);
  const [admAlunoId, setAdmAlunoId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // re-render quando o store hidrata/atualiza DATA
  useEffect(() => subscribe(force), []);

  const clearDrill = () => { setPlanId(null); setAlunoId(null); setEscolaId(null); setTurmaId(null); setAdmAlunoId(null); };
  const enter = u => {
    setUser(u);
    setRoute(DEFAULT_ROUTE[u.perfil]);
    setPeriodo((DATA.PERIODOS.find(p => p.atual) || DATA.PERIODOS[0] || { id: 'm01' }).id);
    clearDrill();
  };
  const sair = () => { logout(); setUser(null); };
  const go = r => { setRoute(r); clearDrill(); setPlanPeriodo(null); };
  const openEscola = id => { if (id) setEscolaId(id); else go('admescolas'); };
  // abre os Planejamentos já filtrados por um mês (vindo da tela de Períodos)
  const irPlanejamentosPeriodo = pid => { clearDrill(); setPlanPeriodo(pid); setRoute('planejamentos'); };

  // boot: tenta restaurar a sessão (token salvo)
  useEffect(() => {
    let ativo = true;
    restoreSession()
      .then(u => { if (ativo && u) enter(u); })
      .finally(() => { if (ativo) setBoot('pronto'); });
    return () => { ativo = false; };
  }, []);

  // logout forçado (401 da API)
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener('mx:logout', h);
    return () => window.removeEventListener('mx:logout', h);
  }, []);

  if (boot === 'carregando') return <Splash />;
  if (!user) return <Login onLogin={enter} />;

  let view;
  // overlays (prioridade do mais profundo ao mais raso)
  if (alunoId) view = <FichaAluno alunoId={alunoId} back={() => setAlunoId(null)} />;
  else if (planId) view = <PlanDetail planId={planId} back={() => setPlanId(null)} />;
  else if (admAlunoId) view = <AdminAlunoFicha alunoId={admAlunoId} back={() => setAdmAlunoId(null)} />;
  else if (turmaId) view = <AdminTurmaDetail turmaId={turmaId} back={() => setTurmaId(null)} openAluno={setAdmAlunoId} />;
  else if (escolaId) view = <AdminEscolaDetail escolaId={escolaId} back={() => setEscolaId(null)} openTurma={setTurmaId} />;
  else {
    switch (route) {
      // gestor
      case 'dashboard': view = <GestorDashboard go={go} />; break;
      case 'planejamentos': view = <Planejamentos go={go} openPlan={setPlanId} periodoInicial={planPeriodo} />; break;
      case 'habilidades': view = <HabilidadesBNCC />; break;
      case 'professores': view = <ProfessoresTurmas openAluno={setAlunoId} />; break;
      case 'periodos': view = <Periodos irParaPlanejamentos={irPlanejamentosPeriodo} />; break;
      // professor
      case 'painel': view = <ProfessorPainel go={go} />; break;
      case 'verificacao': view = <VerificacaoContinua openAluno={setAlunoId} />; break;
      case 'alunos': view = <MeusAlunos openAluno={setAlunoId} />; break;
      case 'planoprof': view = <MeuPlanejamento />; break;
      // admin (rede)
      case 'admrede': view = <AdminRedeDashboard openEscola={openEscola} />; break;
      case 'admescolas': view = <AdminEscolas openEscola={setEscolaId} />; break;
      case 'admgrupos': view = <GruposEscolas />; break;
      case 'admanos': view = <AnosEscolares />; break;
      case 'admcomponentes': view = <ComponentesCurriculares />; break;
      case 'sag': view = <SagApp />; break;
      case 'admturmas': view = <AdminTurmas openTurma={setTurmaId} />; break;
      case 'admalunos': view = <AdminAlunos openAluno={setAdmAlunoId} />; break;
      case 'admusers': view = <AdminUsers />; break;
      case 'admconfig': view = <AdminConfig />; break;
      default: view = <div className="card card-pad">Em construção</div>;
    }
  }

  return (
    <div className="app">
      <Sidebar user={user} route={route} setRoute={go} onLogout={sair}
        open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={'sidebar-overlay' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)} />
      <div className="main">
        <Topbar route={route} user={user} onSwitch={enter} periodo={periodo} setPeriodo={setPeriodo}
          onMenu={() => setMenuOpen(o => !o)} />
        <div className="content">
          <div className="content-inner">{view}</div>
        </div>
      </div>
    </div>
  );
};

export default App;
