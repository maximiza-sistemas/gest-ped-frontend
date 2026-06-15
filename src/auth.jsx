/* ============================================================
   Login / autenticação — e-mail e senha reais (JWT na API)
   ============================================================ */
import React, { useState } from 'react';
import { login } from './store.js';
import { I } from './ui.jsx';

// perfis demonstrativos (a tela de login não depende da API)
const PERFIS = [
  { id: 'secretaria', nome: 'Secretaria de Educação', desc: 'Orienta a rede e acompanha todas as escolas.', icon: 'layers', email: 'beatriz@rededeensino.edu.br' },
  { id: 'gestor', nome: 'Gestor Escolar / Coordenador', desc: 'Planeja e acompanha o seu grupo de escolas.', icon: 'grad', email: 'camila@rededeensino.edu.br' },
  { id: 'professor', nome: 'Professor', desc: 'Executa o planejamento e avalia os alunos.', icon: 'check', email: 'helena@rededeensino.edu.br' },
  { id: 'admin', nome: 'Administrador', desc: 'Configura a plataforma e gerencia acessos.', icon: 'settings', email: 'sergio@rededeensino.edu.br' },
];

export const Login = ({ onLogin }) => {
  const [perfil, setPerfil] = useState('secretaria');
  const [email, setEmail] = useState(PERFIS[0].email);
  const [senha, setSenha] = useState('demo123');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const selecionar = p => { setPerfil(p.id); setEmail(p.email); setErro(null); };

  const entrar = async e => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const user = await login(email.trim(), senha);
      onLogin(user);
    } catch (err) {
      setErro(err.message);
      setCarregando(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Lado esquerdo — marca */}
      <div style={{ background: 'linear-gradient(160deg, #101066, #06062c 65%)', color: '#fff', padding: '56px 60px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,161,227,.32), transparent 70%)', top: -120, right: -120 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'inline-flex' }}>
            <img src="/assets/logo-maximiza.png" alt="maXXimiza — Soluções Educacionais" style={{ height: 46, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ fontSize: 12.5, color: '#9fb3d4', marginTop: 12 }}>Plataforma de Gestão Pedagógica · Rede Municipal de Ensino</div>
        </div>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <h1 style={{ color: '#fff', fontSize: 34, lineHeight: 1.15, letterSpacing: '-.03em' }}>
            Planejamento, verificação contínua e evolução — em um só lugar.
          </h1>
          <p style={{ color: '#aab8cf', fontSize: 15, marginTop: 18, lineHeight: 1.6 }}>
            Acompanhe o desenvolvimento de habilidades e os níveis de leitura de cada aluno com decisões baseadas em dados.
          </p>
          <div style={{ display: 'flex', gap: 26, marginTop: 34 }}>
            {[['6', 'escolas na rede'], ['4', 'matrizes de referência'], ['6', 'níveis de leitura']].map((s, i) => (
              <div key={i}>
                <div className="num" style={{ fontSize: 26, fontWeight: 800 }}>{s[0]}</div>
                <div style={{ fontSize: 12, color: '#8fa3c0' }}>{s[1]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 12, color: '#6f82a0' }}>EMEF Anísio Teixeira · Ano letivo 2026</div>
      </div>

      {/* Lado direito — acesso */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 40, background: 'var(--surface)' }}>
        <form style={{ width: '100%', maxWidth: 392 }} className="fade-in" onSubmit={entrar}>
          <h2 style={{ fontSize: 24, letterSpacing: '-.02em' }}>Entrar na plataforma</h2>
          <p style={{ color: 'var(--text-2)', marginTop: 6, marginBottom: 26 }}>Selecione seu perfil de acesso para continuar.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            {PERFIS.map(p => (
              <button type="button" key={p.id} onClick={() => selecionar(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 15px', borderRadius: 12, textAlign: 'left',
                  border: '1.5px solid ' + (perfil === p.id ? 'var(--primary)' : 'var(--border)'),
                  background: perfil === p.id ? 'var(--primary-50)' : 'var(--surface)', transition: 'all .14s' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', display: 'grid', placeItems: 'center',
                  background: perfil === p.id ? 'var(--primary)' : 'var(--surface-3)', color: perfil === p.id ? '#fff' : 'var(--text-2)' }}>
                  <I name={p.icon} size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.desc}</div>
                </div>
                <div style={{ width: 19, height: 19, borderRadius: '50%', border: '2px solid ' + (perfil === p.id ? 'var(--primary)' : 'var(--border-strong)'),
                  display: 'grid', placeItems: 'center' }}>
                  {perfil === p.id && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />}
                </div>
              </button>
            ))}
          </div>

          <label className="field-label">E-mail</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" style={{ marginBottom: 14 }} />
          <label className="field-label">Senha</label>
          <input className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="current-password" style={{ marginBottom: 8 }} />
          <div style={{ textAlign: 'right', marginBottom: 18 }}>
            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Esqueci minha senha</a>
          </div>

          {erro && (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <I name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
              <span>{erro}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={carregando} style={{ width: '100%', padding: '12px', opacity: carregando ? .7 : 1 }}>
            {carregando ? 'Entrando…' : <>Entrar como {PERFIS.find(p => p.id === perfil).nome}<I name="chevR" size={16} /></>}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--text-4)', textAlign: 'center', marginTop: 18 }}>
            Acesso demo · senha <b>demo123</b> para todos os perfis
          </p>
        </form>
      </div>
    </div>
  );
};
