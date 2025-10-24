export type WhatsAppStatus =
  | 'idle'
  | 'initializing'
  | 'qr_waiting'
  | 'authenticated'
  | 'ready'
  | 'disconnected'
  | 'error';

interface WhatsAppState {
  status: WhatsAppStatus;
  lastError: string | null;
  updatedAt: string;
}

let state: WhatsAppState = {
  status: 'idle',
  lastError: null,
  updatedAt: new Date().toISOString(),
};

export function setWhatsAppStatus(status: WhatsAppStatus, error?: unknown): void {
  state = {
    status,
    lastError: error ? String(error) : null,
    updatedAt: new Date().toISOString(),
  };
}

export function getWhatsAppStatus(): WhatsAppState {
  return { ...state };
}
