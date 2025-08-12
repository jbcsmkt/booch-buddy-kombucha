import React from 'react';
import { Bell, Clock, X, CheckCircle } from 'lucide-react';
import { Reminder } from '../types/brewing';
import { format, parseISO } from 'date-fns';

interface ReminderSystemProps {
  reminders: Reminder[];
  onDismiss: (reminderId: string) => void;
  onComplete: (reminderId: string) => void;
}

export const ReminderSystem: React.FC<ReminderSystemProps> = ({ reminders, onDismiss, onComplete }) => {
  const activeReminders = reminders.filter(r => !r.completed);

  if (activeReminders.length === 0) {
    return null;
  }

  const getReminderIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'ph-brix': return <Clock size={16} className="text-brewing-warning" />;
      case 'bottling-check': return <Bell size={16} className="text-brewing-amber" />;
      case 'final-measurements': return <CheckCircle size={16} className="text-brewing-success" />;
      default: return <Bell size={16} className="text-brewing-copper" />;
    }
  };

  const getReminderColor = (type: Reminder['type']) => {
    switch (type) {
      case 'ph-brix': return 'border-brewing-warning bg-brewing-warning bg-opacity-10';
      case 'bottling-check': return 'border-brewing-amber bg-brewing-amber bg-opacity-10';
      case 'final-measurements': return 'border-brewing-success bg-brewing-success bg-opacity-10';
      default: return 'border-brewing-copper bg-brewing-copper bg-opacity-10';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="text-brewing-amber" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Active Reminders</h3>
      </div>
      
      {activeReminders.map((reminder) => (
        <div 
          key={reminder.id}
          className={`border rounded-lg p-4 ${getReminderColor(reminder.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getReminderIcon(reminder.type)}
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {reminder.message}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Due: {format(parseISO(reminder.triggerDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onComplete(reminder.id)}
                className="text-brewing-success hover:text-green-700 transition-colors"
                title="Mark as complete"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => onDismiss(reminder.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss reminder"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};