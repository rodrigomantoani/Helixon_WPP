import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Order, OrderStatus, Product } from '../database/models/types';
import logger from '../utils/logger';

export class OrderService {
  async createOrder(
    customerId: string,
    productId: string,
    quantity: number
  ): Promise<Order> {
    try {
      // Get product details
      const productResult = await query('SELECT * FROM products WHERE id = $1 AND active = true', [
        productId,
      ]);

      if (productResult.rows.length === 0) {
        throw new Error('Product not found or inactive');
      }

      const product: Product = productResult.rows[0];
      const amountCents = product.price_cents * quantity;
      const orderId = uuidv4();
      const externalReference = `ORDER-${orderId.substring(0, 8).toUpperCase()}`;

      const result = await query(
        `INSERT INTO orders (
          id, customer_id, product_id, qty, amount_cents, currency, 
          status, mp_external_reference, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [orderId, customerId, productId, quantity, amountCents, product.currency, 'pending', externalReference]
      );

      const order = result.rows[0];
      logger.info({ orderId: order.id, customerId, amount: amountCents }, 'Order created');
      return order;
    } catch (error) {
      logger.error({ error, customerId, productId }, 'Error creating order');
      throw error;
    }
  }

  async updatePaymentInfo(
    orderId: string,
    preferenceId: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE orders 
         SET mp_preference_id = $1, updated_at = NOW() 
         WHERE id = $2`,
        [preferenceId, orderId]
      );
      logger.debug({ orderId, preferenceId }, 'Order payment info updated');
    } catch (error) {
      logger.error({ error, orderId }, 'Error updating payment info');
      throw error;
    }
  }

  async updateStatus(orderId: string, status: OrderStatus, paymentId?: string): Promise<Order> {
    try {
      const result = await query(
        `UPDATE orders 
         SET status = $1, mp_payment_id = $2, updated_at = NOW() 
         WHERE id = $3
         RETURNING *`,
        [status, paymentId, orderId]
      );

      const order = result.rows[0];
      logger.info({ orderId, status, paymentId }, 'Order status updated');
      return order;
    } catch (error) {
      logger.error({ error, orderId, status }, 'Error updating order status');
      throw error;
    }
  }

  async getById(orderId: string): Promise<Order | null> {
    try {
      const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({ error, orderId }, 'Error getting order by id');
      throw error;
    }
  }

  async getByExternalReference(externalReference: string): Promise<Order | null> {
    try {
      const result = await query(
        'SELECT * FROM orders WHERE mp_external_reference = $1',
        [externalReference]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error({ error, externalReference }, 'Error getting order by external reference');
      throw error;
    }
  }

  async getByPaymentId(paymentId: string): Promise<Order | null> {
    try {
      const result = await query('SELECT * FROM orders WHERE mp_payment_id = $1', [paymentId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({ error, paymentId }, 'Error getting order by payment id');
      throw error;
    }
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    try {
      const result = await query(
        'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );
      return result.rows;
    } catch (error) {
      logger.error({ error, customerId }, 'Error getting customer orders');
      throw error;
    }
  }

  async savePaymentEvent(
    orderId: string,
    kind: 'webhook' | 'query',
    payload: Record<string, any>
  ): Promise<void> {
    try {
      const eventId = uuidv4();
      await query(
        `INSERT INTO payment_events (id, order_id, kind, payload, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [eventId, orderId, kind, JSON.stringify(payload)]
      );
      logger.debug({ orderId, kind }, 'Payment event saved');
    } catch (error) {
      logger.error({ error, orderId }, 'Error saving payment event');
      throw error;
    }
  }
}

export const orderService = new OrderService();
