/* ============================================================
   Cliente HTTP — token JWT em localStorage, erros normalizados.
   Em dev o Vite faz proxy de /api para o servidor Fastify.
   ============================================================ */

const TOKEN_KEY = 'mx_token';

// Base da API (inclui o prefixo /api). Em dev fica vazio e o proxy do Vite
// encaminha /api para o backend (porta 3334). Em produção, defina VITE_API_URL.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = t => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method, headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está no ar.');
  }

  if (res.status === 401 && path !== '/auth/login') {
    clearToken();
    window.dispatchEvent(new Event('mx:logout'));
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  let data = null;
  try { data = await res.json(); } catch { /* respostas vazias */ }

  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  get: path => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: path => request(path, { method: 'DELETE' }),
};
