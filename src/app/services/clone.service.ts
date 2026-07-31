import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CloneService {

  public deepClone<T>(source: T): T {
    return (
      Array.isArray(source)
        ? (source.map(item => this.deepClone(item)) as unknown as T)
        : source instanceof Date
        ? (new Date(source.getTime()) as unknown as T)
        : source && typeof source === 'object'
        ? (Object.getOwnPropertyNames(source).reduce((o, prop) => {
            const descriptor = Object.getOwnPropertyDescriptor(source, prop);
            if (descriptor) {
              Object.defineProperty(o, prop, descriptor);
            }
            o[prop] = this.deepClone((source as any)[prop]);
            return o;
          }, Object.create(Object.getPrototypeOf(source))) as T)
        : source
    );
  }
}