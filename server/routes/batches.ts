import express from 'express';
import { BatchService } from '../services/batchService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const batchService = new BatchService();

// All routes require authentication
router.use(authenticateToken);

// Get all batches for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const batches = await batchService.getBatchesByUser(req.user!.id);
    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get batch by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    // Validate parsed integer
    if (isNaN(batchId) || batchId <= 0) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }
    
    const batch = await batchService.getBatchById(batchId, req.user!.id);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(batch);
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// Create new batch
router.post('/', async (req: AuthRequest, res) => {
  try {
    const batchData = {
      ...req.body,
      user_id: req.user!.id,
      last_entry_date: new Date().toISOString()
    };

    const batchId = await batchService.createBatch(batchData);
    const createdBatch = await batchService.getBatchById(batchId, req.user!.id);
    
    res.status(201).json(createdBatch);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(400).json({ error: 'Failed to create batch' });
  }
});

// Update batch
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    await batchService.updateBatch(batchId, req.user!.id, req.body);
    const updatedBatch = await batchService.getBatchById(batchId, req.user!.id);
    
    if (!updatedBatch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(updatedBatch);
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(400).json({ error: 'Failed to update batch' });
  }
});

// Delete batch
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const batchId = parseInt(req.params.id);
    await batchService.deleteBatch(batchId, req.user!.id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Get batches by status
router.get('/status/:status', async (req: AuthRequest, res) => {
  try {
    const status = req.params.status;
    const batches = await batchService.getBatchesByStatus(req.user!.id, status);
    res.json(batches);
  } catch (error) {
    console.error('Get batches by status error:', error);
    res.status(500).json({ error: 'Failed to fetch batches by status' });
  }
});

// Get recent batches
router.get('/recent/:limit?', async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.params.limit || '10');
    const batches = await batchService.getRecentBatches(req.user!.id, limit);
    res.json(batches);
  } catch (error) {
    console.error('Get recent batches error:', error);
    res.status(500).json({ error: 'Failed to fetch recent batches' });
  }
});

export default router;