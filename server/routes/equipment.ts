import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all equipment for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    
    let query = 'SELECT * FROM equipment WHERE user_id = ?';
    const params: any[] = [req.user!.id];
    
    if (activeOnly) {
      query += ' AND is_active = true';
    }
    
    query += ' ORDER BY type, name';
    
    const [equipment] = await pool.execute(query, params);
    
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Get equipment by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    const [equipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ? AND user_id = ?',
      [equipmentId, req.user!.id]
    );
    
    if (!Array.isArray(equipment) || equipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(equipment[0]);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      name, 
      type, 
      capacity, 
      notes,
      is_active 
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO equipment 
       (user_id, name, type, capacity, notes, is_active, last_sanitized)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        req.user!.id, name, type, capacity || null, notes || null, 
        is_active !== false
      ]
    );
    
    const insertId = (result as any).insertId;
    
    const [newEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json(Array.isArray(newEquipment) ? newEquipment[0] : newEquipment);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(400).json({ error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    // Verify user owns this equipment
    const [equipmentRows] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ? AND user_id = ?',
      [equipmentId, req.user!.id]
    );
    
    if (!Array.isArray(equipmentRows) || equipmentRows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    const { 
      name, 
      type, 
      capacity, 
      notes,
      is_active 
    } = req.body;
    
    await pool.execute(
      `UPDATE equipment 
       SET name = ?, type = ?, capacity = ?, notes = ?, is_active = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, type, capacity || null, notes || null, is_active !== false, equipmentId]
    );
    
    const [updatedEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    res.json(Array.isArray(updatedEquipment) ? updatedEquipment[0] : updatedEquipment);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(400).json({ error: 'Failed to update equipment' });
  }
});

// Mark equipment as sanitized
router.patch('/:id/sanitize', async (req: AuthRequest, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    // Verify user owns this equipment
    const [equipmentRows] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ? AND user_id = ?',
      [equipmentId, req.user!.id]
    );
    
    if (!Array.isArray(equipmentRows) || equipmentRows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    await pool.execute(
      'UPDATE equipment SET last_sanitized = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [equipmentId]
    );
    
    const [updatedEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    res.json(Array.isArray(updatedEquipment) ? updatedEquipment[0] : updatedEquipment);
  } catch (error) {
    console.error('Sanitize equipment error:', error);
    res.status(500).json({ error: 'Failed to update sanitization status' });
  }
});

// Delete equipment
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    // Verify user owns this equipment
    const [equipmentRows] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ? AND user_id = ?',
      [equipmentId, req.user!.id]
    );
    
    if (!Array.isArray(equipmentRows) || equipmentRows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    await pool.execute('DELETE FROM equipment WHERE id = ?', [equipmentId]);
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

export default router;