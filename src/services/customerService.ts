import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Customer } from '../database/models/types';
import logger from '../utils/logger';

export class CustomerService {
  async findOrCreateByPhone(phoneE164: string, name?: string): Promise<Customer> {
    try {
      // Try to find existing customer
      const existingResult = await query(
        'SELECT * FROM customers WHERE phone_e164 = $1',
        [phoneE164]
      );

      if (existingResult.rows.length > 0) {
        const customer = existingResult.rows[0];
        
        // Update name if provided and different
        if (name && name !== customer.name) {
          await query(
            'UPDATE customers SET name = $1 WHERE id = $2',
            [name, customer.id]
          );
          customer.name = name;
        }

        logger.debug({ customerId: customer.id, phone: phoneE164 }, 'Customer found');
        return customer;
      }

      // Create new customer
      const customerId = uuidv4();
      const result = await query(
        `INSERT INTO customers (id, phone_e164, name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [customerId, phoneE164, name]
      );

      const newCustomer = result.rows[0];
      logger.info({ customerId: newCustomer.id, phone: phoneE164 }, 'New customer created');
      return newCustomer;
    } catch (error) {
      logger.error({ error, phone: phoneE164 }, 'Error in findOrCreateByPhone');
      throw error;
    }
  }

  async updateMeta(customerId: string, meta: Record<string, any>): Promise<void> {
    try {
      await query(
        'UPDATE customers SET meta = $1 WHERE id = $2',
        [JSON.stringify(meta), customerId]
      );
      logger.debug({ customerId }, 'Customer meta updated');
    } catch (error) {
      logger.error({ error, customerId }, 'Error updating customer meta');
      throw error;
    }
  }

  async getById(customerId: string): Promise<Customer | null> {
    try {
      const result = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({ error, customerId }, 'Error getting customer by id');
      throw error;
    }
  }
}

export const customerService = new CustomerService();
