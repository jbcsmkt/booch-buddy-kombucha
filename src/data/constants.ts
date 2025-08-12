import { TeaGuidance } from '../types/brewing';

export const TEA_TYPES = [
  'Black',
  'Green', 
  'Oolong',
  'Herbal',
  'Custom Blend'
];

export const SUGAR_TYPES = [
  'Cane',
  'Organic',
  'Brown',
  'Coconut'
];

export const TASTE_PROFILES = [
  'Too Sweet',
  'Flat',
  'Tangy + Dry',
  'Mild Vinegar',
  'Overly Sour',
  'Sour + Balanced',
  'Funky',
  'Harsh'
];

export const FLAVORING_METHODS = [
  'None',
  'Juice',
  'Puree',
  'Herbs',
  'Extracts'
];

export const FILTERING_METHODS = [
  'None',
  'Sieve',
  'Fine Mesh',
  'Cloth',
  'Cold Crash',
  'Micron Filter'
];

export const CLARITY_LEVELS = [
  'Clear',
  'Slightly Cloudy',
  'Yeasty',
  'Sediment Present'
];

export const CARBONATION_STATUSES = [
  'Not Started',
  'In Progress',
  'Complete'
];

export const PACKAGING_TYPES = [
  'Bottle',
  'Keg'
];

export const BREWING_METHODS = [
  'Zero-day',
  'One-day', 
  'Two-day'
];

export const TEA_GUIDANCE: TeaGuidance[] = [
  { type: 'Black', tempRange: '200–212°F', timeRange: '4–5 min' },
  { type: 'Green', tempRange: '160–180°F', timeRange: '2–3 min' },
  { type: 'Oolong', tempRange: '185–205°F', timeRange: '4–7 min' },
  { type: 'Herbal', tempRange: '208–212°F', timeRange: '5–7 min' }
];