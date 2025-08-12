-- Migration script from kbt_db to booch_buddy database
-- Migrates brewing patterns to recipe templates

USE booch_buddy;

-- Migrate brewing patterns to recipe_templates
-- Since there's no user data in kbt_db, we'll use the default admin user
INSERT INTO recipe_templates (
    user_id,
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
    is_public,
    created_at
)
SELECT 
    1 as user_id,  -- Using admin user
    bp.pattern_name as name,
    CONCAT('Success rate: ', bp.success_rate * 100, '%, ',
           'Quality score: ', IFNULL(bp.avg_quality_score, 'N/A'), ', ',
           'Based on ', bp.batch_count, ' batches') as description,
    bp.tea_type,
    15.0 as tea_amount,  -- Default tea amount in grams
    'Cane Sugar' as sugar_type,  -- Default sugar type
    (bp.optimal_sugar_min + bp.optimal_sugar_max) / 2 as sugar_amount,
    1000.0 as water_amount,  -- Default 1L water
    (bp.optimal_temp_min + bp.optimal_temp_max) / 2 as steep_temp,
    15.0 as steep_time,  -- Default 15 minutes
    7 as fermentation_days,  -- Default 7 days
    CONCAT('Optimal pH range: ', bp.optimal_ph_min, '-', bp.optimal_ph_max, ', ',
           'Optimal temperature range: ', bp.optimal_temp_min, '°C-', bp.optimal_temp_max, '°C') as notes,
    TRUE as is_favorite,  -- Mark imported patterns as favorites
    TRUE as is_public,    -- Make them public
    bp.created_at
FROM kbt_db.brewing_patterns bp;

-- Display migration results
SELECT 'Migration completed!' as Status;
SELECT COUNT(*) as 'Imported Recipe Templates' FROM recipe_templates WHERE notes LIKE 'Optimal pH range:%';