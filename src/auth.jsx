/* ============================================================
   Login / autenticação — e-mail e senha reais (JWT na API).
   O perfil não é escolhido na tela: vem do usuário no banco.
   ============================================================ */
import React, { useState } from 'react';
import { login } from './store.js';
import { I } from './ui.jsx';

// atalhos de demonstração (e-mail/senha preenchidos) só no build de desenvolvimento
const DEMO = import.meta.env.DEV;
const DEMO_EMAIL = 'beatriz@rededeensino.edu.br';

// campo com ícone à esquerda — todos com a mesma largura, altura e recuo
const Campo = ({ id, label, icon, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label className="field-label" htmlFor={id} style={{ margin: 0 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <I name={icon} size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
      {children}
    </div>
  </div>
);

const inputStyle = { width: '100%', height: 44, paddingLeft: 40 };

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState(DEMO ? DEMO_EMAIL : '');
  const [senha, setSenha] = useState(DEMO ? 'demo123' : '');
  const [lembrar, setLembrar] = useState(true); // sessão longa: acesso direto na volta
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const entrar = async e => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const user = await login(email.trim(), senha, lembrar);
      onLogin(user);
    } catch (err) {
      setErro(err.message);
      setCarregando(false);
    }
  };

  return (
    <div className="login-split">
      {/* Lado esquerdo — marca */}
      <div className="login-brand" style={{ background: 'linear-gradient(160deg, #101066, #06062c 65%)', color: '#fff', padding: '56px 60px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,161,227,.32), transparent 70%)', top: -120, right: -120 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'inline-flex' }}>
              <img src="/assets/logo-maximiza.png" alt="maXXimiza — Soluções Educacionais" style={{ height: 46, width: 'auto', display: 'block' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 34, letterSpacing: '-.02em' }}>SAG</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#9fb3d4', marginTop: 12 }}>Plataforma de Gestão Pedagógica · Rede Municipal de Ensino</div>
        </div>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <h1 style={{ color: '#fff', fontSize: 34, lineHeight: 1.15, letterSpacing: '-.03em' }}>
            Planejamento, verificação contínua e evolução — em um só lugar.
          </h1>
          <p style={{ color: '#aab8cf', fontSize: 15, marginTop: 18, lineHeight: 1.6 }}>
            Acompanhe o desenvolvimento das habilidades de cada aluno com decisões baseadas em dados.
          </p>
        </div>
        <div />
      </div>

      {/* Lado direito — acesso */}
      <div style={{ display: 'flex', overflowY: 'auto', padding: 40, background: 'var(--surface)' }}>
        <form style={{ width: '100%', maxWidth: 380, margin: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }} className="fade-in" onSubmit={entrar}>
          <div style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 24, letterSpacing: '-.02em' }}>Entrar na plataforma</h2>
            <p style={{ color: 'var(--text-2)', marginTop: 6 }}>Informe seu e-mail e senha para acessar.</p>
          </div>

          <Campo id="login-email" label="E-mail" icon="user">
            <input id="login-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="username" placeholder="seu.email@rededeensino.edu.br" required style={inputStyle} />
          </Campo>
          <Campo id="login-senha" label="Senha" icon="lock">
            <input id="login-senha" className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)}
              autoComplete="current-password" placeholder="Sua senha" required style={inputStyle} />
          </Campo>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: -4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Manter conectado
            </label>
            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Esqueci minha senha</a>
          </div>

          {erro && (
            <div role="alert" style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
              <I name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
              <span>{erro}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={carregando} style={{ width: '100%', height: 44, opacity: carregando ? .7 : 1 }}>
            {carregando ? 'Entrando…' : <>Entrar<I name="chevR" size={16} /></>}
          </button>
          {DEMO && (
            <p style={{ fontSize: 11.5, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.6 }}>
              Ambiente de desenvolvimento · senha <b>demo123</b><br />
              beatriz · camila · helena · sergio @rededeensino.edu.br
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
