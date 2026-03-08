
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  description: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
}

export interface Appointment {
  id: string;
  description: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  date: string;      // YYYY-MM-DD
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  goals: string[];
  preferences: {
    focusOnHighImpact: boolean;
    workHoursPerDay: number;
    avoidOverwhelm: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    breakDurationMinutes: number;
  };
}

export interface ScheduleEvent {
  startTime: string;
  endTime: string;
  description: string;
}
