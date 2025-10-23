import { Client, LocalAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { WHATSAPP_CONFIG } from '../config/constants';
import logger from '../utils/logger';

let qrCodeData: string | null = null;

export function getQRCode(): string | null {
  return qrCodeData;
}

export function createWhatsAppClient(): Client {
  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: WHATSAPP_CONFIG.authDir,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=site-per-process',
        '--single-process',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    },
  });

  // QR Code event
  client.on('qr', (qr) => {
    logger.info('QR Code received, scan with your phone');
    qrCodeData = qr;
    
    // Show QR in terminal
    qrcode.generate(qr, { small: true });
  });

  // Ready event
  client.on('ready', () => {
    logger.info('✅ WhatsApp client is ready!');
    qrCodeData = null; // Clear QR after successful connection
  });

  // Authenticated event
  client.on('authenticated', () => {
    logger.info('WhatsApp client authenticated');
  });

  // Authentication failure event
  client.on('auth_failure', (msg) => {
    logger.error({ msg }, 'WhatsApp authentication failed');
    qrCodeData = null;
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    logger.warn({ reason }, 'WhatsApp client disconnected');
    qrCodeData = null;
  });

  // Loading screen event
  client.on('loading_screen', (percent, message) => {
    logger.debug({ percent, message }, 'Loading WhatsApp');
  });

  return client;
}

export async function initializeWhatsAppClient(client: Client): Promise<void> {
  try {
    logger.info('Initializing WhatsApp client...');
    await client.initialize();
  } catch (error: any) {
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        name: error.name 
      }, 
      'Failed to initialize WhatsApp client'
    );
    throw error;
  }
}
