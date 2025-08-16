const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const USE_MOCK = String(import.meta.env.VITE_API_MOCK || 'false') === 'true';

async function request(path: string, opts: { method?: string; headers?: any; body?: any } = {}) {
  const { method='GET', headers={}, body } = opts;

  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    const payload = body ? JSON.parse(body) : {};
    return { ok: true, data: { id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() } };
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...headers }, body
  });
  const json = await res.json().catch(() => ({}));
  return json; 
}

export const api = {
  post: (path: string, payload: any) => request(path, { method: 'POST', body: JSON.stringify(payload) }),
  get:  (path: string) => request(path, { method: 'GET' })
};
