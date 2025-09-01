import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<Map<string, any>>();

  // Inicia el contexto para una petición
  run(callback: () => void) {
    this.als.run(new Map(), callback);
  }

  // Guarda un valor en el contexto actual
  set<T = any>(key: string, value: T): void {
    const store = this.als.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  // Obtiene un valor del contexto actual
  get<T = any>(key: string): T | undefined {
    const store = this.als.getStore();
    return store ? store.get(key) : undefined;
  }
}
