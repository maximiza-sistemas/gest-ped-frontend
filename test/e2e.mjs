/* ============================================================
   Teste E2E (Playwright) — smoke dos fluxos principais no browser.

   Pré-requisitos:
     1. App rodando:  npm run dev   (na raiz: API 3334 + Vite 3000)
     2. Playwright:   npm i -D playwright && npx playwright install chromium

   Execução:
     node frontend/test/e2e.mjs        (ou, de dentro de frontend/: node test/e2e.mjs)

   Cobre: login, dashboard por perfil, e as telas mais sensíveis
   (verificação contínua + gráfico leitor, editor semanal, grupos,
   planejamentos). Falha se alguma tela não renderizar ou houver
   erro de página (exceção não tratada / console.error).
   ============================================================ */
import { chromium } from 'playwright';

const base = process.env.E2E_BASE || 'http://localhost:3000';
const browser = await chromium.launch();
const errors = [];

async function run(label, email, steps) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`); });
  const see = async (t, timeout = 20000) => { await page.getByText(t, { exact: false }).first().waitFor({ timeout }); console.log(`  ✓ [${label}] ${t}`); };
  const nav = name => page.getByRole('button', { name }).first().click();
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await see('Entrar na plataforma');
  await page.fill('input[autocomplete="username"]', email);
  await page.fill('input[autocomplete="current-password"]', 'demo123');
  await page.click('button[type="submit"]');
  await steps({ see, nav, page });
  await ctx.close();
}

try {
  await run('professor', 'helena@rededeensino.edu.br', async ({ see, nav, page }) => {
    await see('Meu painel');
    await see('Habilidades de Junho');                 // mês atual direcionado
    await page.locator('select').first().selectOption({ label: 'Maio' });
    await see('Habilidades de Maio');                  // painel reflete o mês escolhido
    await nav(/Verificação contínua/);
    await see('Período (mês)');                        // seletor de período presente
    await see('Acompanhamento das habilidades leitoras'); // Junho tem habilidades leitoras
    await page.locator('select').first().selectOption({ label: 'Maio' });  // mês sem leitoras
    await page.waitForFunction(() => !document.body.innerText.includes('Acompanhamento das habilidades leitoras'), null, { timeout: 8000 });
    console.log('  ✓ [professor] verificação: período filtra as habilidades (Maio sem leitoras)');
    await nav(/Meu planejamento/);     await see('Sequências didáticas semanais');
    // perfil de leitura removido das telas do professor
    await nav(/Meus alunos/);          await see('Meus alunos');
    await page.waitForFunction(() => !/Leitor de|Não leitor/.test(document.body.innerText), null, { timeout: 8000 });
    console.log('  ✓ [professor] Meus alunos sem perfil de leitura');
    await page.getByText('Nº 01', { exact: false }).first().click();
    await see('Desempenho por habilidade');             // ficha do aluno abriu
    await page.waitForFunction(() => !/Nível de leitura atual|Evolução de leitura/.test(document.body.innerText), null, { timeout: 8000 });
    console.log('  ✓ [professor] ficha do aluno sem perfil de leitura');
  });
  await run('secretaria', 'beatriz@rededeensino.edu.br', async ({ see, nav, page }) => {
    await see('Visão da rede');
    await nav(/Grupos de escolas/); await see('Polo Urbano Centro');
    await nav(/^Planejamentos$/);    await see('Novo planejamento');
    await page.locator('button[title="Editar planejamento"]').first().waitFor();   // ação editar na lista
    await page.locator('button[title="Excluir planejamento"]').first().waitFor();  // ação excluir na lista
    console.log('  ✓ [secretaria] planejamento: ações editar/excluir na lista');
    await page.locator('button[title="Editar planejamento"]').first().click();
    await see('Editar planejamento');                                              // modal abre em modo edição
    await page.getByRole('button', { name: 'Cancelar' }).click();                  // fecha o editor

    // exclusão REAL (roundtrip) — captura diálogos p/ garantir que não há erro de API
    const dialogs = [];
    page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); }); // aceita o confirm
    const antes = await page.locator('button[title="Excluir planejamento"]').count();
    await page.locator('button[title="Excluir planejamento"]').first().click();
    await page.waitForFunction(n => document.querySelectorAll('button[title="Excluir planejamento"]').length === n - 1, antes, { timeout: 8000 });
    const erro = dialogs.find(m => /cannot be empty|Erro \d|não foi possível/i.test(m));
    if (erro) throw new Error('exclusão gerou erro de API: ' + erro);
    console.log('  ✓ [secretaria] planejamento: exclusão real concluída sem erro (card removido)');
  });
  await run('gestor', 'camila@rededeensino.edu.br', async ({ see, nav }) => {
    await see('Dashboard consolidado');
    await nav(/Professores & turmas/);   await see('Professores & turmas');
  });
  await run('admin', 'sergio@rededeensino.edu.br', async ({ see, nav }) => {
    await see('Visão da rede');
    await nav(/Usuários & acessos/);  await see('Usuários & acessos');
    await nav(/Grupos de escolas/);   await see('Polo Urbano Centro');
  });
  console.log('E2E OK — professor + secretaria + gestor + admin');
} catch (e) {
  console.error('E2E FALHOU:', (e.message || '').split('\n')[0]);
  process.exitCode = 1;
} finally {
  if (errors.length) { console.error('Erros de página:', errors.slice(0, 6)); process.exitCode = 1; }
  await browser.close();
}
