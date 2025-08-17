const ns = 'la:';
export const saveJSON = (k: string, v: unknown) => localStorage.setItem(ns+k, JSON.stringify(v));
export const readJSON = <T=any>(k: string): T | null => {
  const raw = localStorage.getItem(ns+k); try { return raw ? JSON.parse(raw) as T : null; } catch { return null; }
};
export const removeItem = (k: string) => localStorage.removeItem(ns+k);
