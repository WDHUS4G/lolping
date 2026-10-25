import type { TextApi } from '../../shared/ipc';

declare global {
  interface Window {
    textApi: TextApi;
  }
}

export {};
