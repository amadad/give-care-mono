/**
 * Conversation Summarization for Token Compression
 *
 * Strategy: Recent detail + historical compression
 * Target: 60-80% token savings for long conversations
 *
 * Pattern:
 * - Last 5 messages: Full detail
 * - Previous 20 messages: Compressed summaries
 * - Older messages: High-level themes only
 */

import type { QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

interface Message {
  _id: Id<'messages'>;
  _creationTime: number;
  text: string;
  direction: 'inbound' | 'outbound';
}

interface ConversationSummary {
  recentMessages: string[];  // Last 5 messages, full detail
  compressedHistory: string; // Summarized older messages
  totalMessages: number;
  tokensSaved: number;
  compressionRatio: number;
}

/**
 * Estimate token count (rough: ~4 chars per token)
 */
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

/**
 * Compress a batch of messages into a concise summary
 */
const compressMessages = (messages: Message[]): string => {
  if (messages.length === 0) return '';

  // Group by themes
  const userMessages = messages.filter(m => m.direction === 'inbound');
  const agentMessages = messages.filter(m => m.direction === 'outbound');

  // Extract key topics and concerns
  const topics = new Set<string>();
  const concerns: string[] = [];

  userMessages.forEach(msg => {
    const text = msg.text.toLowerCase();

    // Detect common themes
    if (text.includes('stress') || text.includes('overwhelm')) topics.add('stress');
    if (text.includes('sleep') || text.includes('tired') || text.includes('exhaust')) topics.add('sleep_issues');
    if (text.includes('worry') || text.includes('anxious')) topics.add('anxiety');
    if (text.includes('sad') || text.includes('depress')) topics.add('mood_concerns');
    if (text.includes('care recipient') || text.includes('mom') || text.includes('dad')) topics.add('caregiving_challenges');
    if (text.includes('help') || text.includes('support')) topics.add('seeking_support');

    // Extract brief concerns (first 50 chars)
    if (text.length > 10) {
      concerns.push(text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    }
  });

  const summary: string[] = [];

  if (topics.size > 0) {
    summary.push(`Discussed: ${Array.from(topics).join(', ')}`);
  }

  if (concerns.length > 0) {
    // Take up to 3 most recent concerns
    const topConcerns = concerns.slice(-3);
    summary.push(`Recent concerns: ${topConcerns.join('; ')}`);
  }

  summary.push(`(${userMessages.length} user messages, ${agentMessages.length} responses)`);

  return summary.join('. ');
};

/**
 * Build conversation summary for context injection
 *
 * Returns recent detail + compressed history to save tokens
 */
export const summarizeConversation = async (
  ctx: QueryCtx,
  userId: Id<'users'>,
  limit: number = 25
): Promise<ConversationSummary> => {
  // Fetch recent messages
  const allMessages = await ctx.db
    .query('messages')
    .withIndex('by_user_created', (q) => q.eq('userId', userId))
    .order('desc')
    .take(limit);

  if (allMessages.length === 0) {
    return {
      recentMessages: [],
      compressedHistory: '',
      totalMessages: 0,
      tokensSaved: 0,
      compressionRatio: 0,
    };
  }

  // Reverse to chronological order
  const messages = allMessages.reverse();

  // Strategy: Keep last 5 messages in full detail
  const RECENT_COUNT = 5;
  const recentMessages = messages.slice(-RECENT_COUNT);
  const olderMessages = messages.slice(0, -RECENT_COUNT);

  // Format recent messages (full detail)
  const recentFormatted = recentMessages.map(m =>
    `${m.direction === 'inbound' ? 'User' : 'Agent'}: ${m.text}`
  );

  // Compress older messages
  const compressed = olderMessages.length > 0
    ? compressMessages(olderMessages)
    : '';

  // Calculate token savings
  const originalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.text), 0);
  const recentTokens = recentMessages.reduce((sum, m) => sum + estimateTokens(m.text), 0);
  const compressedTokens = estimateTokens(compressed);
  const finalTokens = recentTokens + compressedTokens;

  const tokensSaved = originalTokens - finalTokens;
  const compressionRatio = originalTokens > 0
    ? Math.round((tokensSaved / originalTokens) * 100)
    : 0;

  return {
    recentMessages: recentFormatted,
    compressedHistory: compressed,
    totalMessages: messages.length,
    tokensSaved,
    compressionRatio,
  };
};

/**
 * Format summarized conversation for agent context
 */
export const formatForContext = (summary: ConversationSummary): string => {
  const parts: string[] = [];

  if (summary.compressedHistory) {
    parts.push(`Previous conversation summary:\n${summary.compressedHistory}`);
  }

  if (summary.recentMessages.length > 0) {
    parts.push(`\nRecent messages:\n${summary.recentMessages.join('\n')}`);
  }

  return parts.join('\n\n');
};
