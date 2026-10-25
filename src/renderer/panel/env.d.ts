import type { PanelApi } from '../../shared/ipc';

declare global {
  interface Window {
    panelApi: PanelApi;
  }
}

export {};
