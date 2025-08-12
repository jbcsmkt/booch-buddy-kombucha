import express from 'express';
import { aiService } from '../services/aiService';
import { authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// All AI routes require authentication
router.use(authenticateToken);

// Chat with AI assistant
router.post('/chat', async (req: AuthenticatedRequest, res) => {
  try {
    const { message, conversationHistory, batchId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!aiService.isConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. OpenAI API key required.' 
      });
    }

    // Build context for AI
    const context = {
      user: req.user!,
      conversationHistory: conversationHistory || [],
      // Note: In a real implementation, you would fetch batch data from database
      // For now, we'll work with the mock data structure
    };

    const aiResponse = await aiService.generateResponse(message, context);
    
    res.json({
      response: aiResponse.content,
      usage: aiResponse.usage
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'AI service error' 
    });
  }
});

// Generate brewing tips for a specific batch
router.post('/tips/:batchId', async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId } = req.params;

    if (!aiService.isConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. OpenAI API key required.' 
      });
    }

    // In a real implementation, fetch batch data from database
    // For now, return a mock response
    const mockBatchData = {
      id: parseInt(batchId),
      batchNumber: `BB-${String(batchId).padStart(3, '0')}`,
      startDate: '2024-01-15',
      brewSize: 4.0,
      teaType: 'Green Tea',
      status: 'in-progress' as const,
      progressPercentage: 65,
      startPH: 4.5,
      startBrix: 8.2,
    };

    const tips = await aiService.generateBrewingTips(mockBatchData);
    
    res.json({ tips });

  } catch (error) {
    console.error('AI tips generation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'AI service error' 
    });
  }
});

// Troubleshoot a batch issue
router.post('/troubleshoot/:batchId', async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId } = req.params;
    const { issue } = req.body;

    if (!issue || typeof issue !== 'string') {
      return res.status(400).json({ error: 'Issue description is required' });
    }

    if (!aiService.isConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. OpenAI API key required.' 
      });
    }

    // In a real implementation, fetch batch data from database
    const mockBatchData = {
      id: parseInt(batchId),
      batchNumber: `BB-${String(batchId).padStart(3, '0')}`,
      startDate: '2024-01-15',
      brewSize: 4.0,
      teaType: 'Green Tea',
      status: 'in-progress' as const,
      progressPercentage: 65,
      startPH: 4.5,
      startBrix: 8.2,
    };

    const advice = await aiService.troubleshootBatch(mockBatchData, issue);
    
    res.json({ advice });

  } catch (error) {
    console.error('AI troubleshooting error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'AI service error' 
    });
  }
});

// Check AI service status
router.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    const isConfigured = aiService.isConfigured();
    
    res.json({
      configured: isConfigured,
      status: isConfigured ? 'ready' : 'not_configured',
      message: isConfigured 
        ? 'AI service is ready' 
        : 'OpenAI API key not configured'
    });

  } catch (error) {
    console.error('AI status check error:', error);
    res.status(500).json({ 
      error: 'Unable to check AI service status' 
    });
  }
});

export { router as aiRoutes };