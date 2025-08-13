export interface Batch {
  id: number;
  batchNumber: string;
  startDate: string;
  brewSize: number;
  teaType: string;
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  progressPercentage: number;
  startPH?: number;
  startBrix?: number;
  endPH?: number;
  endBrix?: number;
  notes?: string;
  userId: number;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  teaType: string;
  brewSize: number;
  instructions: string;
  userId: number;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Measurement {
  id: number;
  batchId: number;
  measurementType: string;
  value: number;
  unit: string;
  notes?: string;
  timestamp: string;
  created_at?: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  description?: string;
  capacity?: number;
  units?: string;
  userId: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}