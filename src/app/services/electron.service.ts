import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';

@Injectable({
  providedIn: 'root' // This lets Angular auto-provide it without any NgModules
})
export class ElectronService {
  public ipcRenderer!: IpcRenderer;

  constructor() {
    // Check safely if running inside Electron's renderer process window context
    if (window && (window as any).require) {
      try {
        this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      } catch (e) {
        console.error('Could not load Electron IPC natively:', e);
      }
    }
  }
}