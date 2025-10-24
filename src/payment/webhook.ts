import { Request, Response } from 'express';
import { getPaymentDetails } from './mercadopago';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import logger from '../utils/logger';
import { mercadopagoWebhookSchema } from '../utils/validators';

// Import WhatsApp client (will be set after initialization)
let whatsappClient: any = null;

export function setWhatsAppClient(client: any) {
  whatsappClient = client;
}

export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  try {
    // Acknowledge receipt immediately
    res.status(200).send('OK');

    const body = req.body;
    logger.info({ body }, 'Received MercadoPago webhook');

    // Validate webhook payload
    const validatedData = mercadopagoWebhookSchema.safeParse(body);
    
    if (!validatedData.success) {
      logger.warn({ error: validatedData.error }, 'Invalid webhook payload');
      return;
    }

    const { type, data } = validatedData.data;

    // Only process payment notifications
    if (type !== 'payment') {
      logger.debug({ type }, 'Ignoring non-payment notification');
      return;
    }

    // Get payment details from MercadoPago API
    const paymentId = data.id;
    const payment = await getPaymentDetails(paymentId);

    if (!payment.external_reference) {
      logger.warn({ paymentId }, 'Payment without external reference');
      return;
    }

    // Find order by external reference
    const order = await orderService.getByExternalReference(payment.external_reference);

    if (!order) {
      logger.warn(
        { externalReference: payment.external_reference },
        'Order not found for external reference'
      );
      return;
    }

    // Save payment event
    await orderService.savePaymentEvent(order.id, 'webhook', payment);

    // Update order status based on payment status
    const paymentStatus = payment.status;
    let orderStatus: 'pending' | 'paid' | 'canceled' | 'failed' | 'expired' = 'pending';

    switch (paymentStatus) {
      case 'approved':
        orderStatus = 'paid';
        break;
      case 'rejected':
        orderStatus = 'failed';
        break;
      case 'cancelled':
        orderStatus = 'canceled';
        break;
      case 'refunded':
        orderStatus = 'canceled';
        break;
      default:
        orderStatus = 'pending';
    }

    // Update order
    await orderService.updateStatus(order.id, orderStatus, paymentId);

    logger.info(
      {
        orderId: order.id,
        paymentId,
        status: orderStatus,
      },
      'Order status updated from webhook'
    );

    // Send WhatsApp confirmation if payment approved
    if (orderStatus === 'paid' && whatsappClient) {
      try {
        const customer = await customerService.getById(order.customer_id);
        
        if (customer) {
          const message = `✅ *Pagamento Confirmado!*\n\n` +
            `Seu pedido *${order.mp_external_reference}* foi aprovado com sucesso!\n\n` +
            `💰 Valor: R$ ${(order.amount_cents / 100).toFixed(2)}\n` +
            `📦 Em breve você receberá informações sobre a entrega.\n\n` +
            `Obrigado pela compra! 🎉`;

          const jid = customer.phone_e164.replace('+', '') + '@s.whatsapp.net';
          await whatsappClient.sendMessage(jid, { text: message });
          logger.info({ customerId: customer.id, orderId: order.id }, 'Payment confirmation sent via WhatsApp');
        }
      } catch (error) {
        logger.error({ error, orderId: order.id }, 'Error sending WhatsApp confirmation');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error handling MercadoPago webhook');
  }
}
