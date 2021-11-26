import type { ElectronApi } from '/@preload/../types/electron-api';

declare global {
  interface Window {
    electron: Readonly<ElectronApi>;
  }
}

export function useElectron(): Readonly<ElectronApi> {
  return window.electron;
}
