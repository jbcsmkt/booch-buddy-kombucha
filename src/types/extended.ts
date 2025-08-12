// Extended types for compatibility with existing components
import { EnhancedMeasurement, RecipeTemplate, BatchPhoto, Equipment } from './brewing';

export interface ExtendedEnhancedMeasurement extends EnhancedMeasurement {
  measurement_type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

export interface ExtendedRecipeTemplate extends RecipeTemplate {
  is_public: boolean;
  recipe_data: any;
}

export interface ExtendedBatchPhoto extends BatchPhoto {
  photo_type: 'scoby' | 'color' | 'clarity' | 'packaging' | 'general';
}

export interface ExtendedEquipment extends Equipment {
  last_cleaned?: string;
  maintenance_schedule?: string;
}