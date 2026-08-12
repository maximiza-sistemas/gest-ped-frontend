/* ============================================================
   SAG — aplicação externa embutida como micro-frontend (iframe).
   O site permite embed (sem X-Frame-Options / frame-ancestors);
   ainda assim há fallback para abrir em nova aba.
   ============================================================ */
import React, { useState } from 'react';
import { PageHeader, I } from './ui.jsx';

const SAG_URL = 'https://sag.maximizaedu.com/embed/dashboard';

export const SagApp = () => {
  const [carregou, setCarregou] = useState(false);
  return (
    <div className="fade-in">
      <PageHeader
        title="Resultado avaliações"
        actions={
          <a className="btn btn-subtle" href={SAG_URL} target="_blank" rel="noopener noreferrer">
            <I name="external" size={15} />Abrir em nova aba
          </a>
        }
      />
      <div className="card" style={{ overflow: 'hidden', position: 'relative', height: 'calc(100vh - 210px)', minHeight: 480 }}>
        {!carregou && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
            Carregando resultados…
          </div>
        )}
        <iframe
          src={SAG_URL}
          title="Resultado avaliações — SAG"
          onLoad={() => setCarregou(true)}
          style={{ width: '100%', height: '100%', border: 0, display: 'block', position: 'relative' }}
          allow="clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
};
