import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../config/database.js';

export interface BatchData {
  id?: number;
  user_id: number;
  batch_number: string;
  start_date: string;
  brew_size: number;
  tea_type: string;
  tea_blend_notes?: string;
  tea_steeping_temp?: number;
  tea_steeping_time?: number;
  starter_tea?: number;
  sugar_used?: number;
  sugar_type: string;
  scoby_used?: boolean;
  method?: string;
  start_ph: number;
  start_brix: number;
  end_ph?: number;
  end_brix?: number;
  taste_profile?: string;
  ai_status?: string;
  primary_ferment_complete?: boolean;
  secondary_flavoring_added?: string;
  flavoring_amount?: number;
  secondary_start_date?: string;
  secondary_end_date?: string;
  ready_to_bottle?: boolean;
  final_ph?: number;
  final_brix?: number;
  final_taste_notes?: string;
  packaging_date?: string;
  packaging_type?: string;
  pasteurized?: boolean;
  qa_testing_performed?: boolean;
  qa_notes?: string;
  flavoring_method?: string;
  flavor_ingredients?: string;
  sterilized?: boolean;
  flavoring_notes?: string;
  filtering_method?: string;
  filtering_notes?: string;
  date_filtered?: string;
  clarity_achieved?: string;
  carbonation_temp?: number;
  target_co2_volume?: number;
  force_carb_psi?: number;
  carbonation_status?: string;
  pressurization_started?: boolean;
  carb_time_estimate?: number;
  starter_volume: number;
  tea_weight: number;
  water_volume: number;
  sugar_amount: number;
  alcohol_estimate?: number;
  last_entry_date: string;
  progress_percentage: number;
  status: 'needs-attention' | 'in-progress' | 'ready' | 'complete';
  created_at?: Date;
  updated_at?: Date;
}

export class BatchService {
  async createBatch(data: Omit<BatchData, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const query = `
      INSERT INTO batches (
        user_id, batch_number, start_date, brew_size, tea_type, tea_blend_notes,
        tea_steeping_temp, tea_steeping_time, starter_tea, sugar_used, sugar_type,
        scoby_used, method, start_ph, start_brix, end_ph, end_brix, taste_profile,
        ai_status, primary_ferment_complete, secondary_flavoring_added,
        flavoring_amount, secondary_start_date, secondary_end_date, ready_to_bottle,
        final_ph, final_brix, final_taste_notes, packaging_date, packaging_type,
        pasteurized, qa_testing_performed, qa_notes, flavoring_method,
        flavor_ingredients, sterilized, flavoring_notes, filtering_method,
        filtering_notes, date_filtered, clarity_achieved, carbonation_temp,
        target_co2_volume, force_carb_psi, carbonation_status,
        pressurization_started, carb_time_estimate, starter_volume, tea_weight,
        water_volume, sugar_amount, alcohol_estimate, last_entry_date,
        progress_percentage, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.user_id, data.batch_number, data.start_date, data.brew_size, data.tea_type,
      data.tea_blend_notes, data.tea_steeping_temp, data.tea_steeping_time, data.starter_tea,
      data.sugar_used, data.sugar_type, data.scoby_used, data.method, data.start_ph,
      data.start_brix, data.end_ph, data.end_brix, data.taste_profile, data.ai_status,
      data.primary_ferment_complete, data.secondary_flavoring_added, data.flavoring_amount,
      data.secondary_start_date, data.secondary_end_date, data.ready_to_bottle,
      data.final_ph, data.final_brix, data.final_taste_notes, data.packaging_date,
      data.packaging_type, data.pasteurized, data.qa_testing_performed, data.qa_notes,
      data.flavoring_method, data.flavor_ingredients, data.sterilized, data.flavoring_notes,
      data.filtering_method, data.filtering_notes, data.date_filtered, data.clarity_achieved,
      data.carbonation_temp, data.target_co2_volume, data.force_carb_psi,
      data.carbonation_status, data.pressurization_started, data.carb_time_estimate,
      data.starter_volume, data.tea_weight, data.water_volume, data.sugar_amount,
      data.alcohol_estimate, data.last_entry_date, data.progress_percentage, data.status
    ];

    return await executeInsert(query, params);
  }

  async getBatchById(id: number, userId: number): Promise<BatchData | null> {
    return await executeQuerySingle<BatchData>(
      'SELECT * FROM batches WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  async getBatchesByUser(userId: number): Promise<BatchData[]> {
    return await executeQuery<BatchData>(
      'SELECT * FROM batches WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async updateBatch(id: number, userId: number, data: Partial<BatchData>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    // Whitelist of allowed fields to prevent SQL injection
    const allowedFields = [
      'batch_number', 'start_date', 'brew_size', 'tea_type', 'tea_blend_notes',
      'tea_steeping_temp', 'tea_steeping_time', 'starter_tea', 'sugar_used', 
      'sugar_type', 'scoby_used', 'method', 'start_ph', 'start_brix', 'end_ph',
      'end_brix', 'taste_profile', 'ai_status', 'primary_ferment_complete',
      'secondary_flavoring_added', 'flavoring_amount', 'secondary_start_date',
      'secondary_end_date', 'ready_to_bottle', 'final_ph', 'final_brix',
      'final_taste_notes', 'packaging_date', 'packaging_type', 'pasteurized',
      'qa_testing_performed', 'qa_notes', 'flavoring_method', 'flavor_ingredients',
      'sterilized', 'flavoring_notes', 'filtering_method', 'filtering_notes',
      'date_filtered', 'clarity_achieved', 'carbonation_temp', 'target_co2_volume',
      'force_carb_psi', 'carbonation_status', 'pressurization_started', 
      'carb_time_estimate', 'starter_volume', 'tea_weight', 'water_volume',
      'sugar_amount', 'alcohol_estimate', 'last_entry_date', 'progress_percentage', 'status'
    ];

    // Build secure update query using whitelisted fields only
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(data[key as keyof BatchData]);
      }
    });

    if (updates.length === 0) return;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, userId);

    const query = `UPDATE batches SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await executeUpdate(query, params);
  }

  async deleteBatch(id: number, userId: number): Promise<void> {
    await executeUpdate('DELETE FROM batches WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getBatchesByStatus(userId: number, status: string): Promise<BatchData[]> {
    return await executeQuery<BatchData>(
      'SELECT * FROM batches WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
      [userId, status]
    );
  }

  async getRecentBatches(userId: number, limit: number = 10): Promise<BatchData[]> {
    return await executeQuery<BatchData>(
      'SELECT * FROM batches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }
}