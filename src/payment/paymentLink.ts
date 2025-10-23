import { preferenceClient } from './mercadopago';
import { Order, Product } from '../database/models/types';
import { query } from '../database/connection';
import { SERVER_CONFIG } from '../config/constants';
import logger from '../utils/logger';

interface PaymentLinkResult {
  initPoint: string;
  preferenceId: string;
}

export async function generatePaymentLink(order: Order): Promise<PaymentLinkResult> {
  try {
    // Get product details
    const productResult = await query('SELECT * FROM products WHERE id = $1', [order.product_id]);
    
    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const product: Product = productResult.rows[0];

    // Create preference
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: product.sku,
            title: product.name,
            description: product.description,
            quantity: order.qty,
            unit_price: product.price_cents / 100, // Convert cents to currency
            currency_id: order.currency,
          },
        ],
        external_reference: order.mp_external_reference || order.id,
        notification_url: `${SERVER_CONFIG.webhookUrl}/webhooks/mercadopago`,
        back_urls: {
          success: `${SERVER_CONFIG.webhookUrl}/payment/success`,
          failure: `${SERVER_CONFIG.webhookUrl}/payment/failure`,
          pending: `${SERVER_CONFIG.webhookUrl}/payment/pending`,
        },
        auto_return: 'approved',
        binary_mode: true, // Only approved or rejected
        statement_descriptor: 'HELIXON SAUDE',
      },
    });

    logger.info(
      {
        orderId: order.id,
        preferenceId: preference.id,
        amount: order.amount_cents,
      },
      'Payment link generated'
    );

    return {
      initPoint: preference.init_point || '',
      preferenceId: preference.id || '',
    };
  } catch (error) {
    logger.error({ error, orderId: order.id }, 'Error generating payment link');
    throw error;
  }
}
