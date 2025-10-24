import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { handleMercadoPagoWebhook } from './payment/webhook';
import { getQRCode } from './bot/whatsapp';
import { SERVER_CONFIG } from './config/constants';
import logger from './utils/logger';
import QRCode from 'qrcode';
import { getWhatsAppStatus } from './state/whatsappStatus';

export function createServer() {
  const app = express();

  // Security middlewares
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting for public endpoints
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/webhooks', limiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'helixon-wpp-bot',
      version: '1.0.0',
      whatsapp: getWhatsAppStatus(),
    });
  });

  // QR Code endpoint (protected by token)
  app.get('/qr', async (req: Request, res: Response) => {
    try {
      const token = req.query.token;

      if (token !== SERVER_CONFIG.qrRouteToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const qrData = getQRCode();

      if (!qrData) {
        return res.status(404).json({
          error: 'QR Code not available',
          message: 'WhatsApp is already connected or QR has not been generated yet',
        });
      }

      // Check if client wants PNG or text
      const format = req.query.format || 'png';

      if (format === 'png') {
        const qrImage = await QRCode.toBuffer(qrData, {
          type: 'png',
          width: 400,
        });
        res.set('Content-Type', 'image/png');
        return res.send(qrImage);
      } else {
        return res.json({ qr: qrData });
      }
    } catch (error) {
      logger.error({ error }, 'Error generating QR code');
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // MercadoPago webhook endpoint
  app.post('/webhooks/mercadopago', handleMercadoPagoWebhook);

  // Payment redirect endpoints (for MercadoPago back_urls)
  app.get('/payment/success', (_req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Aprovado</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #10b981; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
            .emoji { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">✅</div>
            <h1>Pagamento Aprovado!</h1>
            <p>Seu pedido foi confirmado com sucesso.</p>
            <p>Você receberá uma confirmação via WhatsApp em instantes.</p>
            <p><strong>Obrigado pela compra!</strong></p>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/payment/failure', (_req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Recusado</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #ef4444; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
            .emoji { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">❌</div>
            <h1>Pagamento Recusado</h1>
            <p>Infelizmente seu pagamento não foi aprovado.</p>
            <p>Por favor, entre em contato conosco via WhatsApp para mais informações.</p>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/payment/pending', (_req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Pendente</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #fddb92 0%, #d1fdff 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #f59e0b; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
            .emoji { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">⏳</div>
            <h1>Pagamento Pendente</h1>
            <p>Seu pagamento está sendo processado.</p>
            <p>Você receberá uma notificação via WhatsApp assim que for confirmado.</p>
          </div>
        </body>
      </html>
    `);
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response) => {
    logger.error({ err }, 'Unhandled error in Express');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export function startServer(app: express.Application): void {
  const port = SERVER_CONFIG.port;

  app.listen(port, () => {
    logger.info({ port }, `🚀 Server listening on port ${port}`);
  });
}
