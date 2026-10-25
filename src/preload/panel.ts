import { contextBridge, ipcRenderer } from 'electron';
import type { PanelAction, PanelApi, PanelState } from '../shared/ipc';

const api: PanelApi = {
  // Inlined: a sandboxed preload can require electron, but not a generated sibling chunk.
  on: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, state: PanelState): void => cb(state);
    ipcRenderer.on('panel:state', listener);
    return () => ipcRenderer.removeListener('panel:state', listener);
  },
  act: (action: PanelAction) => ipcRenderer.send('panel:action', action),
};

contextBridge.exposeInMainWorld('panelApi', api);
