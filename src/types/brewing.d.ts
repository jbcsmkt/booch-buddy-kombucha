export interface BatchData {
    id: number;
    batchNumber: string;
    startDate: string;
    brewSize: number;
    teaType: string;
    teaBlendNotes?: string;
    teaSteepingTemp?: number;
    teaSteepingTime?: number;
    teaAmountGrams?: number;
    starterTea?: number;
    sugarUsed?: number;
    sugarType: string;
    scobyUsed?: boolean;
    method?: string;
    startPH: number;
    startBrix: number;
    endPH?: number;
    endBrix?: number;
    tasteProfile?: string;
    aiStatus?: string;
    primaryFermentComplete?: boolean;
    secondaryFlavoringAdded?: string;
    flavoringAmount?: number;
    secondaryStartDate?: string;
    secondaryEndDate?: string;
    readyToBottle?: boolean;
    finalPH?: number;
    finalBrix?: number;
    finalTasteNotes?: string;
    packagingDate?: string;
    packagingType?: string;
    pasteurized?: boolean;
    qaTestingPerformed?: boolean;
    qaNotes?: string;
    flavoringMethod?: string;
    flavorIngredients?: string;
    sterilized?: boolean;
    flavoringNotes?: string;
    filteringMethod?: string;
    filteringNotes?: string;
    dateFiltered?: string;
    clarityAchieved?: string;
    carbonationTemp?: number;
    targetCO2Volume?: number;
    forceCardPSI?: number;
    carbonationStatus?: string;
    pressurizationStarted?: boolean;
    carbTimeEstimate?: number;
    starterVolume: number;
    teaWeight: number;
    waterVolume: number;
    sugarAmount: number;
    alcoholEstimate?: number;
    lastEntryDate: string;
    progressPercentage: number;
    status: 'needs-attention' | 'in-progress' | 'ready' | 'complete';
}
export interface TeaGuidance {
    type: string;
    tempRange: string;
    timeRange: string;
}
export interface Reminder {
    id: string;
    batchId: string;
    message: string;
    triggerDate: string;
    completed: boolean;
    type: 'ph-brix' | 'bottling-check' | 'final-measurements';
}
export interface BatchInterval {
    id: string;
    batch_id: string;
    recorded_at: string;
    ph_level?: number;
    brix_level?: number;
    temperature?: number;
    taste_notes?: string;
    visual_notes?: string;
    aroma_notes?: string;
    ai_analysis?: string;
    health_score?: number;
    recommendations?: string[];
    created_at: string;
}
export interface AIAnalysis {
    id: string;
    batch_id: string;
    insights: string;
    recommendations: string[];
    health_score: number;
    analyzed_data: any;
    analyzed_at: string;
    created_at: string;
}
export interface UserSettings {
    id: string;
    user_id: string;
    openai_api_key?: string;
    created_at: string;
    updated_at: string;
}
export interface EnhancedMeasurement {
    id: string;
    batch_id: string;
    measurement_date: string;
    ph?: number;
    brix?: number;
    temperature?: number;
    specific_gravity?: number;
    alcohol_content?: number;
    acidity?: number;
    notes?: string;
    created_at: string;
}
export interface RecipeTemplate {
    id: string;
    name: string;
    description?: string;
    tea_type: string;
    tea_amount: number;
    sugar_type: string;
    sugar_amount: number;
    water_amount: number;
    steep_temp: number;
    steep_time: number;
    fermentation_days: number;
    notes?: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}
export interface BatchPhoto {
    id: string;
    batch_id: string;
    photo_url: string;
    caption?: string;
    phase: string;
    created_at: string;
}
export interface Equipment {
    id: string;
    name: string;
    type: string;
    capacity?: number;
    notes?: string;
    last_sanitized?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=brewing.d.ts.map