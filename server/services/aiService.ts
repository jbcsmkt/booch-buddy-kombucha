import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import type { User } from '../types/auth.js';
import type { Batch } from '../types/brewing.js';

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface BrewingContext {
  user: User;
  batch?: Batch;
  recentBatches?: Batch[];
  conversationHistory?: ChatCompletionMessageParam[];
}

class AIService {
  private client: OpenAI | null = null;
  private model: string = 'gpt-4o';

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public async generateResponse(
    message: string,
    context: BrewingContext
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
    }

    try {
      const messages = this.buildMessages(message, context);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content received from OpenAI');
      }

      return {
        content: responseContent,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error('Unknown AI service error');
    }
  }

  private buildMessages(message: string, context: BrewingContext): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    // System message with brewing expertise and context
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(context)
    });

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory.slice(-10)); // Keep last 10 messages for context
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    return messages;
  }

  private buildSystemPrompt(context: BrewingContext): string {
    let prompt = `You are an expert kombucha brewing assistant. You have extensive knowledge about:
- Kombucha fermentation processes and troubleshooting
- SCOBY care and maintenance
- Tea types, sugar ratios, and flavor combinations
- pH levels, temperature control, and timing
- Food safety and contamination prevention
- Equipment recommendations and sanitization
- Flavor profiling and second fermentation techniques

You provide helpful, accurate, and practical advice to kombucha brewers of all skill levels.`;

    // Add user context
    if (context.user) {
      prompt += `\n\nUser: ${context.user.username}`;
      if (context.user.role === 'admin') {
        prompt += ' (Administrator)';
      }
    }

    // Add current batch context if available
    if (context.batch) {
      prompt += `\n\nCurrent Batch Context:
- Batch Number: ${context.batch.batchNumber}
- Tea Type: ${context.batch.teaType}
- Start Date: ${context.batch.startDate}
- Brew Size: ${context.batch.brewSize}L
- Status: ${context.batch.status}
- Progress: ${context.batch.progressPercentage}%`;

      if (context.batch.startPH) {
        prompt += `\n- Starting pH: ${context.batch.startPH}`;
      }
      if (context.batch.startBrix) {
        prompt += `\n- Starting Brix: ${context.batch.startBrix}`;
      }
    }

    // Add recent batches context
    if (context.recentBatches && context.recentBatches.length > 0) {
      prompt += `\n\nRecent Batches:`;
      context.recentBatches.slice(0, 3).forEach(batch => {
        prompt += `\n- ${batch.batchNumber}: ${batch.teaType}, ${batch.status}`;
      });
    }

    prompt += `\n\nProvide concise, practical advice. If asked about specific measurements or troubleshooting, refer to the batch data when relevant. Always prioritize food safety in your recommendations.`;

    return prompt;
  }

  public async generateBrewingTips(batchData: Batch): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Based on this kombucha batch data, provide 3-4 specific brewing tips or observations:

Batch: ${batchData.batchNumber}
Tea Type: ${batchData.teaType}
Brew Size: ${batchData.brewSize}L
Days Fermenting: ${Math.floor((new Date().getTime() - new Date(batchData.startDate).getTime()) / (1000 * 60 * 60 * 24))}
Status: ${batchData.status}
${batchData.startPH ? `Starting pH: ${batchData.startPH}` : ''}
${batchData.startBrix ? `Starting Brix: ${batchData.startBrix}` : ''}

Provide actionable, specific tips for this batch.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a kombucha brewing expert. Provide concise, actionable brewing tips.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content || 'No tips generated';
    } catch (error) {
      console.error('Error generating brewing tips:', error);
      return 'Unable to generate tips at this time';
    }
  }

  public async troubleshootBatch(batchData: Batch, issue: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Help troubleshoot this kombucha brewing issue:

Issue: ${issue}

Batch Details:
- Batch: ${batchData.batchNumber}
- Tea Type: ${batchData.teaType}  
- Days Fermenting: ${Math.floor((new Date().getTime() - new Date(batchData.startDate).getTime()) / (1000 * 60 * 60 * 24))}
- Brew Size: ${batchData.brewSize}L
${batchData.startPH ? `- Starting pH: ${batchData.startPH}` : ''}
${batchData.startBrix ? `- Starting Brix: ${batchData.startBrix}` : ''}

Provide specific troubleshooting steps and solutions.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a kombucha troubleshooting expert. Provide specific, actionable solutions to brewing problems. Always prioritize food safety.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'No troubleshooting advice generated';
    } catch (error) {
      console.error('Error generating troubleshooting advice:', error);
      return 'Unable to provide troubleshooting advice at this time';
    }
  }
}

export const aiService = new AIService();