export const BOT_CONFIG = {
  name: process.env.BOT_NAME || 'Helixon',
  storeName: process.env.STORE_NAME || 'Helixon Saúde',
  currency: process.env.CURRENCY || 'BRL',
};

export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '700'),
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_OPENAI_PER_MINUTE || '10'),
};

export const MERCADOPAGO_CONFIG = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
  enabled: !!(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_PUBLIC_KEY),
};

export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL!,
};

export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  webhookUrl: process.env.WEBHOOK_URL!,
  qrRouteToken: process.env.QR_ROUTE_TOKEN || 'change_me',
};

export const WHATSAPP_CONFIG = {
  authDir: process.env.WWEBJS_AUTH_DIR || '/tmp/.wwebjs_auth',
};

// Disclaimers e avisos legais
export const DISCLAIMERS = {
  welcome: `Olá! Sou o assistente virtual da ${BOT_CONFIG.storeName}. 👋\n\nPosso ajudá-lo com informações sobre Tirzepatida e processar seu pedido.`,
  medical: `⚠️ *Aviso Importante:* As informações fornecidas são apenas educacionais e não substituem orientação médica profissional. Sempre consulte seu médico antes de iniciar qualquer tratamento.`,
  prescription: `📋 A Tirzepatida é um medicamento que deve ser usado sob prescrição e acompanhamento médico.`,
};
