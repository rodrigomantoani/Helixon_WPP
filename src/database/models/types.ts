export interface Customer {
  id: string;
  phone_e164: string;
  name?: string;
  meta?: Record<string, any>;
  created_at: Date;
}

export interface Conversation {
  id: string;
  customer_id: string;
  summary?: string;
  last_ai_state?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'other';
  content: string;
  ai_metadata?: Record<string, any>;
  created_at: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'canceled'
  | 'failed'
  | 'expired';

export interface Order {
  id: string;
  customer_id: string;
  product_id: string;
  qty: number;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  mp_preference_id?: string;
  mp_payment_id?: string;
  mp_external_reference?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentEvent {
  id: string;
  order_id: string;
  kind: 'webhook' | 'query';
  payload: Record<string, any>;
  created_at: Date;
}
