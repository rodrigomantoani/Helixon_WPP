/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Customers table
  pgm.createTable('customers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    phone_e164: {
      type: 'varchar(20)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'varchar(255)',
    },
    meta: {
      type: 'jsonb',
      default: '{}',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('customers', 'phone_e164');

  // Conversations table
  pgm.createTable('conversations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers(id)',
      onDelete: 'CASCADE',
    },
    summary: {
      type: 'text',
    },
    last_ai_state: {
      type: 'jsonb',
      default: '{}',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('conversations', 'customer_id');
  pgm.createIndex('conversations', 'updated_at');

  // Messages table
  pgm.createTable('messages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    conversation_id: {
      type: 'uuid',
      notNull: true,
      references: 'conversations(id)',
      onDelete: 'CASCADE',
    },
    direction: {
      type: 'varchar(10)',
      notNull: true,
      check: "direction IN ('inbound', 'outbound')",
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
      default: 'text',
      check: "type IN ('text', 'image', 'other')",
    },
    content: {
      type: 'text',
      notNull: true,
    },
    ai_metadata: {
      type: 'jsonb',
      default: '{}',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('messages', 'conversation_id');
  pgm.createIndex('messages', 'created_at');

  // Products table
  pgm.createTable('products', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    sku: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: true,
    },
    price_cents: {
      type: 'integer',
      notNull: true,
    },
    currency: {
      type: 'varchar(3)',
      notNull: true,
      default: 'BRL',
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('products', 'sku');
  pgm.createIndex('products', 'active');

  // Orders table
  pgm.createTable('orders', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers(id)',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'products(id)',
      onDelete: 'RESTRICT',
    },
    qty: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    amount_cents: {
      type: 'integer',
      notNull: true,
    },
    currency: {
      type: 'varchar(3)',
      notNull: true,
      default: 'BRL',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'paid', 'canceled', 'failed', 'expired')",
    },
    mp_preference_id: {
      type: 'varchar(255)',
    },
    mp_payment_id: {
      type: 'varchar(255)',
    },
    mp_external_reference: {
      type: 'varchar(255)',
      unique: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('orders', 'customer_id');
  pgm.createIndex('orders', 'status');
  pgm.createIndex('orders', 'mp_external_reference');
  pgm.createIndex('orders', 'created_at');

  // Payment events table
  pgm.createTable('payment_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    order_id: {
      type: 'uuid',
      notNull: true,
      references: 'orders(id)',
      onDelete: 'CASCADE',
    },
    kind: {
      type: 'varchar(20)',
      notNull: true,
      check: "kind IN ('webhook', 'query')",
    },
    payload: {
      type: 'jsonb',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('payment_events', 'order_id');
  pgm.createIndex('payment_events', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('payment_events');
  pgm.dropTable('orders');
  pgm.dropTable('messages');
  pgm.dropTable('conversations');
  pgm.dropTable('products');
  pgm.dropTable('customers');
  pgm.dropExtension('uuid-ossp');
};
