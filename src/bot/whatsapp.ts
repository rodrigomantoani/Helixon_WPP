import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WAMessage,
} from '@whiskeysockets/baileys';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { WHATSAPP_CONFIG } from '../config/constants';
import logger from '../utils/logger';
import { setWhatsAppStatus } from '../state/whatsappStatus';

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeData: string | null = null;

export function getQRCode(): string | null {
  return qrCodeData;
}

export function getWhatsAppSocket() {
  return sock;
}

export async function createWhatsAppClient() {
  logger.info('Creating WhatsApp client with Baileys...');
  
  const { state, saveCreds } = await useMultiFileAuthState(WHATSAPP_CONFIG.authDir);
  
  const { version } = await fetchLatestBaileysVersion();
  logger.info({ version: version.join('.') }, 'Using WhatsApp version');
  
  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Chrome (Linux)', '', ''],
    defaultQueryTimeoutMs: 60000,
    logger: logger.child({ module: 'baileys' }),
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });
  
  // QR Code event
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      logger.info('QR Code received, scan with your phone');
      setWhatsAppStatus('qr_waiting');
      qrCodeData = qr;
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info({ shouldReconnect }, 'Connection closed');
      
      if (shouldReconnect) {
        setWhatsAppStatus('disconnected');
      } else {
        setWhatsAppStatus('error', 'Logged out');
        qrCodeData = null;
      }
    } else if (connection === 'open') {
      logger.info('✅ WhatsApp connection opened!');
      setWhatsAppStatus('ready');
      qrCodeData = null;
    } else if (connection === 'connecting') {
      setWhatsAppStatus('initializing');
    }
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    if (update.connection === 'open' && !update.qr) {
      logger.info('WhatsApp client authenticated');
      setWhatsAppStatus('authenticated');
    }
  });
  
  return sock;
}

export async function initializeWhatsAppClient(_socket: ReturnType<typeof makeWASocket>): Promise<void> {
  logger.info('Initializing WhatsApp client...');
  logger.info({ authDir: WHATSAPP_CONFIG.authDir }, 'WhatsApp config');
  logger.info('WhatsApp client initialized successfully!');
}

export async function sendMessage(jid: string, text: string) {
  if (!sock) throw new Error('WhatsApp socket not initialized');
  await sock.sendMessage(jid, { text });
}

export async function replyMessage(msg: WAMessage, text: string) {
  if (!sock) throw new Error('WhatsApp socket not initialized');
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text }, { quoted: msg });
}
