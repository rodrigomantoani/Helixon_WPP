import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Conversation, Message } from '../database/models/types';
import logger from '../utils/logger';

export class ConversationService {
  async findOrCreateActive(customerId: string): Promise<Conversation> {
    try {
      // Find most recent conversation (within last 24 hours)
      const result = await query(
        `SELECT * FROM conversations 
         WHERE customer_id = $1 
         AND updated_at > NOW() - INTERVAL '24 hours'
         ORDER BY updated_at DESC 
         LIMIT 1`,
        [customerId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Create new conversation
      const conversationId = uuidv4();
      const newResult = await query(
        `INSERT INTO conversations (id, customer_id, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [conversationId, customerId]
      );

      logger.info({ conversationId, customerId }, 'New conversation created');
      return newResult.rows[0];
    } catch (error) {
      logger.error({ error, customerId }, 'Error in findOrCreateActive');
      throw error;
    }
  }

  async saveMessage(
    conversationId: string,
    direction: 'inbound' | 'outbound',
    content: string,
    type: 'text' | 'image' | 'other' = 'text',
    aiMetadata?: Record<string, any>
  ): Promise<Message> {
    try {
      const messageId = uuidv4();
      const result = await query(
        `INSERT INTO messages (id, conversation_id, direction, type, content, ai_metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [messageId, conversationId, direction, type, content, JSON.stringify(aiMetadata)]
      );

      // Update conversation updated_at
      await query(
        'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
        [conversationId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error({ error, conversationId }, 'Error saving message');
      throw error;
    }
  }

  async getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
    try {
      const result = await query(
        `SELECT * FROM messages 
         WHERE conversation_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [conversationId, limit]
      );

      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      logger.error({ error, conversationId }, 'Error getting recent messages');
      throw error;
    }
  }

  async updateSummary(conversationId: string, summary: string): Promise<void> {
    try {
      await query(
        'UPDATE conversations SET summary = $1, updated_at = NOW() WHERE id = $2',
        [summary, conversationId]
      );
    } catch (error) {
      logger.error({ error, conversationId }, 'Error updating conversation summary');
      throw error;
    }
  }

  async updateAIState(conversationId: string, state: Record<string, any>): Promise<void> {
    try {
      await query(
        'UPDATE conversations SET last_ai_state = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(state), conversationId]
      );
    } catch (error) {
      logger.error({ error, conversationId }, 'Error updating AI state');
      throw error;
    }
  }

  async getById(conversationId: string): Promise<Conversation | null> {
    try {
      const result = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({ error, conversationId }, 'Error getting conversation by id');
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
