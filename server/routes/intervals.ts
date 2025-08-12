import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get intervals for a batch
router.get('/batch/:batchId', async (req: AuthRequest, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    
    // Verify user owns this batch
    const [batchRows] = await pool.execute(
      'SELECT id FROM batches WHERE id = ? AND user_id = ?',
      [batchId, req.user!.id]
    );
    
    if (!Array.isArray(batchRows) || batchRows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const [intervals] = await pool.execute(
      'SELECT * FROM batch_intervals WHERE batch_id = ? ORDER BY recorded_at ASC',
      [batchId]
    );
    
    res.json(intervals);
  } catch (error) {
    console.error('Get intervals error:', error);
    res.status(500).json({ error: 'Failed to fetch intervals' });
  }
});

// Create new interval
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      batch_id, 
      recorded_at, 
      ph_level, 
      brix_level, 
      temperature,
      taste_notes,
      visual_notes,
      aroma_notes 
    } = req.body;
    
    // Verify user owns this batch
    const [batchRows] = await pool.execute(
      'SELECT id FROM batches WHERE id = ? AND user_id = ?',
      [batch_id, req.user!.id]
    );
    
    if (!Array.isArray(batchRows) || batchRows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO batch_intervals 
       (batch_id, recorded_at, ph_level, brix_level, temperature, taste_notes, visual_notes, aroma_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, recorded_at, ph_level, brix_level, temperature, taste_notes, visual_notes, aroma_notes]
    );
    
    const insertId = (result as any).insertId;
    
    const [newInterval] = await pool.execute(
      'SELECT * FROM batch_intervals WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json(Array.isArray(newInterval) ? newInterval[0] : newInterval);
  } catch (error) {
    console.error('Create interval error:', error);
    res.status(400).json({ error: 'Failed to create interval' });
  }
});

// Update interval
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const intervalId = parseInt(req.params.id);
    
    // Verify user owns this interval's batch
    const [intervalRows] = await pool.execute(
      `SELECT bi.* FROM batch_intervals bi 
       JOIN batches b ON bi.batch_id = b.id 
       WHERE bi.id = ? AND b.user_id = ?`,
      [intervalId, req.user!.id]
    );
    
    if (!Array.isArray(intervalRows) || intervalRows.length === 0) {
      return res.status(404).json({ error: 'Interval not found' });
    }
    
    const { 
      ph_level, 
      brix_level, 
      temperature,
      taste_notes,
      visual_notes,
      aroma_notes 
    } = req.body;
    
    await pool.execute(
      `UPDATE batch_intervals 
       SET ph_level = ?, brix_level = ?, temperature = ?, 
           taste_notes = ?, visual_notes = ?, aroma_notes = ?
       WHERE id = ?`,
      [ph_level, brix_level, temperature, taste_notes, visual_notes, aroma_notes, intervalId]
    );
    
    const [updatedInterval] = await pool.execute(
      'SELECT * FROM batch_intervals WHERE id = ?',
      [intervalId]
    );
    
    res.json(Array.isArray(updatedInterval) ? updatedInterval[0] : updatedInterval);
  } catch (error) {
    console.error('Update interval error:', error);
    res.status(400).json({ error: 'Failed to update interval' });
  }
});

// Delete interval
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const intervalId = parseInt(req.params.id);
    
    // Verify user owns this interval's batch
    const [intervalRows] = await pool.execute(
      `SELECT bi.* FROM batch_intervals bi 
       JOIN batches b ON bi.batch_id = b.id 
       WHERE bi.id = ? AND b.user_id = ?`,
      [intervalId, req.user!.id]
    );
    
    if (!Array.isArray(intervalRows) || intervalRows.length === 0) {
      return res.status(404).json({ error: 'Interval not found' });
    }
    
    await pool.execute('DELETE FROM batch_intervals WHERE id = ?', [intervalId]);
    
    res.json({ message: 'Interval deleted successfully' });
  } catch (error) {
    console.error('Delete interval error:', error);
    res.status(500).json({ error: 'Failed to delete interval' });
  }
});

export default router;