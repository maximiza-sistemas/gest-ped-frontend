/* ============================================================
   Evolução — dashboards evolutivos alimentados por
   GET /dashboard/evolucao (séries mensais de verificações,
   planejamento e leitura, com escopo por perfil).

   Exporta:
     EvolucaoProfessor — página completa (alunos + turmas)
     EvolucaoEscopo    — bloco compartilhado gestor (suas escolas)
                         e admin/secretaria (rede toda), com
                         drill escola → turmas → alunos
   ============================================================ */
import React, { useState, useEffect } from 'react';
import { DATA } from './store.js';
import { api } from './api.js';
import { PageHeader, Stat, I, Bar, VBars, Avatar, InfoDica } from './ui.jsx';

const CORES = ['#2563eb', '#0e8aa8', '#6d4bd1', '#15935f', '#c2410c', '#be123c', '#7c3aed', '#475569'];
const pctCor = v => v == null ? 'var(--border-strong)' : v >= 70 ? 'var(--green)' : v >= 40 ? 'var(--amber)' : 'var(--red)';
const pctTxt = v => v == null ? '—' : v + '%';

/* ---------------- hook de dados ---------------- */
export const useEvolucao = (params = {}) => {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chave = JSON.stringify(params);
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    const qs = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    api.get('/dashboard/evolucao' + (qs ? '?' + qs : ''))
      .then(d => { if (ativo) setDados(d); })
      .catch(e => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [chave]);
  return { dados, erro, carregando };
};

/* ---------------- gráfico de linhas 0–100% ---------------- */
export const TrendChart = ({ series, labels, height = 235 }) => {
  const w = 660, padL = 42, padR = 16, padT = 14, padB = 30;
  const iw = w - padL - padR, ih = height - padT - padB;
  const n = labels.length;
  const x = i => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => padT + ih - (v / 100) * ih;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" style={{ display: 'block' }}>
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" fontFamily="var(--mono)">{g}%</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{l}</text>
      ))}
      {series.map((s, si) => {
        // padrão: quebra a série em trechos contínuos (posições sem dado criam
        // lacunas); com `ligar`, conecta todos os pontos da série (eixo de eventos)
        const runs = [];
        let run = [];
        s.data.forEach((v, i) => {
          if (v == null) { if (!s.ligar && run.length) { runs.push(run); run = []; } }
          else run.push([x(i), y(v)]);
        });
        if (run.length) runs.push(run);
        return (
          <g key={si}>
            {runs.map((r, ri) => r.length > 1 && (
              <polyline key={ri} points={r.map(pt => pt.join(',')).join(' ')} fill="none"
                stroke={s.cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {s.data.map((v, i) => v == null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--surface)" stroke={s.cor} strokeWidth="2.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

const Legenda = ({ series }) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
    {series.map((s, i) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
        <span style={{ width: 16, height: 3.5, borderRadius: 2, background: s.cor }} />{s.nome}
      </span>
    ))}
  </div>
);

/* ---------------- mini gráfico p/ tabelas ---------------- */
export const Spark = ({ dados, cor = 'var(--primary)', width = 86, height = 26 }) => {
  const pts = dados
    .map((v, i) => v == null ? null : [
      dados.length <= 1 ? width / 2 : 4 + (i / (dados.length - 1)) * (width - 8),
      height - 4 - (v / 100) * (height - 8),
    ]);
  const validos = pts.filter(Boolean);
  if (!validos.length) return <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>;
  const runs = [];
  let run = [];
  pts.forEach(p => { if (!p) { if (run.length) runs.push(run); run = []; } else run.push(p); });
  if (run.length) runs.push(run);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {runs.map((r, i) => r.length > 1 && (
        <polyline key={i} points={r.map(p => p.join(',')).join(' ')} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {validos.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill={cor} />)}
    </svg>
  );
};

/* ---------------- variação em pontos percentuais ---------------- */
export const DeltaPP = ({ delta }) => {
  if (delta == null) return <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>;
  const cor = delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--red)' : 'var(--text-3)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700, color: cor }}>
      {delta !== 0 && <I name={delta > 0 ? 'arrowUp' : 'arrowDown'} size={13} sw={2.4} />}
      {delta > 0 ? '+' : ''}{delta} pp
    </span>
  );
};

const CelPct = ({ v }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 110 }}>
    <span className="num" style={{ fontWeight: 700, width: 38, textAlign: 'right' }}>{pctTxt(v)}</span>
    <div style={{ flex: 1 }}><Bar value={v || 0} color={pctCor(v)} height={7} /></div>
  </div>
);

/* ---------------- ranking de habilidades ---------------- */
const ListaHabs = ({ titulo, sub, itens, icone, accent, info }) => {
  const D = DATA;
  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: accent + '18', color: accent, display: 'grid', placeItems: 'center' }}><I name={icone} size={16} /></div>
        <div>
          <h3 style={{ fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>{titulo}{info && <InfoDica titulo={titulo} texto={info} />}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {itens.map(h => {
          const hab = D.habByCod[h.cod] || {};
          return (
            <div key={h.cod}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span className="code-pill" style={{ flex: 'none' }}>{hab.rotulo || h.cod}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hab.desc || ''}</span>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', flex: 'none' }}>
                  <b className="num" style={{ color: 'var(--text)', fontSize: 13 }}>{pctTxt(h.pctAtingiu)}</b> · {h.avaliacoes} aval.
                </span>
              </div>
              <Bar value={h.pctAtingiu || 0} color={pctCor(h.pctAtingiu)} height={7} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RankingHabilidades = ({ habilidades }) => {
  if (!habilidades || !habilidades.dificuldades.length) return null;
  return (
    <div className="grid grid-cols-2" style={{ marginBottom: 18 }}>
      <ListaHabs titulo="Habilidades que pedem atenção" sub="Menor % de atingimento nas verificações" itens={habilidades.dificuldades} icone="flag" accent="#be123c"
        info="Habilidades avaliadas ordenadas do menor para o maior percentual de alunos que atingiram o resultado — candidatas a retomada no planejamento. Mostra o % de atingimento e o total de avaliações de cada uma." />
      <ListaHabs titulo="Melhores resultados" sub="Maior % de atingimento nas verificações" itens={habilidades.destaques} icone="sparkle" accent="#15935f"
        info="Habilidades avaliadas com os maiores percentuais de atingimento nas verificações contínuas do escopo." />
    </div>
  );
};

/* ---------------- tabela de alunos ---------------- */
export const TabelaAlunos = ({ alunos, titulo, sub, multiTurma, turmaNome, onAluno, info }) => {
  const [filtro, setFiltro] = useState('');
  const turmasIds = [...new Set(alunos.map(a => a.turmaId))];
  const visiveis = filtro ? alunos.filter(a => a.turmaId === filtro) : alunos;
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>{titulo}{info && <InfoDica titulo={titulo} texto={info} />}</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{sub}</p>
        </div>
        {multiTurma && turmasIds.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="chip" onClick={() => setFiltro('')}
              style={!filtro ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}>Todas</button>
            {turmasIds.map(id => (
              <button key={id} className="chip" onClick={() => setFiltro(id)}
                style={filtro === id ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}>
                {turmaNome ? turmaNome(id) : id}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 40 }}>Nº</th><th>Aluno</th>
            {multiTurma && <th>Turma</th>}
            <th style={{ textAlign: 'center' }}>Avaliações</th>
            <th>% de atingimento</th>
            <th style={{ textAlign: 'center' }}>Leitura</th>
          </tr></thead>
          <tbody>
            {visiveis.map(a => (
              <tr key={a.id} className={onAluno ? 'clickable' : ''} onClick={onAluno ? () => onAluno(a.id) : undefined}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{a.numero}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar nome={a.nome} iniciais={a.iniciais} size={28} />
                    <span style={{ fontWeight: 600 }}>{a.nome}</span>
                  </div>
                </td>
                {multiTurma && <td style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{turmaNome ? turmaNome(a.turmaId) : a.turmaId}</td>}
                <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{a.avaliacoes}</td>
                <td><CelPct v={a.pctAtingiu} /></td>
                <td style={{ textAlign: 'center' }}><span className="badge badge-blue num">Nv {a.nivelLeitura}</span></td>
              </tr>
            ))}
            {!visiveis.length && (
              <tr><td colSpan={multiTurma ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 22 }}>Nenhum aluno no filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- blocos compartilhados ---------------- */
const CardChart = ({ titulo, sub, series, labels, info }) => (
  <div className="card card-pad" style={{ marginBottom: 18 }}>
    <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>{titulo}{info && <InfoDica titulo={titulo} texto={info} />}</h3>
    <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, marginBottom: 12 }}>{sub}</p>
    <TrendChart series={series} labels={labels} />
    <Legenda series={series} />
  </div>
);

const ParBarras = ({ meses, esquerda, direita }) => (
  <div className="grid grid-cols-2" style={{ marginBottom: 18 }}>
    {[esquerda, direita].map((lado, i) => (
      <div key={i} className="card card-pad">
        <h3 style={{ fontSize: 14.5, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {lado.titulo}{lado.info && <InfoDica titulo={lado.titulo} texto={lado.info} />}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{lado.sub}</p>
        <VBars data={meses.map(m => ({ label: m.nome.slice(0, 3), value: lado.valor(m) }))} height={140} color={lado.cor} />
      </div>
    ))}
  </div>
);

const SemDados = ({ msg }) => (
  <div className="card card-pad" style={{ textAlign: 'center', padding: '42px 24px', color: 'var(--text-2)', marginBottom: 18 }}>
    <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
      <I name="trend" size={26} />
    </div>
    <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Ainda não há dados evolutivos</h3>
    <p style={{ fontSize: 13, maxWidth: 460, margin: '0 auto' }}>{msg}</p>
  </div>
);

/* ============================================================
   EvolucaoEscopo — gestor (suas escolas) e admin/secretaria
   (rede toda). Drill: escolas → turmas → alunos.
   ============================================================ */
export const EvolucaoEscopo = ({ contagens = false, secao = false, children }) => {
  const D = DATA;
  const [escolaSel, setEscolaSel] = useState(null); // { id, nome }
  const [turmaSel, setTurmaSel] = useState(null);   // { id, nome }
  const { dados, erro, carregando } = useEvolucao({ escola: escolaSel?.id, turma: turmaSel?.id });

  if (erro) return <div className="card card-pad" style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 18 }}>{erro}</div>;
  if (!dados) return <div className="card card-pad" style={{ color: 'var(--text-3)', marginBottom: 18 }}>Carregando evolução…</div>;

  const t = dados.totais;
  const labels = dados.meses.map(m => m.nome.slice(0, 3));
  const ultimo = dados.meses[dados.meses.length - 1];
  const rotTurma = tu => `${D.anoNome(tu.ano)} ${tu.nome}`;
  // análise individual de alunos só no escopo do gestor (rede é agregada)
  const podeAlunos = dados.escopo === 'gestor';

  // séries do gráfico: turmas da escola selecionada, ou escolas com atividade
  const geral = { nome: 'Geral', cor: 'var(--text)', data: dados.meses.map(m => m.pctAtingiu) };
  let series = [geral];
  if (escolaSel && dados.turmasDetalhe) {
    const top = [...dados.turmasDetalhe].filter(x => x.avaliacoes > 0).sort((a, b) => b.avaliacoes - a.avaliacoes).slice(0, 5);
    series = [geral, ...top.map((x, i) => ({ nome: rotTurma(x), cor: CORES[i % CORES.length], data: x.serie }))];
  } else {
    const top = dados.entidades.filter(e => e.avaliacoes > 0).slice(0, 5);
    if (top.length > 1) series = [geral, ...top.map((e, i) => ({ nome: e.sub || e.nome, cor: CORES[i % CORES.length], data: e.serie.map(s => s.pctAtingiu) }))];
  }

  return (
    <>
      {contagens && (
        <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
          <Stat label="Escolas" value={t.escolas} sub={t.escolasComAtividade != null ? `${t.escolasComAtividade} com verificações` : undefined} icon="school" accent="#2563eb"
            info={dados.escopo === 'gestor'
              ? 'Escolas sob a sua gestão (vínculo definido em Usuários & acessos). "Com verificações" indica quantas já têm ao menos uma verificação contínua registrada.'
              : 'Total de escolas cadastradas na rede. "Com verificações" indica quantas já têm ao menos uma verificação contínua registrada.'} />
          <Stat label="Turmas" value={t.turmas.toLocaleString('pt-BR')} sub="no seu escopo" icon="layers" accent="#0e8aa8"
            info="Total de turmas das escolas do escopo, incluindo as espelhadas do SAG." />
          <Stat label="Alunos" value={t.alunos.toLocaleString('pt-BR')} sub={`${t.alunosAvaliados.toLocaleString('pt-BR')} já avaliados`} icon="users" accent="#6d4bd1"
            info="Alunos matriculados nas turmas do escopo. 'Já avaliados' são os que receberam ao menos uma verificação contínua." />
          <Stat label="Professores" value={t.professores} sub="vinculados às turmas" icon="grad" accent="#15935f"
            info="Professores cadastrados na plataforma com vínculo a turmas deste escopo (Usuários & acessos)." />
        </div>
      )}

      {children}

      {secao && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 16px' }}>
          <h3 style={{ fontSize: 17, letterSpacing: '-.01em' }}>Evolução</h3>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}

      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Avaliações registradas" value={t.avaliacoes.toLocaleString('pt-BR')} sub={`${t.habilidadesAvaliadas} habilidades avaliadas`} icon="check" accent="#0e8aa8"
          info="Registros de verificação contínua no escopo: cada aluno avaliado em uma habilidade, numa data, conta 1 registro." />
        <Stat label="% de atingimento" value={pctTxt(t.pctAtingiu)} delta={t.deltaPct} sub="vs. mês anterior" icon="target" accent="#15935f"
          info='Percentual de avaliações com resultado "Atingiu" sobre o total registrado. A seta compara o último mês com o anterior, em pontos percentuais.' />
        <Stat label="Cobertura do planejamento" value={t.cobertura != null ? t.cobertura + '%' : '—'} sub={`${t.habilidadesDirecionadas} habilidades direcionadas`} icon="skills" accent="#6d4bd1"
          info="Entre as habilidades direcionadas nos planejamentos ativos do escopo, o percentual que já recebeu ao menos uma verificação contínua." />
        <Stat label="Professores ativos" value={ultimo ? ultimo.professoresAtivos : 0} sub={ultimo ? `em ${ultimo.nome} · de ${t.professores}` : `de ${t.professores}`} icon="users" accent="#c2410c"
          info="Professores que registraram verificação contínua ou preencheram semana de planejamento no último mês com atividade." />
      </div>

      {!dados.meses.length ? (
        <SemDados msg="Quando os professores registrarem verificações contínuas e preencherem as semanas de planejamento, a evolução mês a mês aparecerá aqui." />
      ) : (
        <>
          <CardChart
            titulo={escolaSel ? `Evolução do atingimento — ${escolaSel.nome}` : 'Evolução do atingimento'}
            sub="% de avaliações com resultado “atingiu” por mês"
            series={series} labels={labels}
            info='Cada ponto é o % de avaliações com resultado "Atingiu" no mês. A linha "Geral" agrega todo o escopo; as demais detalham por escola ou turma. Meses sem avaliação aparecem como lacunas.'
          />
          <ParBarras meses={dados.meses}
            esquerda={{ titulo: 'Avaliações por mês', sub: 'Verificações contínuas registradas', valor: m => m.avaliacoes, cor: '#0e8aa8',
              info: 'Quantidade de registros de verificação contínua (aluno × habilidade × data) em cada mês do ano letivo.' }}
            direita={{ titulo: 'Professores ativos por mês', sub: 'Com verificação registrada ou semana preenchida', valor: m => m.professoresAtivos, cor: '#c2410c',
              info: 'Professores distintos que registraram verificação contínua ou preencheram semana de planejamento no mês.' }}
          />
        </>
      )}

      {/* drill: escolas → turmas → alunos */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {(escolaSel || turmaSel) && (
            <button className="btn btn-subtle btn-sm" onClick={() => turmaSel ? setTurmaSel(null) : setEscolaSel(null)}>
              <I name="chevL" size={14} />Voltar
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              {turmaSel ? `Alunos — ${turmaSel.nome}`
                : escolaSel ? `Turmas — ${escolaSel.nome}`
                : dados.escopo === 'gestor' ? 'Minhas escolas' : 'Escolas com verificações'}
              <InfoDica
                titulo={turmaSel ? 'Alunos da turma' : escolaSel ? 'Turmas da escola' : 'Escolas'}
                texto={turmaSel
                  ? 'Para cada aluno: nº de verificações, % de atingimento acumulado, evolução mês a mês, tendência (último mês avaliado − primeiro, em pontos percentuais) e nível de leitura atual.'
                  : escolaSel
                    ? 'Turmas da escola com alunos avaliados sobre o total matriculado, nº de verificações, % de atingimento e evolução mensal.'
                    : 'Verificações registradas, alunos avaliados, % de atingimento e evolução mensal de cada escola. Clique numa escola para detalhar turmas e alunos.'}
              />
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
              {turmaSel ? 'Evolução individual de cada aluno da turma'
                : escolaSel ? (podeAlunos ? 'Clique em uma turma para ver a evolução de cada aluno' : 'Aplicação e atingimento por turma')
                : dados.escopo === 'gestor'
                  ? 'Clique em uma escola para detalhar as turmas'
                  : `${t.escolasComAtividade} de ${t.escolas} escolas já têm verificações — clique para detalhar`}
              {carregando ? ' · atualizando…' : ''}
            </p>
          </div>
        </div>

        {turmaSel ? (
          dados.alunos ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 40 }}>Nº</th><th>Aluno</th>
                  <th style={{ textAlign: 'center' }}>Avaliações</th>
                  <th>% de atingimento</th><th>Evolução</th>
                  <th style={{ textAlign: 'center' }}>Tendência</th>
                  <th style={{ textAlign: 'center' }}>Leitura</th>
                </tr></thead>
                <tbody>
                  {dados.alunos.map(a => (
                    <tr key={a.id}>
                      <td className="num" style={{ color: 'var(--text-3)' }}>{a.numero}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar nome={a.nome} iniciais={a.iniciais} size={28} /><span style={{ fontWeight: 600 }}>{a.nome}</span></div></td>
                      <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{a.avaliacoes}</td>
                      <td><CelPct v={a.pctAtingiu} /></td>
                      <td><Spark dados={a.serie} cor={pctCor(a.pctAtingiu)} /></td>
                      <td style={{ textAlign: 'center' }}><DeltaPP delta={a.tendencia} /></td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-blue num">Nv {a.nivelLeitura}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={{ padding: 22, color: 'var(--text-3)', fontSize: 13 }}>Carregando alunos…</div>
        ) : escolaSel ? (
          dados.turmasDetalhe ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th>Turma</th>
                  <th style={{ textAlign: 'center' }}>Alunos avaliados</th>
                  <th style={{ textAlign: 'center' }}>Avaliações</th>
                  <th>% de atingimento</th><th>Evolução</th><th style={{ width: 30 }}></th>
                </tr></thead>
                <tbody>
                  {dados.turmasDetalhe.map(tu => (
                    <tr key={tu.id} className={podeAlunos ? 'clickable' : ''}
                      onClick={podeAlunos ? () => setTurmaSel({ id: tu.id, nome: rotTurma(tu) }) : undefined}>
                      <td style={{ fontWeight: 600 }}>{rotTurma(tu)}</td>
                      <td className="num" style={{ textAlign: 'center' }}>{tu.alunosAvaliados} / {tu.totAlunos}</td>
                      <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{tu.avaliacoes}</td>
                      <td><CelPct v={tu.pctAtingiu} /></td>
                      <td><Spark dados={tu.serie} cor={pctCor(tu.pctAtingiu)} /></td>
                      <td style={{ textAlign: 'right' }}>{podeAlunos && <I name="chevR" size={15} style={{ color: 'var(--text-4)' }} />}</td>
                    </tr>
                  ))}
                  {!dados.turmasDetalhe.length && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 22 }}>Esta escola não possui turmas cadastradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : <div style={{ padding: 22, color: 'var(--text-3)', fontSize: 13 }}>Carregando turmas…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th>Escola</th>
                <th style={{ textAlign: 'center' }}>Alunos avaliados</th>
                <th style={{ textAlign: 'center' }}>Avaliações</th>
                <th>% de atingimento</th><th>Evolução</th><th style={{ width: 30 }}></th>
              </tr></thead>
              <tbody>
                {dados.entidades.map(e => (
                  <tr key={e.id} className="clickable" onClick={() => setEscolaSel({ id: e.id, nome: e.nome })}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: (e.cor || '#64748b') + '18', color: e.cor || '#64748b', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10.5, flex: 'none' }}>{e.sub}</div>
                        <span style={{ fontWeight: 600 }}>{e.nome}</span>
                      </div>
                    </td>
                    <td className="num" style={{ textAlign: 'center' }}>{e.alunosAvaliados}</td>
                    <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{e.avaliacoes}</td>
                    <td><CelPct v={e.pctAtingiu} /></td>
                    <td><Spark dados={e.serie.map(s => s.pctAtingiu)} cor={pctCor(e.pctAtingiu)} /></td>
                    <td style={{ textAlign: 'right' }}><I name="chevR" size={15} style={{ color: 'var(--text-4)' }} /></td>
                  </tr>
                ))}
                {!dados.entidades.length && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 22 }}>Nenhuma escola com verificações registradas ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RankingHabilidades habilidades={dados.habilidades} />
    </>
  );
};

/* ============================================================
   EvolucaoProfessor — página completa do professor:
   evolução dos seus alunos e das suas turmas.
   ============================================================ */
export const EvolucaoProfessor = ({ openAluno, embutido = false }) => {
  const D = DATA;
  const { dados, erro } = useEvolucao({});

  const SecaoTitulo = () => embutido ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 16px' }}>
      <h3 style={{ fontSize: 17, letterSpacing: '-.01em' }}>Evolução</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  ) : null;

  if (erro) return <div className={embutido ? undefined : 'fade-in'}>{embutido ? <SecaoTitulo /> : <PageHeader title="Evolução" />}<div className="card card-pad" style={{ color: 'var(--red)', fontWeight: 600 }}>{erro}</div></div>;
  if (!dados) return <div className={embutido ? undefined : 'fade-in'}>{embutido ? <SecaoTitulo /> : <PageHeader title="Evolução" />}<div className="card card-pad" style={{ color: 'var(--text-3)' }}>Carregando evolução…</div></div>;

  const t = dados.totais;
  const multi = dados.entidades.length > 1;
  const rotTurma = tu => `${D.anoNome(tu.ano)} ${tu.nome}${tu.sub ? ' · ' + tu.sub : ''}`;
  const turmaNomeDe = id => {
    const tu = dados.entidades.find(e => e.id === id);
    return tu ? `${D.anoNome(tu.ano)} ${tu.nome}` : id;
  };

  // eixo por EVENTO de acompanhamento (ordem de registro), uma linha por habilidade
  const evsAcomp = dados.eventosAcomp || [];
  const habsEventos = [...new Set(evsAcomp.map(e => e.habCod))];
  const labelsEventos = evsAcomp.map(e => e.data.slice(0, 5));
  const seriesEventos = habsEventos.map((h, i) => ({
    nome: (D.habByCod[h] || {}).rotulo || h,
    cor: CORES[i % CORES.length],
    ligar: true, // conecta os eventos da mesma habilidade mesmo com outros eventos entre eles
    data: evsAcomp.map(e => (e.habCod === h && e.avaliados ? Math.round((e.atingiram / e.avaliados) * 100) : null)),
  }));

  return (
    <div className={embutido ? undefined : 'fade-in'}>
      {embutido ? <SecaoTitulo /> : (
        <PageHeader
          title="Evolução"
          subtitle={multi
            ? 'Evolução das verificações contínuas dos seus alunos, turma a turma.'
            : 'Evolução das verificações contínuas dos seus alunos.'}
        />
      )}

      <div className="grid grid-cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Meus alunos" value={t.alunos} sub={`${t.turmas} turma${t.turmas === 1 ? '' : 's'}`} icon="users" accent="#2563eb"
          info="Alunos matriculados nas turmas em que você leciona (vínculo definido pela gestão em Usuários & acessos)." />
        <Stat label="Avaliações registradas" value={t.avaliacoes} sub={`${t.alunosAvaliados} alunos avaliados`} icon="check" accent="#0e8aa8"
          info="Suas verificações contínuas: cada aluno avaliado em uma habilidade, numa data, conta 1 registro. 'Alunos avaliados' são os que têm ao menos um registro." />
        <Stat label="% de atingimento" value={pctTxt(t.pctAtingiu)} delta={t.deltaPct} sub="vs. mês anterior" icon="target" accent="#15935f"
          info='Percentual das suas avaliações com resultado "Atingiu" sobre o total registrado. A seta compara o último mês com o anterior, em pontos percentuais.' />
        <Stat label="Sem avaliação" value={t.alunosSemAvaliacao} sub="alunos ainda não avaliados" icon="flag" accent={t.alunosSemAvaliacao > 0 ? '#be123c' : '#15935f'}
          info="Alunos das suas turmas que ainda não receberam nenhuma verificação contínua — priorize-os na próxima avaliação." />
      </div>

      {!dados.meses.length ? (
        <SemDados msg="Registre verificações contínuas para acompanhar aqui a evolução dos seus alunos mês a mês." />
      ) : (
        <>
          {evsAcomp.length > 0 && (
            <CardChart
              titulo="Evolução do atingimento"
              sub="% de atingimento em cada evento de acompanhamento, por habilidade — na ordem em que foram registrados"
              series={seriesEventos} labels={labelsEventos}
              info="Cada ponto é um evento de acompanhamento (data de registro no eixo): % dos alunos analisados que atingiram a habilidade naquele evento. Uma linha por habilidade."
            />
          )}
          <ParBarras meses={dados.meses}
            esquerda={{ titulo: 'Avaliações por mês', sub: 'Verificações contínuas registradas', valor: m => m.avaliacoes, cor: '#0e8aa8',
              info: 'Quantidade de verificações contínuas (aluno × habilidade × data) que você registrou em cada mês.' }}
            direita={{ titulo: 'Semanas de planejamento', sub: 'Sequências semanais preenchidas por mês', valor: m => m.semanas, cor: '#6d4bd1',
              info: 'Sequências didáticas semanais que você preencheu no Meu planejamento, agrupadas pelo mês do planejamento direcionado.' }}
          />
        </>
      )}

      {multi && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              Minhas turmas
              <InfoDica titulo="Minhas turmas" texto="Comparativo entre as suas turmas: alunos avaliados, nº de verificações e % de atingimento de cada uma." />
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Comparativo de evolução entre as turmas em que você leciona</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th>Turma</th>
                <th style={{ textAlign: 'center' }}>Alunos avaliados</th>
                <th style={{ textAlign: 'center' }}>Avaliações</th>
                <th>% de atingimento</th>
              </tr></thead>
              <tbody>
                {dados.entidades.map((e, i) => (
                  <tr key={e.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: CORES[i % CORES.length] }} />{rotTurma(e)}
                      </span>
                    </td>
                    <td className="num" style={{ textAlign: 'center' }}>{e.alunosAvaliados}</td>
                    <td className="num" style={{ textAlign: 'center', fontWeight: 600 }}>{e.avaliacoes}</td>
                    <td><CelPct v={e.pctAtingiu} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.alunos && (
        <TabelaAlunos
          alunos={dados.alunos}
          titulo="Resultado"
          sub="Desempenho de cada aluno nas verificações — clique para abrir a ficha"
          multiTurma={multi}
          turmaNome={turmaNomeDe}
          onAluno={openAluno}
          info="Para cada aluno: nº de verificações registradas, % de atingimento acumulado e nível de leitura atual."
        />
      )}

      <RankingHabilidades habilidades={dados.habilidades} />
    </div>
  );
};
