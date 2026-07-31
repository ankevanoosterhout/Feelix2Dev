import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // Auto-injects globally across all classic NgModules cleanly
})
export class LocalStorageService {

  // Recreates the exact same .store() method from ngx-webstorage
  public store(key: string, value: any): void {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serializedValue);
  }

  // Recreates the exact same .retrieve() method from ngx-webstorage
  public retrieve(key: string): any {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item); // Safely re-hydrate objects and arrays
    } catch {
      return item; // Return plain strings if JSON parsing fails
    }
  }

  // Recreates the exact same .clear() method from ngx-webstorage
  public clear(key?: string): void {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  }
}
