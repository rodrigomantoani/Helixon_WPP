import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MERCADOPAGO_CONFIG } from '../config/constants';
import logger from '../utils/logger';

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_CONFIG.accessToken,
});

export const paymentClient = new Payment(client);
export const preferenceClient = new Preference(client);

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    logger.debug({ paymentId, status: payment.status }, 'Payment details retrieved');
    return payment;
  } catch (error) {
    logger.error({ error, paymentId }, 'Error getting payment details');
    throw error;
  }
}

export async function getPreference(preferenceId: string) {
  try {
    const preference = await preferenceClient.get({ preferenceId });
    logger.debug({ preferenceId }, 'Preference retrieved');
    return preference;
  } catch (error) {
    logger.error({ error, preferenceId }, 'Error getting preference');
    throw error;
  }
}
