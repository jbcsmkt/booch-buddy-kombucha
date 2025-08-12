import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get measurements for a batch
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
    
    const [measurements] = await pool.execute(
      'SELECT * FROM enhanced_measurements WHERE batch_id = ? ORDER BY measurement_date ASC',
      [batchId]
    );
    
    res.json(measurements);
  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// Create new measurement
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      batch_id, 
      measurement_date, 
      ph, 
      brix, 
      temperature,
      specific_gravity,
      alcohol_content,
      acidity,
      notes 
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
      `INSERT INTO enhanced_measurements 
       (batch_id, measurement_date, ph, brix, temperature, specific_gravity, alcohol_content, acidity, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, measurement_date, ph, brix, temperature, specific_gravity, alcohol_content, acidity, notes]
    );
    
    const insertId = (result as any).insertId;
    
    const [newMeasurement] = await pool.execute(
      'SELECT * FROM enhanced_measurements WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json(Array.isArray(newMeasurement) ? newMeasurement[0] : newMeasurement);
  } catch (error) {
    console.error('Create measurement error:', error);
    res.status(400).json({ error: 'Failed to create measurement' });
  }
});

// Update measurement
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const measurementId = parseInt(req.params.id);
    
    // Verify user owns this measurement's batch
    const [measurementRows] = await pool.execute(
      `SELECT em.* FROM enhanced_measurements em 
       JOIN batches b ON em.batch_id = b.id 
       WHERE em.id = ? AND b.user_id = ?`,
      [measurementId, req.user!.id]
    );
    
    if (!Array.isArray(measurementRows) || measurementRows.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }
    
    const { 
      ph, 
      brix, 
      temperature,
      specific_gravity,
      alcohol_content,
      acidity,
      notes 
    } = req.body;
    
    await pool.execute(
      `UPDATE enhanced_measurements 
       SET ph = ?, brix = ?, temperature = ?, specific_gravity = ?, 
           alcohol_content = ?, acidity = ?, notes = ?
       WHERE id = ?`,
      [ph, brix, temperature, specific_gravity, alcohol_content, acidity, notes, measurementId]
    );
    
    const [updatedMeasurement] = await pool.execute(
      'SELECT * FROM enhanced_measurements WHERE id = ?',
      [measurementId]
    );
    
    res.json(Array.isArray(updatedMeasurement) ? updatedMeasurement[0] : updatedMeasurement);
  } catch (error) {
    console.error('Update measurement error:', error);
    res.status(400).json({ error: 'Failed to update measurement' });
  }
});

// Delete measurement
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const measurementId = parseInt(req.params.id);
    
    // Verify user owns this measurement's batch
    const [measurementRows] = await pool.execute(
      `SELECT em.* FROM enhanced_measurements em 
       JOIN batches b ON em.batch_id = b.id 
       WHERE em.id = ? AND b.user_id = ?`,
      [measurementId, req.user!.id]
    );
    
    if (!Array.isArray(measurementRows) || measurementRows.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }
    
    await pool.execute('DELETE FROM enhanced_measurements WHERE id = ?', [measurementId]);
    
    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    console.error('Delete measurement error:', error);
    res.status(500).json({ error: 'Failed to delete measurement' });
  }
});

export default router;