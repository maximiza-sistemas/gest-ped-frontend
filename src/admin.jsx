/* ============================================================
   Admin — primitivos compartilhados + Visão da rede + Escolas
   ============================================================ */
import React, { useState } from 'react';
import { DATA } from './store.js';
import { PageHeader, Stat, I, ICONS, MatrizBadge, InfoDica, Paginacao } from './ui.jsx';
import { EvolucaoEscopo } from './evolucao.jsx';

// ícones extras (registrados no catálogo compartilhado de ícones)
ICONS.school = ['M3 21h18', 'M5 21V8l7-5 7 5v13', 'M9 21v-6h6v6', 'M9 11h.01M15 11h.01'];
ICONS.pin = ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
ICONS.grid = ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'];

export const ZonaBadge = ({ zona }) => (
  <span className={'badge ' + (zona === 'Rural' ? 'badge-green' : 'badge-cyan')}>
    <I name="pin" size={11} />{zona}
  </span>
);

export const fmt = n => n.toLocaleString('pt-BR');

/* -------- Visão da rede -------- */
export const AdminRedeDashboard = ({ openEscola }) => {
  const D = DATA;
  const r = D.rede();
  const escolas = D.escolasFull();
  const ranking = [...escolas].sort((a, b) => b.totAlunos - a.totAlunos);
  // paginação do ranking (mesma lógica das tabelas do Cadastro)
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(50);
  const rankingPagina = ranking.slice(pagina * tamanho, (pagina + 1) * tamanho);
  const urbanas = escolas.filter(e => e.zona === 'Urbana');
  const rurais = escolas.filter(e => e.zona === 'Rural');
  const sumAl = arr => arr.reduce((s, e) => s + e.totAlunos, 0);

  // análise das habilidades direcionadas pela rede (planejamentos ativos), por matriz
  const ativos = (D.PLANEJAMENTOS || []).filter(p => p.status === 'ativo');
  const habsDirecionadas = [...new Set(ativos.flatMap(p => p.habilidades))];
  const totDirecionamentos = ativos.reduce((s, p) => s + p.habilidades.length, 0);
  const porMatriz = (D.MATRIZES || [])
    .map(m => ({ id: m.id, nome: m.nome, cor: m.cor, n: habsDirecionadas.filter(c => (D.habByCod[c] || {}).matriz === m.id).length }))
    .filter(m => m.n > 0);
  const maxMat = Math.max(1, ...porMatriz.map(m => m.n));

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`${D.REDE.secretaria} · ${D.REDE.municipio}/${D.REDE.uf} · ano letivo ${D.REDE.ano}. Indicadores da rede de ensino.`}
        actions={<>
          <button className="btn btn-ghost"><I name="download" size={16} />Relatório da rede</button>
          <button className="btn btn-primary" onClick={() => openEscola(null)}><I name="school" size={16} />Gerenciar escolas</button>
        </>}
      />

      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Escolas" value={r.escolas} sub={`${urbanas.length} urbanas · ${rurais.length} rurais`} icon="school" accent="#2563eb"
          info="Unidades escolares cadastradas na rede municipal, incluindo as espelhadas automaticamente do SAG, separadas por zona urbana e rural." />
        <Stat label="Alunos matriculados" value={fmt(r.alunos)} sub="anos iniciais" icon="users" accent="#6d4bd1"
          info="Total de alunos matriculados em todas as turmas de todas as escolas da rede." />
        <Stat label="Turmas" value={r.turmas} sub="na rede" icon="grid" accent="#0e8aa8"
          info="Total de turmas cadastradas em todas as escolas da rede." />
        <Stat label="Professores" value={r.professores} sub="ativos" icon="grad" accent="#15935f"
          info="Soma do quadro de professores informado no cadastro de cada escola." />
      </div>

      {/* Análise das habilidades direcionadas */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              Análise das habilidades direcionadas
              <InfoDica titulo="Habilidades direcionadas" texto="Habilidades presentes nos planejamentos ativos direcionados pela Secretaria, agrupadas pela matriz de referência de origem (BNCC, SAEB, SEAMA, CNCA)." />
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
              {ativos.length} planejamento{ativos.length === 1 ? '' : 's'} ativo{ativos.length === 1 ? '' : 's'} · {habsDirecionadas.length} habilidades distintas direcionadas, por matriz de referência
            </p>
          </div>
        </div>
        {porMatriz.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nenhuma habilidade direcionada no momento.</div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 16 }}>
            {porMatriz.map(m => (
              <div key={m.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <MatrizBadge matriz={m.id} />
                  <span className="num" style={{ fontWeight: 800, fontSize: 15 }}>{m.n}<span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)' }}> hab.</span></span>
                </div>
                <div style={{ height: 9, borderRadius: 20, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (m.n / maxMat * 100) + '%', borderRadius: 20, background: m.cor }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
          Total de direcionamentos (habilidade × planejamento): <b className="num" style={{ color: 'var(--text-2)' }}>{totDirecionamentos}</b>
        </div>
      </div>

      {/* Ranking de escolas */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15 }}>Desempenho por escola</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Escolas da rede ordenadas por número de alunos</p>
        </div>
        <table className="tbl">
          <thead><tr><th style={{ width: 34 }}>#</th><th>Escola</th><th>Zona</th><th style={{ textAlign: 'center' }}>Alunos</th><th></th></tr></thead>
          <tbody>
            {rankingPagina.map((e, i) => (
              <tr key={e.id} className="clickable" onClick={() => openEscola(e.id)}>
                <td className="num" style={{ color: 'var(--text-3)', fontWeight: 700 }}>{pagina * tamanho + i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flex: 'none' }}>{e.sigla}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.nome}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{e.bairro}</div>
                    </div>
                  </div>
                </td>
                <td><ZonaBadge zona={e.zona} /></td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{e.totAlunos}</td>
                <td style={{ textAlign: 'right' }}><I name="chevR" size={16} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacao total={ranking.length} pagina={pagina} setPagina={setPagina}
          tamanho={tamanho} setTamanho={setTamanho} rotulo="escolas" />
      </div>

      {/* Resumo por zona */}
      <div className="grid grid-cols-2">
        {[['Urbana', urbanas], ['Rural', rurais]].map(([z, arr]) => (
          <div key={z} className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ZonaBadge zona={z} /><span style={{ fontWeight: 700 }}>{arr.length} escolas</span></div>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{fmt(sumAl(arr))} alunos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Evolução da rede: verificações, atingimento e drill escola → turma → aluno */}
      <EvolucaoEscopo secao />
    </div>
  );
};

/* -------- Escolas (listagem) -------- */
export const AdminEscolas = ({ openEscola }) => {
  const D = DATA;
  const escolas = D.escolasFull();
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(24);
  const visiveis = escolas.slice(pagina * tamanho, (pagina + 1) * tamanho);
  return (
    <div className="fade-in">
      <PageHeader title="Escolas" subtitle="Unidades escolares sincronizadas automaticamente do SAG (somente leitura). Selecione uma escola para ver turmas, alunos e indicadores." />
      <div className="grid grid-cols-3">
        {visiveis.map(e => (
          <div key={e.id} className="card card-pad" onClick={() => openEscola(e.id)} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
            onMouseEnter={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow)'; ev.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'var(--shadow-sm)'; ev.currentTarget.style.transform = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: e.cor + '18', color: e.cor, display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{e.sigla}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25 }}>{e.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}><I name="pin" size={12} />{e.bairro}</div>
              </div>
              <ZonaBadge zona={e.zona} />
            </div>
            <div style={{ display: 'flex', gap: 18, paddingTop: 4 }}>
              {[['Turmas', e.totTurmas], ['Alunos', e.totAlunos], ['Professores', e.professores]].map((s, i) => (
                <div key={i}><div className="num" style={{ fontSize: 18, fontWeight: 800 }}>{s[1]}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s[0]}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' }}>
              <span>Dir. {e.diretor}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>Abrir<I name="chevR" size={14} /></span>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <Paginacao total={escolas.length} pagina={pagina} setPagina={setPagina}
          tamanho={tamanho} setTamanho={setTamanho} opcoes={[12, 24, 48, 96]} rotulo="escolas" style={{ borderTop: 'none' }} />
      </div>
    </div>
  );
};
