import { Client, LocalAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { WHATSAPP_CONFIG } from '../config/constants';
import logger from '../utils/logger';
import { setWhatsAppStatus } from '../state/whatsappStatus';

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
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-crash-reporter',
        '--crash-dumps-dir=/tmp',
        '--disable-breakpad',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--mute-audio',
        '--no-default-browser-check',
        '--metrics-recording-only',
        // Critical flag to prevent profile locking
        '--disable-features=ProcessSingletonClient',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      timeout: 60000, // 60 seconds timeout
    },
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
  });

  // QR Code event
  client.on('qr', (qr) => {
    logger.info('QR Code received, scan with your phone');
    setWhatsAppStatus('qr_waiting');
    qrCodeData = qr;
    
    // Show QR in terminal
    qrcode.generate(qr, { small: true });
  });

  // Ready event
  client.on('ready', () => {
    logger.info('✅ WhatsApp client is ready!');
    setWhatsAppStatus('ready');
    qrCodeData = null; // Clear QR after successful connection
  });

  // Authenticated event
  client.on('authenticated', () => {
    logger.info('WhatsApp client authenticated');
    setWhatsAppStatus('authenticated');
  });

  // Authentication failure event
  client.on('auth_failure', (msg) => {
    logger.error({ msg }, 'WhatsApp authentication failed');
    setWhatsAppStatus('error', msg);
    qrCodeData = null;
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    logger.warn({ reason }, 'WhatsApp client disconnected');
    setWhatsAppStatus('disconnected');
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
    logger.info({ 
      authDir: WHATSAPP_CONFIG.authDir,
      chromiumPath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'
    }, 'WhatsApp config');
    
    // Clean up any Chromium lock files
    try {
      const fs = require('fs');
      const path = require('path');
      const authPath = path.resolve(WHATSAPP_CONFIG.authDir);
      const lockFile = path.join(authPath, 'SingletonLock');
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        logger.info('Removed Chromium lock file');
      }
    } catch (cleanupError) {
      logger.warn({ cleanupError }, 'Failed to clean lock file (non-critical)');
    }
    
    await client.initialize();
    logger.info('WhatsApp client initialized successfully!');
  } catch (error: any) {
    // Log everything we can about the error
    console.error('=== WHATSAPP INITIALIZATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('=====================================');
    
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        name: error.name,
        code: error.code,
        fullError: error
      }, 
      'Failed to initialize WhatsApp client'
    );
    throw error;
  }
}
