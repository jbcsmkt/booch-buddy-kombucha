import { BatchInterval } from '../types/brewing';
import { validateApiKey, sanitizeInput, aiAnalysisRateLimiter, SECURITY_CONFIG } from '../config/security';

export interface AIAnalysisRequest {
  intervals: BatchInterval[];
  batchInfo: {
    teaType: string;
    sugarType: string;
    startDate: string;
    brewSize: number;
    method?: string;
  };
}

export interface AIAnalysisResponse {
  healthScore: number;
  status?: string;
  analysis: string;
  recommendations: string[];
  alerts: string[];
}

export const analyzeFementation = async (
  request: AIAnalysisRequest,
  apiKey: string
): Promise<AIAnalysisResponse> => {
  // Rate limiting check
  if (!aiAnalysisRateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(aiAnalysisRateLimiter.getTimeUntilNextRequest() / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making another request.`);
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is required for analysis');
  }

  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format. Please check your OpenAI API key.');
  }

  // Sanitize input data
  const sanitizedIntervals = request.intervals.map(interval => ({
    ...interval,
    taste_notes: interval.taste_notes ? sanitizeInput(interval.taste_notes) : undefined,
    visual_notes: interval.visual_notes ? sanitizeInput(interval.visual_notes) : undefined,
    aroma_notes: interval.aroma_notes ? sanitizeInput(interval.aroma_notes) : undefined,
  }));

  const prompt = `
You are an expert kombucha brewing consultant aware of one-day, two-day, and zero-day kombucha methods. Consider alcohol risk, residual sweetness, and microbial safety.

Batch Information:
- Method: ${request.batchInfo.method || 'Not specified'}
- Tea Type: ${request.batchInfo.teaType}
- Sugar Type: ${request.batchInfo.sugarType}
- Start Date: ${request.batchInfo.startDate}
- Brew Size: ${request.batchInfo.brewSize} gallons

Fermentation Data Points:
${sanitizedIntervals.map(interval => `
Date: ${interval.recorded_at}
pH: ${interval.ph_level || 'Not recorded'}
Brix: ${interval.brix_level || 'Not recorded'}
Temperature: ${interval.temperature || 'Not recorded'}°F
Taste: ${interval.taste_notes || 'Not recorded'}
Visual: ${interval.visual_notes || 'Not recorded'}
Aroma: ${interval.aroma_notes || 'Not recorded'}
`).join('\n')}

Please provide:
1. A health score (0-100) for the fermentation
2. A detailed analysis of the fermentation progress considering the specific method
3. Specific recommendations for improvement based on the method used
4. Any alerts or concerns related to safety and method-specific considerations

Consider the following method-specific factors:
- Zero-day: Immediate consumption, minimal fermentation
- One-day: Short fermentation, balance of sweetness and tang
- Two-day: Extended fermentation, higher acidity and alcohol potential

Respond in JSON format:
{
  "healthScore": number,
  "analysis": "detailed analysis text considering method",
  "recommendations": ["method-specific recommendation 1", "recommendation 2"],
  "alerts": ["safety alert 1", "method-specific alert 2"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...SECURITY_CONFIG.SECURITY_HEADERS,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert kombucha brewing consultant versed in zero-day, one-day, and two-day methods. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        user: 'kombucha-brew-tracker', // User identifier for OpenAI's safety systems
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('AI Analysis error:', error);
    
    if (error instanceof Error) {
      // Re-throw the original error message for better debugging
      throw error;
    }
    
    throw new Error('Failed to analyze fermentation data: Unknown error');
  }
};

// QA Inspector Agent
export const performQAInspection = async (
  batchData: {
    method?: string;
    teaType: string;
    teaSteepingTime?: number;
    teaSteepingTemp?: number;
    startPH: number;
    clarityAchieved?: string;
    forceCardPSI?: number;
  },
  apiKey: string
): Promise<{
  flags: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}> => {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }

  const prompt = `
You are a kombucha QA specialist versed in scaling methods and shelf stability. Evaluate risk based on data inputs and brewing method.

Check the batch for QA flags:
- Method: ${batchData.method || 'Not specified'}
- Tea Type: ${batchData.teaType}
- Steep Time: ${batchData.teaSteepingTime || 'Not specified'} min
- Steep Temp: ${batchData.teaSteepingTemp || 'Not specified'}°F
- Start pH: ${batchData.startPH}
- Clarity: ${batchData.clarityAchieved || 'Not specified'}
- Force Carb PSI: ${batchData.forceCardPSI || 'Not specified'}

Identify any unusual parameters, safety concerns, or method-specific issues.

Respond with JSON:
{
  "flags": ["flag 1", "flag 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskLevel": "low" | "medium" | "high"
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...SECURITY_CONFIG.SECURITY_HEADERS,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a kombucha QA specialist. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`QA API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('QA inspection failed:', error);
    throw error;
  }
};

// Reminder Agent
export const getNextActionReminder = async (
  batchData: {
    batchNumber: string;
    method?: string;
    startDate: string;
    lastEntryDate: string;
    endPH?: number;
    endBrix?: number;
  },
  apiKey: string
): Promise<{
  action: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}> => {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }

  const prompt = `
You assist with kombucha brewing timelines based on method and fermentation milestones.

Advise on next step or input needed:
- Batch ID: ${batchData.batchNumber}
- Method: ${batchData.method || 'Not specified'}
- Start Date: ${batchData.startDate}
- Last Entry: ${batchData.lastEntryDate}
- End pH: ${batchData.endPH || '[empty]'}
- End Brix: ${batchData.endBrix || '[empty]'}

Determine what action is needed next and its priority based on the method and timeline.

Respond with JSON:
{
  "action": "specific action needed",
  "priority": "low" | "medium" | "high",
  "dueDate": "YYYY-MM-DD" (optional)
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...SECURITY_CONFIG.SECURITY_HEADERS,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a kombucha brewing assistant. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reminder API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Reminder generation failed:', error);
    throw error;
  }
};