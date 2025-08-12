import { BatchData, Reminder } from '../types/brewing';
import { addDays, isAfter, parseISO } from 'date-fns';

export const generateReminders = (batch: BatchData | null | undefined): Reminder[] => {
  if (!batch || !batch.startDate || !batch.id) return [];
  
  const reminders: Reminder[] = [];
  let startDate: Date;
  
  try {
    startDate = parseISO(batch.startDate);
  } catch (error) {
    console.error('Invalid start date in batch:', batch.startDate);
    return [];
  }
  
  // 48h after start - remind to log pH/Brix
  const phBrixReminder: Reminder = {
    id: `${batch.id}-ph-brix`,
    batchId: batch.id.toString(),
    message: `Log pH/Brix measurements for Batch ${batch.batchNumber}`,
    triggerDate: addDays(startDate, 2).toISOString(),
    completed: !!(batch.endPH && batch.endBrix),
    type: 'ph-brix'
  };
  
  // 7d after start - remind to check for bottling
  const bottlingReminder: Reminder = {
    id: `${batch.id}-bottling`,
    batchId: batch.id.toString(),
    message: `Check bottling readiness for Batch ${batch.batchNumber}`,
    triggerDate: addDays(startDate, 7).toISOString(),
    completed: !!batch.readyToBottle,
    type: 'bottling-check'
  };
  
  reminders.push(phBrixReminder, bottlingReminder);
  
  // 2d after secondary start - remind to enter final measurements
  if (batch.secondaryStartDate) {
    const secondaryStart = parseISO(batch.secondaryStartDate);
    const finalMeasurementsReminder: Reminder = {
      id: `${batch.id}-final`,
      batchId: batch.id.toString(),
      message: `Enter final pH/Brix for Batch ${batch.batchNumber}`,
      triggerDate: addDays(secondaryStart, 2).toISOString(),
      completed: !!(batch.finalPH && batch.finalBrix),
      type: 'final-measurements'
    };
    reminders.push(finalMeasurementsReminder);
  }
  
  return reminders;
};

export const getActiveReminders = (reminders: Reminder[]): Reminder[] => {
  const now = new Date();
  return reminders.filter(reminder => 
    !reminder.completed && isAfter(now, parseISO(reminder.triggerDate))
  );
};