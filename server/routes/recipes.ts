import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all recipes (user's own and public)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const includePublic = req.query.includePublic === 'true';
    
    let query = 'SELECT * FROM recipe_templates WHERE user_id = ?';
    let params: any[] = [req.user!.id];
    
    if (includePublic) {
      query = 'SELECT * FROM recipe_templates WHERE user_id = ? OR is_public = true';
    }
    
    query += ' ORDER BY is_favorite DESC, created_at DESC';
    
    const [recipes] = await pool.execute(query, params);
    
    res.json(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get recipe by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    const [recipes] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ? AND (user_id = ? OR is_public = true)',
      [recipeId, req.user!.id]
    );
    
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(recipes[0]);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Create new recipe
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      name, 
      description, 
      tea_type, 
      tea_amount, 
      sugar_type,
      sugar_amount,
      water_amount,
      steep_temp,
      steep_time,
      fermentation_days,
      notes,
      is_favorite,
      is_public 
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO recipe_templates 
       (user_id, name, description, tea_type, tea_amount, sugar_type, sugar_amount, 
        water_amount, steep_temp, steep_time, fermentation_days, notes, is_favorite, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id, name, description, tea_type, tea_amount, sugar_type, sugar_amount,
        water_amount, steep_temp, steep_time, fermentation_days, notes, 
        is_favorite || false, is_public || false
      ]
    );
    
    const insertId = (result as any).insertId;
    
    const [newRecipe] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json(Array.isArray(newRecipe) ? newRecipe[0] : newRecipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(400).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    // Verify user owns this recipe
    const [recipeRows] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ? AND user_id = ?',
      [recipeId, req.user!.id]
    );
    
    if (!Array.isArray(recipeRows) || recipeRows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found or you do not have permission to edit it' });
    }
    
    const { 
      name, 
      description, 
      tea_type, 
      tea_amount, 
      sugar_type,
      sugar_amount,
      water_amount,
      steep_temp,
      steep_time,
      fermentation_days,
      notes,
      is_favorite,
      is_public 
    } = req.body;
    
    await pool.execute(
      `UPDATE recipe_templates 
       SET name = ?, description = ?, tea_type = ?, tea_amount = ?, sugar_type = ?, 
           sugar_amount = ?, water_amount = ?, steep_temp = ?, steep_time = ?, 
           fermentation_days = ?, notes = ?, is_favorite = ?, is_public = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, description, tea_type, tea_amount, sugar_type, sugar_amount,
        water_amount, steep_temp, steep_time, fermentation_days, notes, 
        is_favorite || false, is_public || false, recipeId
      ]
    );
    
    const [updatedRecipe] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ?',
      [recipeId]
    );
    
    res.json(Array.isArray(updatedRecipe) ? updatedRecipe[0] : updatedRecipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(400).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    // Verify user owns this recipe
    const [recipeRows] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ? AND user_id = ?',
      [recipeId, req.user!.id]
    );
    
    if (!Array.isArray(recipeRows) || recipeRows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found or you do not have permission to delete it' });
    }
    
    await pool.execute('DELETE FROM recipe_templates WHERE id = ?', [recipeId]);
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Toggle favorite status
router.patch('/:id/favorite', async (req: AuthRequest, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    // Verify user owns this recipe
    const [recipeRows] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ? AND user_id = ?',
      [recipeId, req.user!.id]
    );
    
    if (!Array.isArray(recipeRows) || recipeRows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const currentStatus = (recipeRows[0] as any).is_favorite;
    
    await pool.execute(
      'UPDATE recipe_templates SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [!currentStatus, recipeId]
    );
    
    const [updatedRecipe] = await pool.execute(
      'SELECT * FROM recipe_templates WHERE id = ?',
      [recipeId]
    );
    
    res.json(Array.isArray(updatedRecipe) ? updatedRecipe[0] : updatedRecipe);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});

export default router;