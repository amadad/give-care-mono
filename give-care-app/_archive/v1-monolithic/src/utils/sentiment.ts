/**
 * Sentiment Detection (Poke-inspired Pattern Recognition)
 *
 * Detects implicit feedback signals from user messages:
 * - Gratitude (positive signal)
 * - Frustration (negative signal)
 * - Confusion (negative signal)
 * - Question similarity (re-ask detection)
 */

/**
 * Detect gratitude patterns in user message
 * Returns true if message contains thankfulness, appreciation, or positive feedback
 */
export function containsGratitude(message: string): boolean {
  const gratitudePatterns = [
    // Direct thanks
    /\bthank/i,
    /\bthanks/i,
    /\bty\b/i, // "ty" (thank you)
    /\bthx\b/i,

    // Appreciation
    /\bappreciate/i,
    /\bgrateful/i,
    /\bhelpful/i,
    /\bhelps/i,
    /\bhelped/i,

    // Positive affirmation
    /\bperfect/i,
    /\bexactly/i,
    /\bjust what i needed/i,
    /\bthat('s| is) (great|good|wonderful|awesome|amazing)/i,

    // Enthusiasm
    /\byou('re| are) (amazing|great|awesome|the best)/i,
    /\blove (this|it)/i,
    /\bso helpful/i,
  ]

  return gratitudePatterns.some(pattern => pattern.test(message))
}

/**
 * Detect frustration patterns in user message
 * Returns true if message contains signs of dissatisfaction or failure
 */
export function containsFrustration(message: string): boolean {
  const frustrationPatterns = [
    // Direct negative feedback
    /\b(doesn't|doesnt|does not|didn't|didnt|did not) (help|work)/i,
    /\bnot helpful/i,
    /\buseless/i,

    // Giving up
    /\bnever mind/i,
    /\bforget it/i,
    /\bwhatever/i,
    /\bi('ll|ll) just/i, // "I'll just do it myself"

    // Confusion/frustration
    /\b(not|doesn't|doesnt) (make sense|understand)/i,
    /\bconfused/i,
    /\bdon't get it/i,
    /\bthis (isn't|isnt|is not) working/i,

    // Negative comparison
    /\bnot what i (meant|needed|asked for)/i,
    /\bthat('s| is) not (it|right)/i,
  ]

  return frustrationPatterns.some(pattern => pattern.test(message))
}

/**
 * Detect confusion patterns in user message
 * Returns true if message shows user is unclear about something
 */
export function containsConfusion(message: string): boolean {
  const confusionPatterns = [
    // Question marks with confusion words
    /\bwhat do you mean\?/i,
    /\bi don't understand/i,
    /\bconfused/i,
    /\bhuh\?/i,
    /\bwhat\?/i,
    /\bsorry, what/i,

    // Requests for clarification
    /\bcan you (explain|clarify)/i,
    /\bwhat('s| is) that (mean|means)/i,
    /\bcould you (repeat|say that again)/i,
  ]

  return confusionPatterns.some(pattern => pattern.test(message))
}

/**
 * Check if two messages are asking the same or similar question
 * Used to detect when user re-asks because previous answer wasn't helpful
 */
export function isSimilarQuery(message1: string, message2: string): boolean {
  if (!message1 || !message2) return false

  // Normalize messages (lowercase, remove punctuation)
  const normalize = (msg: string) =>
    msg
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()

  const msg1 = normalize(message1)
  const msg2 = normalize(message2)

  // Exact match (after normalization)
  if (msg1 === msg2) return true

  // Extract key words (excluding common words)
  const commonWords = new Set([
    'i',
    'me',
    'my',
    'the',
    'a',
    'an',
    'is',
    'am',
    'are',
    'was',
    'were',
    'can',
    'could',
    'would',
    'should',
    'need',
    'want',
    'find',
    'help',
    'me',
    'you',
  ])

  const getKeyWords = (msg: string): Set<string> => {
    const words = msg.split(/\s+/)
    return new Set(
      words.filter(
        w => w.length > 3 && !commonWords.has(w) // Only keep significant words
      )
    )
  }

  const keywords1 = getKeyWords(msg1)
  const keywords2 = getKeyWords(msg2)

  // Calculate Jaccard similarity (intersection / union)
  const intersection = new Set([...keywords1].filter(w => keywords2.has(w)))
  const union = new Set([...keywords1, ...keywords2])

  if (union.size === 0) return false

  const similarity = intersection.size / union.size

  // If 60%+ of keywords overlap, consider it similar
  return similarity >= 0.6
}

/**
 * Detect if message indicates user took action on a suggestion
 * Returns true if message shows user tried or used the resource
 */
export function indicatesActionTaken(message: string): boolean {
  const actionPatterns = [
    // Past tense action
    /\bi (tried|used|called|visited|went to|looked at)/i,
    /\bit worked/i,
    /\bthat worked/i,
    /\bi did (it|that)/i,

    // Confirmation
    /\byes, (i|that)/i,
    /\bgot it/i,
    /\bfound it/i,
  ]

  return actionPatterns.some(pattern => pattern.test(message))
}

/**

/**
 * Calculate engagement score based on message patterns
 * Returns 0.0 to 1.0 (higher = more engaged)
 */
export function calculateEngagementScore(message: string, timeSincePrevious: number): number {
  let score = 0.5 // Start neutral

  // Positive signals (+0.3 each)
  if (containsGratitude(message)) score += 0.3
  if (indicatesActionTaken(message)) score += 0.3

  // Negative signals (-0.3 each)
  if (containsFrustration(message)) score -= 0.3
  if (containsConfusion(message)) score -= 0.2

  // Time factor (quick responses indicate engagement)
  const fiveMinutes = 5 * 60 * 1000
  if (timeSincePrevious < fiveMinutes) {
    score += 0.2 // Responded quickly = engaged
  } else if (timeSincePrevious > 24 * 60 * 60 * 1000) {
    score -= 0.1 // Took over a day = less engaged
  }

  // Message length (longer = more engaged, but not always)
  const wordCount = message.split(/\s+/).length
  if (wordCount > 20) score += 0.1 // Detailed response
  if (wordCount < 3) score -= 0.1 // One-word response

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score))
}
