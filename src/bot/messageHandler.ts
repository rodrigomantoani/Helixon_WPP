// Message interface compatible with both whatsapp-web.js and Baileys adapter
interface WWebMessage {
  from: string;
  body: string;
  type: string;
  getContact(): Promise<{ number: string; pushname?: string }>;
  reply(text: string): Promise<void>;
}
import { parsePhoneNumber } from 'libphonenumber-js';
import { customerService } from '../services/customerService';
import { conversationService } from '../services/conversationService';
import { orderService } from '../services/orderService';
import { generateChatCompletion } from '../ai/openai';
import { conversationContext } from '../ai/context';
import { query } from '../database/connection';
import { DISCLAIMERS } from '../config/constants';
import logger from '../utils/logger';
import NodeCache from 'node-cache';

// Cache for rate limiting (TTL: 60 seconds)
const rateLimitCache = new NodeCache({ stdTTL: 60 });
const MAX_MESSAGES_PER_MINUTE = 5;

export async function handleIncomingMessage(msg: WWebMessage): Promise<void> {
  try {
    // Ignore group messages and non-text messages for now
    if (msg.from.includes('@g.us')) {
      return;
    }

    // Get contact info
    const contact = await msg.getContact();
    const phoneNumber = contact.number;

    // Normalize phone number to E.164 format
    let phoneE164: string;
    try {
      const parsed = parsePhoneNumber(`+${phoneNumber}`);
      if (!parsed) throw new Error('Invalid phone');
      phoneE164 = parsed.number;
    } catch (error) {
      logger.warn({ phoneNumber }, 'Could not parse phone number');
      return;
    }

    // Rate limiting check
    const messageCount = rateLimitCache.get<number>(phoneE164) || 0;
    if (messageCount >= MAX_MESSAGES_PER_MINUTE) {
      await msg.reply(
        '⚠️ Você está enviando mensagens muito rapidamente. Por favor, aguarde um momento.'
      );
      return;
    }
    rateLimitCache.set(phoneE164, messageCount + 1);

    logger.info(
      {
        phone: phoneE164.replace(/\d(?=\d{4})/g, '*'),
        messageType: msg.type,
      },
      'Processing incoming message'
    );

    // Only handle text messages for now
    if (msg.type !== 'chat') {
      await msg.reply('Desculpe, no momento só posso processar mensagens de texto. 📝');
      return;
    }

    const messageBody = msg.body.trim();

    // Find or create customer
    const customer = await customerService.findOrCreateByPhone(
      phoneE164,
      contact.pushname || undefined
    );

    // Find or create active conversation
    const conversation = await conversationService.findOrCreateActive(customer.id);

    // Save incoming message
    await conversationService.saveMessage(conversation.id, 'inbound', messageBody);

    // Check if this is the first message
    const messages = await conversationService.getRecentMessages(conversation.id);
    const isFirstMessage = messages.length === 1;

    // Build context for AI
    const context = conversationContext.buildContext(messages, conversation.summary || undefined);

    // If first message, prepend with welcome
    if (isFirstMessage) {
      await msg.reply(DISCLAIMERS.welcome);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay
    }

    // Generate AI response
    let aiResponse: string;
    try {
      aiResponse = await generateChatCompletion(context);
    } catch (error) {
      logger.error({ error }, 'Error generating AI response');
      await msg.reply(
        '❌ Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.'
      );
      return;
    }

    // Check if AI wants to call a tool
    try {
      const toolCallData = JSON.parse(aiResponse);
      
      if (toolCallData.type === 'tool_call') {
        aiResponse = await handleToolCall(toolCallData);
      }
    } catch {
      // Not a tool call, proceed with regular response
    }

    // Send response
    await msg.reply(aiResponse);

    // Save outgoing message
    await conversationService.saveMessage(conversation.id, 'outbound', aiResponse);

    // Update conversation summary if needed
    if (conversationContext.shouldGenerateSummary(messages.length)) {
      const summary = conversationContext.generateSummary(messages);
      await conversationService.updateSummary(conversation.id, summary);
    }

    logger.info({ phone: phoneE164, responseLength: aiResponse.length }, 'Message handled successfully');
  } catch (error) {
    logger.error({ error }, 'Error handling incoming message');
    
    try {
      await msg.reply(
        '❌ Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.'
      );
    } catch (replyError) {
      logger.error({ replyError }, 'Failed to send error message');
    }
  }
}

async function handleToolCall(toolCall: any): Promise<string> {
  const { function: functionName, arguments: args } = toolCall;

  logger.info({ functionName, args }, 'Handling tool call');

  switch (functionName) {
    case 'list_products': {
      const products = await query('SELECT * FROM products WHERE active = true ORDER BY price_cents');
      
      let response = '📋 *Produtos Disponíveis:*\n\n';
      for (const product of products.rows) {
        const price = (product.price_cents / 100).toFixed(2);
        response += `▫️ *${product.name}*\n`;
        response += `   💰 R$ ${price}\n`;
        response += `   ${product.description}\n\n`;
      }
      response += '\n' + DISCLAIMERS.prescription;
      
      return response;
    }

    case 'get_order_status': {
      const order = await orderService.getById(args.orderId);
      
      if (!order) {
        return '❌ Pedido não encontrado. Verifique o ID e tente novamente.';
      }

      let statusText = '';
      switch (order.status) {
        case 'pending':
          statusText = '⏳ Aguardando pagamento';
          break;
        case 'paid':
          statusText = '✅ Pago';
          break;
        case 'canceled':
          statusText = '❌ Cancelado';
          break;
        case 'failed':
          statusText = '❌ Pagamento recusado';
          break;
        case 'expired':
          statusText = '⏰ Expirado';
          break;
      }

      return `📦 *Status do Pedido ${order.mp_external_reference}*\n\n` +
        `Status: ${statusText}\n` +
        `Valor: R$ ${(order.amount_cents / 100).toFixed(2)}`;
    }

    default:
      return 'Desculpe, não consegui processar essa ação.';
  }
}
