import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../config/constants';
import { SYSTEM_PROMPT } from './prompts';
import logger from '../utils/logger';
import Bottleneck from 'bottleneck';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_CONFIG.apiKey,
});

// Rate limiter: max 10 requests per minute globally
const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 6000, // 6 seconds between requests
});

// Tools available to the AI
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_products',
      description: 'Lista todos os produtos disponíveis com preços e descrições',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Consulta o status de um pedido pelo ID',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'ID do pedido',
          },
        },
        required: ['orderId'],
      },
    },
  },
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export async function generateChatCompletion(
  messages: ChatMessage[],
  temperature: number = 0.7
): Promise<string> {
  try {
    const response = await limiter.schedule(() =>
      openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature,
        tools,
        tool_choice: 'auto',
      })
    );

    const choice = response.choices[0];
    
    if (!choice.message) {
      throw new Error('No message in response');
    }

    // Handle tool calls if present
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      logger.debug({ toolCall }, 'AI requested tool call');
      
      // Return a special format indicating tool call needed
      return JSON.stringify({
        type: 'tool_call',
        function: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
        callId: toolCall.id,
      });
    }

    const content = choice.message.content || '';
    
    logger.debug(
      {
        tokensUsed: response.usage?.total_tokens,
        model: response.model,
      },
      'OpenAI completion generated'
    );

    return content;
  } catch (error) {
    logger.error({ error }, 'Error generating chat completion');
    throw error;
  }
}

export async function generateSimpleCompletion(prompt: string): Promise<string> {
  return generateChatCompletion([{ role: 'user', content: prompt }]);
}
