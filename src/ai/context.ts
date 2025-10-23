import { Message } from '../database/models/types';
import { ChatMessage } from './openai';
import logger from '../utils/logger';

export class ConversationContext {
  private maxMessages: number = 10;

  buildContext(messages: Message[], summary?: string): ChatMessage[] {
    const context: ChatMessage[] = [];

    // Add summary if exists
    if (summary) {
      context.push({
        role: 'system',
        content: `Resumo da conversa anterior: ${summary}`,
      });
    }

    // Add recent messages
    const recentMessages = messages.slice(-this.maxMessages);
    
    for (const msg of recentMessages) {
      context.push({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    logger.debug(
      { contextLength: context.length, hasSummary: !!summary },
      'Context built'
    );

    return context;
  }

  generateSummary(messages: Message[]): string {
    if (messages.length === 0) return '';

    // Simple summary: first and last messages
    const first = messages[0];
    const last = messages[messages.length - 1];

    return `Conversa iniciada sobre: ${first.content.substring(0, 100)}. Último tópico: ${last.content.substring(0, 100)}`;
  }

  shouldGenerateSummary(messagesCount: number): boolean {
    // Generate summary every 20 messages
    return messagesCount > 0 && messagesCount % 20 === 0;
  }
}

export const conversationContext = new ConversationContext();
