/**
 * Security configuration for the Kombucha Brew Tracker
 * This file contains security-related constants and utilities
 */

export const SECURITY_CONFIG = {
  // API key validation patterns
  OPENAI_API_KEY_PATTERN: /^sk-[a-zA-Z0-9_-]{20,}$/,
  
  // Rate limiting for API calls
  AI_ANALYSIS_RATE_LIMIT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Data validation rules
  VALIDATION_RULES: {
    maxIntervalDataPoints: 100,
    maxBatchNameLength: 50,
    maxNotesLength: 1000,
  },
  
  // Security headers for API requests
  SECURITY_HEADERS: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

/**
 * Validates an OpenAI API key format
 */
export const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  return SECURITY_CONFIG.OPENAI_API_KEY_PATTERN.test(apiKey);
};

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, SECURITY_CONFIG.VALIDATION_RULES.maxNotesLength);
};

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private requests: number[] = [];
  
  canMakeRequest(): boolean {
    const now = Date.now();
    const { maxRequests, windowMs } = SECURITY_CONFIG.AI_ANALYSIS_RATE_LIMIT;
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    // Check if we can make a new request
    if (this.requests.length < maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const { windowMs } = SECURITY_CONFIG.AI_ANALYSIS_RATE_LIMIT;
    
    return Math.max(0, windowMs - (Date.now() - oldestRequest));
  }
}

export const aiAnalysisRateLimiter = new RateLimiter();