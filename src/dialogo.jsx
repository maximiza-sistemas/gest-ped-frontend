/* ============================================================
   Diálogos da plataforma — confirmações e avisos em modal próprio
   (substituem window.confirm / alert do navegador)
   ------------------------------------------------------------
   confirmar({ titulo, mensagem, detalhes, perigo, textoConfirmar,
               textoCancelar, icone, aoConfirmar })  → Promise<boolean>
     · aoConfirmar (opcional, async): executa dentro do diálogo com
       estado "Aguarde…"; erro aparece inline e o usuário pode tentar
       de novo ou cancelar. Resolve true só quando concluir.
   avisar({ titulo, mensagem, tipo: 'erro'|'info'|'sucesso' }) → Promise<void>
   <DialogHost /> precisa estar montado uma única vez (App).
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react';
import { I } from './ui.jsx';

let fila = [];
const ouvintes = new Set();
const notificar = () => ouvintes.forEach(fn => fn());

const abrir = opts => new Promise(resolve => {
  fila = [...fila, { ...opts, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, resolve }];
  notificar();
});
const fechar = (id, valor) => {
  const d = fila.find(x => x.id === id);
  fila = fila.filter(x => x.id !== id);
  notificar();
  if (d) d.resolve(valor);
};
const normalizar = opts => (typeof opts === 'string' ? { mensagem: opts } : (opts || {}));

export const confirmar = opts => abrir({ modo: 'confirmar', ...normalizar(opts) });
export const avisar = opts => abrir({ modo: 'aviso', ...normalizar(opts) });

const TEMAS = {
  perigo:  { bg: 'var(--red-bg)',     cor: 'var(--red)',     icone: 'trash' },
  atencao: { bg: 'var(--amber-bg)',   cor: 'var(--amber)',   icone: 'alert' },
  erro:    { bg: 'var(--red-bg)',     cor: 'var(--red)',     icone: 'alert' },
  info:    { bg: 'var(--primary-50)', cor: 'var(--primary)', icone: 'info' },
  sucesso: { bg: 'var(--green-bg)',   cor: 'var(--green)',   icone: 'check2' },
};

const Dialogo = ({ modo, tipo, titulo, mensagem, detalhes, perigo, textoConfirmar, textoCancelar, icone, aoConfirmar, onFechar }) => {
  const ehConfirmacao = modo === 'confirmar';
  const tema = TEMAS[ehConfirmacao ? (perigo ? 'perigo' : (tipo || 'atencao')) : (tipo || 'info')] || TEMAS.info;
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState(null);
  const focoRef = useRef(null);

  // foco inicial: em ação destrutiva o padrão seguro é "Cancelar"
  useEffect(() => { focoRef.current?.focus(); }, []);

  const cancelar = () => { if (!executando) onFechar(false); };
  const ok = async () => {
    if (executando) return;
    if (!ehConfirmacao || !aoConfirmar) { onFechar(true); return; }
    setExecutando(true);
    setErro(null);
    try {
      await aoConfirmar();
      onFechar(true);
    } catch (err) {
      setErro((err && err.message) || 'Não foi possível concluir a ação.');
      setExecutando(false);
    }
  };

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') { e.preventDefault(); cancelar(); }
      else if (e.key === 'Enter' && !ehConfirmacao) { e.preventDefault(); onFechar(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [executando]);

  const paragrafos = String(mensagem || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const lista = (detalhes || []).filter(Boolean);

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) cancelar(); }}>
      <div className="modal dialogo" role={ehConfirmacao ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="dialogo-titulo">
        <div className="dialogo-body">
          <div className="dialogo-icone" style={{ background: tema.bg, color: tema.cor }}><I name={icone || tema.icone} size={22} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="dialogo-titulo" style={{ fontSize: 17, letterSpacing: '-.01em', lineHeight: 1.3 }}>
              {titulo || (ehConfirmacao ? 'Confirmar ação' : 'Aviso')}
            </h3>
            {paragrafos.map((p, i) => (
              <p key={i} style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: i === 0 ? 8 : 6, lineHeight: 1.5 }}>{p}</p>
            ))}
            {lista.length > 0 && (
              <ul className="dialogo-lista">
                {lista.map((d, i) => <li key={i}><I name="chevR" size={13} style={{ color: tema.cor, flex: 'none' }} />{d}</li>)}
              </ul>
            )}
            {perigo && !erro && <p className="dialogo-nota"><I name="alert" size={13} />Esta ação não pode ser desfeita.</p>}
            {erro && <p className="dialogo-erro" role="alert"><I name="info" size={14} style={{ flex: 'none', marginTop: 1 }} />{erro}</p>}
          </div>
        </div>
        <div className="dialogo-foot">
          {ehConfirmacao && (
            <button ref={perigo ? focoRef : null} className="btn btn-ghost" onClick={cancelar} disabled={executando}>
              {textoCancelar || 'Cancelar'}
            </button>
          )}
          <button ref={perigo ? null : focoRef} className={'btn ' + (perigo ? 'btn-danger' : 'btn-primary')} onClick={ok} disabled={executando}>
            {executando ? 'Aguarde…' : (textoConfirmar || (ehConfirmacao ? 'Confirmar' : 'Entendi'))}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Host único: renderiza o primeiro diálogo da fila (os demais esperam) */
export const DialogHost = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(x => x + 1);
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
  }, []);
  const d = fila[0];
  if (!d) return null;
  return <Dialogo key={d.id} {...d} onFechar={v => fechar(d.id, v)} />;
};
