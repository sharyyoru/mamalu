/**
 * AI Flagging Service for WhatsApp Messages
 * Detects cash mentions and suspicious payment patterns using regex pattern matching
 */

export interface FlagResult {
  isFlagged: boolean;
  flagType: 'cash_mention' | 'payment_request' | 'suspicious_activity' | null;
  confidence: number;
  matchedKeywords: string[];
  contextSnippet: string;
}

// Cash-related keywords and patterns
const CASH_KEYWORDS = [
  'cash',
  'money',
  'pay cash',
  'cash payment',
  'cash only',
  'in cash',
  'paying cash',
  'paid cash',
  'give cash',
  'bring cash',
  'نقدي', // Arabic: cash
  'نقد', // Arabic: cash/money
  'كاش', // Arabic: cash (transliteration)
];

// Currency patterns
const CURRENCY_PATTERNS = [
  /\b\d+\s*aed\b/i,
  /\baed\s*\d+\b/i,
  /\b\d+\s*dirham[s]?\b/i,
  /\bdirham[s]?\s*\d+\b/i,
  /\b\d+\s*dhs?\b/i,
  /\bdhs?\s*\d+\b/i,
];

// Payment request patterns
const PAYMENT_REQUEST_PATTERNS = [
  /pay\s+me/i,
  /send\s+money/i,
  /transfer\s+money/i,
  /need\s+money/i,
  /give\s+me\s+money/i,
  /payment\s+due/i,
  /outstanding\s+payment/i,
];

// Suspicious activity patterns
const SUSPICIOUS_PATTERNS = [
  /no\s+receipt/i,
  /without\s+receipt/i,
  /off\s+the\s+books/i,
  /under\s+the\s+table/i,
  /don't\s+tell/i,
  /keep\s+it\s+secret/i,
  /no\s+record/i,
];

/**
 * Analyze a message for cash mentions and suspicious patterns
 */
export function analyzeMessage(messageText: string): FlagResult {
  if (!messageText || messageText.trim().length === 0) {
    return {
      isFlagged: false,
      flagType: null,
      confidence: 0,
      matchedKeywords: [],
      contextSnippet: '',
    };
  }

  const lowerText = messageText.toLowerCase();
  const matchedKeywords: string[] = [];
  let flagType: FlagResult['flagType'] = null;
  let confidence = 0;

  // Check for cash keywords
  const cashMatches = CASH_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  if (cashMatches.length > 0) {
    matchedKeywords.push(...cashMatches);
    flagType = 'cash_mention';
    confidence += 0.3 * cashMatches.length;
  }

  // Check for currency patterns
  const currencyMatches = CURRENCY_PATTERNS.filter(pattern => 
    pattern.test(messageText)
  );
  
  if (currencyMatches.length > 0) {
    matchedKeywords.push('currency_amount');
    confidence += 0.2 * currencyMatches.length;
  }

  // Check for payment request patterns
  const paymentRequestMatches = PAYMENT_REQUEST_PATTERNS.filter(pattern => 
    pattern.test(messageText)
  );
  
  if (paymentRequestMatches.length > 0) {
    matchedKeywords.push('payment_request');
    if (!flagType) flagType = 'payment_request';
    confidence += 0.25 * paymentRequestMatches.length;
  }

  // Check for suspicious patterns
  const suspiciousMatches = SUSPICIOUS_PATTERNS.filter(pattern => 
    pattern.test(messageText)
  );
  
  if (suspiciousMatches.length > 0) {
    matchedKeywords.push('suspicious_activity');
    flagType = 'suspicious_activity';
    confidence += 0.4 * suspiciousMatches.length;
  }

  // Boost confidence if multiple indicators are present
  if (cashMatches.length > 0 && currencyMatches.length > 0) {
    confidence += 0.2; // Cash + amount = higher confidence
  }

  if (cashMatches.length > 0 && paymentRequestMatches.length > 0) {
    confidence += 0.15; // Cash + payment request = higher confidence
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  // Extract context snippet (50 chars before and after first match)
  let contextSnippet = '';
  if (matchedKeywords.length > 0) {
    const firstKeyword = cashMatches[0] || 'payment';
    const index = lowerText.indexOf(firstKeyword.toLowerCase());
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(messageText.length, index + firstKeyword.length + 50);
      contextSnippet = messageText.substring(start, end).trim();
      if (start > 0) contextSnippet = '...' + contextSnippet;
      if (end < messageText.length) contextSnippet = contextSnippet + '...';
    } else {
      contextSnippet = messageText.substring(0, 100);
    }
  }

  const isFlagged = confidence >= 0.3; // Flag if confidence is 30% or higher

  return {
    isFlagged,
    flagType: isFlagged ? flagType : null,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: [...new Set(matchedKeywords)], // Remove duplicates
    contextSnippet,
  };
}

/**
 * Batch analyze multiple messages
 */
export function analyzeMessages(messages: Array<{ id: string; text: string }>): Map<string, FlagResult> {
  const results = new Map<string, FlagResult>();
  
  for (const message of messages) {
    const result = analyzeMessage(message.text);
    if (result.isFlagged) {
      results.set(message.id, result);
    }
  }
  
  return results;
}

/**
 * Get statistics from flagged results
 */
export function getFlagStatistics(results: FlagResult[]): {
  totalFlagged: number;
  byCashMention: number;
  byPaymentRequest: number;
  bySuspicious: number;
  avgConfidence: number;
  topKeywords: Array<{ keyword: string; count: number }>;
} {
  const flagged = results.filter(r => r.isFlagged);
  
  const keywordCounts = new Map<string, number>();
  flagged.forEach(result => {
    result.matchedKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });

  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalFlagged: flagged.length,
    byCashMention: flagged.filter(r => r.flagType === 'cash_mention').length,
    byPaymentRequest: flagged.filter(r => r.flagType === 'payment_request').length,
    bySuspicious: flagged.filter(r => r.flagType === 'suspicious_activity').length,
    avgConfidence: flagged.length > 0 
      ? flagged.reduce((sum, r) => sum + r.confidence, 0) / flagged.length 
      : 0,
    topKeywords,
  };
}
