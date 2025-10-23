import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MERCADOPAGO_CONFIG } from '../config/constants';
import logger from '../utils/logger';

// Initialize MercadoPago client only if enabled
let paymentClient: Payment | null = null;
let preferenceClient: Preference | null = null;

if (MERCADOPAGO_CONFIG.enabled) {
  const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_CONFIG.accessToken,
  });
  
  paymentClient = new Payment(client);
  preferenceClient = new Preference(client);
  logger.info('MercadoPago client initialized');
} else {
  logger.warn('MercadoPago is disabled. Payment features will not work.');
}

export { paymentClient, preferenceClient };

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await paymentClient!.get({ id: paymentId });
    logger.debug({ paymentId, status: payment.status }, 'Payment details retrieved');
    return payment;
  } catch (error) {
    logger.error({ error, paymentId }, 'Error getting payment details');
    throw error;
  }
}

export async function getPreference(preferenceId: string) {
  if (!preferenceClient) {
    throw new Error('MercadoPago is not configured');
  }
  try {
    const preference = await preferenceClient!.get({ preferenceId });
    logger.debug({ preferenceId }, 'Preference retrieved');
    return preference;
  } catch (error) {
    logger.error({ error, preferenceId }, 'Error getting preference');
    throw error;
  }
}
