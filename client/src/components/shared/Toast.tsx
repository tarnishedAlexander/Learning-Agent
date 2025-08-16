import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'warn' | 'error';
export type ToastItem = { id: string; message: string; type: ToastKind };

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (message: string, type: ToastKind = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, pushToast, removeToast };
}

export function Toast({ id, message, type='success', onClose }:{
  id: string; message: string; type?: ToastKind; onClose: () => void;
}) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div id={`toast-${id}`} className={`toast ${type}`} role="status" aria-live="polite" onClick={onClose} title="Cerrar">
      {message}
    </div>
  );
}

export function toast(message: string, type: ToastKind = 'success') {
  const id = crypto.randomUUID();
  const el = document.createElement('div');
  el.id = `toast-${id}`;
  el.className = `toast ${type}`;
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.title = 'Cerrar';
  el.onclick = () => el.remove();
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'all .25s ease';
    el.style.transform = 'translateY(10px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2500);
}
