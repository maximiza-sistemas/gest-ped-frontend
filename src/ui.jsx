/* ============================================================
   UI primitives + ícones + gráficos (SVG puro)
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react';
import { DATA } from './data.js';

/* ---------------- Ícones (stroke, 24x24) ---------------- */
export const Icon = ({ d, fill, size = 18, sw = 1.8, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill ? 'currentColor' : 'none'}
       stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round"
       strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
export const ICONS = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  plan: ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z', 'M9 12h6M9 16h4'],
  skills: ['M12 2 4 6v6c0 5 3.4 7.7 8 10 4.6-2.3 8-5 8-10V6l-8-4z', 'm9 12 2 2 4-4'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  check: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  calendar: ['M8 2v4M16 2v4M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  chart: ['M3 3v18h18', 'M18 17V9M13 17V5M8 17v-3'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  plus: 'M12 5v14M5 12h14',
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.35-4.35'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  chevL: 'M15 18l-6-6 6-6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trend: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  layers: ['m12 2 9 5-9 5-9-5 9-5z', 'm3 12 9 5 9-5', 'm3 17 9 5 9-5'],
  list: ['M8 6h13M8 12h13M8 18h13', 'M3 6h.01M3 12h.01M3 18h.01'],
  check2: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4M12 8h.01'],
  sparkle: 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z',
  history: ['M3 3v5h5', 'M3.05 13A9 9 0 1 0 6 5.3L3 8', 'M12 7v5l4 2'],
  flag: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  grad: ['M22 10 12 5 2 10l10 5 10-5z', 'M6 12v5c0 1 2 3 6 3s6-2 6-3v-5'],
  school: ['M3 21h18', 'M5 21V8l7-4 7 4v13', 'M9 21v-6h6v6'],
  swap: ['M16 3l4 4-4 4', 'M20 7H4', 'M8 21l-4-4 4-4', 'M4 17h16'],
  menu: 'M3 6h18M3 12h18M3 18h18',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  external: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14 21 3'],
};
export const I = ({ name, ...rest }) => <Icon d={ICONS[name]} fill={['dashboard'].includes(name)} {...rest} />;

/* ---------------- Avatar ---------------- */
export const Avatar = ({ nome, iniciais, cor, size = 36 }) => {
  const ini = iniciais || (nome ? nome.split(' ').map(p => p[0]).slice(0, 2).join('') : '?');
  return <div className="avatar" style={{ width: size, height: size, background: cor || '#64748b', fontSize: size * .36 }}>{ini}</div>;
};

/* ---------------- Stat card ---------------- */
export const Stat = ({ label, value, sub, delta, icon, accent }) => (
  <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
      {icon && <div style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center',
        background: accent ? accent + '18' : 'var(--surface-3)', color: accent || 'var(--text-2)' }}><I name={icon} size={17} /></div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
      <span className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{value}</span>
      {delta != null && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12.5, fontWeight: 700,
          color: delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
          <I name={delta >= 0 ? 'arrowUp' : 'arrowDown'} size={13} sw={2.4} />{Math.abs(delta)}{typeof delta === 'number' ? '%' : ''}
        </span>
      )}
    </div>
    {sub && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</span>}
  </div>
);

/* ---------------- Progress bar ---------------- */
export const Bar = ({ value, color, height = 8 }) => (
  <div className="progress" style={{ height }}>
    <span style={{ width: Math.max(0, Math.min(100, value)) + '%', background: color || 'var(--primary)' }} />
  </div>
);

/* ---------------- Donut chart ---------------- */
export const Donut = ({ segments, size = 150, thickness = 22, centerLabel, centerSub }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray .6s' }} />
          );
          offset += len; return el;
        })}
      </svg>
      {centerLabel != null && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div className="num" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{centerLabel}</div>
            {centerSub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{centerSub}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Horizontal bar list ---------------- */
export const HBars = ({ items, max }) => {
  const m = max || Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{it.label}</span>
            <span className="num" style={{ fontWeight: 700, color: 'var(--text)' }}>{it.display != null ? it.display : it.value}</span>
          </div>
          <Bar value={(it.value / m) * 100} color={it.color} />
        </div>
      ))}
    </div>
  );
};

/* ---------------- Vertical bar chart ---------------- */
export const VBars = ({ data, height = 150, color = 'var(--primary)', suffix = '' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height, paddingTop: 14 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <span className="num" style={{ fontSize: 12, fontWeight: 700 }}>{d.value}{suffix}</span>
          <div style={{ width: '100%', maxWidth: 46, height: `${(d.value / max) * 100}%`, minHeight: 4,
            background: d.color || color, borderRadius: '7px 7px 3px 3px', transition: 'height .5s' }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------------- Line chart (evolução temporal) ---------------- */
export const LineChart = ({ series, labels, height = 200, yMax = 5, yLabels }) => {
  const w = 560, h = height, padL = 40, padB = 28, padT = 12, padR = 12;
  const iw = w - padL - padR, ih = h - padB - padT;
  const n = labels.length;
  const x = i => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => padT + ih - (v / yMax) * ih;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {Array.from({ length: yMax + 1 }).map((_, g) => (
        <g key={g}>
          <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" fontFamily="var(--mono)">{yLabels ? (yLabels[g] || '') : g}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{l}</text>
      ))}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />)}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------- Modal ---------------- */
export const Modal = ({ title, subtitle, icon, onClose, children, footer, width = 560 }) => {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal-head">
          {icon && <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}><I name={icon} size={20} /></div>}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose}><I name="x" size={17} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

/* ---------------- Page header ---------------- */
export const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
    <div>
      <h2 style={{ fontSize: 23, letterSpacing: '-.02em' }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 5, maxWidth: 620 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
  </div>
);


/* ---------------- Resultado badge ---------------- */
export const ResultadoBadge = ({ r }) => {
  const D = DATA;
  const cls = { red: 'badge-red', amber: 'badge-amber', green: 'badge-green' }[D.RES_COR[r]];
  return <span className={`badge ${cls}`}>{D.RES_LABEL[r]}</span>;
};

/* ---------------- Matriz badge ---------------- */
export const MatrizBadge = ({ matriz, dot }) => {
  const m = DATA.matriz(matriz);
  if (!m) return null;
  if (dot) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: m.cor, flex: 'none' }} />{m.nome}
    </span>
  );
  return <span className={'badge ' + m.badge}>{m.nome}</span>;
};
