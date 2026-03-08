'use server';
/**
 * @fileOverview A Genkit flow for generating smart reminders and notifications.
 *
 * - smartRemindersAndNotifications - A function that generates smart reminders and notifications based on user tasks, schedule, and preferences.
 * - SmartRemindersAndNotificationsInput - The input type for the smartRemindersAndNotifications function.
 * - SmartRemindersAndNotificationsOutput - The return type for the smartRemindersAndNotifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  name: z.string().describe('Name of the task.'),
  description: z.string().optional().describe('Description of the task.'),
  deadline: z.string().datetime().describe('ISO 8601 formatted deadline for the task.'),
  priority: z.enum(['low', 'medium', 'high']).describe('Priority level of the task.'),
  status: z.enum(['todo', 'in_progress', 'completed']).describe('Current status of the task.'),
});

const EventSchema = z.object({
  id: z.string().describe('Unique identifier for the event.'),
  title: z.string().describe('Title of the event.'),
  start: z.string().datetime().describe('ISO 8601 formatted start time of the event.'),
  end: z.string().datetime().describe('ISO 8601 formatted end time of the event.'),
  allDay: z.boolean().describe('Whether the event is an all-day event.'),
});

const UserPreferencesSchema = z.object({
  notificationTimeBeforeDeadlineHours: z.number().int().min(0).describe('Number of hours before a task deadline to generate a reminder.'),
  conflictWarningThresholdMinutes: z.number().int().min(0).describe('Number of minutes of overlap that constitutes a schedule conflict.'),
  preferredNotificationStyle: z.enum(['concise', 'detailed']).describe('Preferred style for notifications.'),
  goals: z.array(z.string()).describe('List of user goals.'),
});

const SmartRemindersAndNotificationsInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('List of user tasks.'),
  schedule: z.array(EventSchema).describe('List of user scheduled events/appointments.'),
  userPreferences: UserPreferencesSchema.describe('User-defined preferences for notifications and scheduling.'),
});
export type SmartRemindersAndNotificationsInput = z.infer<typeof SmartRemindersAndNotificationsInputSchema>;

// Output Schema
const NotificationSchema = z.object({
  type: z.enum(['reminder', 'conflict', 'suggestion']).describe('The type of notification.'),
  message: z.string().describe('The notification message.'),
  relatedTaskId: z.string().optional().describe('Optional ID of the task related to this notification.'),
  relatedEventId: z.string().optional().describe('Optional ID of the event related to this notification.'),
  timestamp: z.string().datetime().describe('ISO 8601 formatted timestamp indicating when this notification is relevant or should be sent.'),
});

const SmartRemindersAndNotificationsOutputSchema = z.object({
  notifications: z.array(NotificationSchema).describe('A list of smart reminders and notifications.'),
});
export type SmartRemindersAndNotificationsOutput = z.infer<typeof SmartRemindersAndNotificationsOutputSchema>;

// Wrapper function
export async function smartRemindersAndNotifications(input: SmartRemindersAndNotificationsInput): Promise<SmartRemindersAndNotificationsOutput> {
  return smartRemindersAndNotificationsFlow(input);
}

// Prompt definition
const smartRemindersAndNotificationsPrompt = ai.definePrompt({
  name: 'smartRemindersAndNotificationsPrompt',
  input: {schema: SmartRemindersAndNotificationsInputSchema},
  output: {schema: SmartRemindersAndNotificationsOutputSchema},
  prompt: `You are an AI-powered personal assistant specializing in task management and scheduling. Your goal is to provide smart reminders, conflict warnings, and helpful suggestions to keep the user productive and on track.

Today's date and time is: {{CURRENT_DATETIME}} (ISO 8601 format).

Review the provided tasks, schedule, and user preferences carefully.

User Preferences:
- Notification time before deadline: {{userPreferences.notificationTimeBeforeDeadlineHours}} hours
- Conflict warning threshold: {{userPreferences.conflictWarningThresholdMinutes}} minutes
- Preferred notification style: {{userPreferences.preferredNotificationStyle}}
- User Goals: {{#each userPreferences.goals}}- {{this}}
{{/each}}

Tasks:
{{#if tasks}}
{{#each tasks}}
- ID: {{id}}, Name: "{{name}}", Description: "{{description}}", Deadline: {{deadline}}, Priority: {{priority}}, Status: {{status}}
{{/each}}
{{else}}
No tasks provided.
{{/if}}

Schedule:
{{#if schedule}}
{{#each schedule}}
- ID: {{id}}, Title: "{{title}}", Start: {{start}}, End: {{end}}, All Day: {{allDay}}
{{/each}}
{{else}}
No schedule provided.
{{/if}}

Based on the above information, generate a list of smart notifications.
Consider the following:
1.  **Reminders**: For tasks with a 'todo' or 'in_progress' status, if their deadline is within the 'notificationTimeBeforeDeadlineHours' from now, create a 'reminder' notification. The message should be concise or detailed based on 'preferredNotificationStyle'.
2.  **Conflicts**: Identify any overlapping events in the schedule. If events overlap by at least 'conflictWarningThresholdMinutes', create a 'conflict' notification.
3.  **Suggestions**: Provide proactive suggestions to improve productivity, such as prioritizing high-priority tasks that are approaching deadlines, or suggesting adjustments for potential schedule conflicts. Focus on one or two key suggestions if applicable, especially if the 'preferredNotificationStyle' is concise.

Ensure the 'timestamp' for each notification is relevant (e.g., the deadline for reminders, the start time of the conflicting event for conflicts, or the current time for general suggestions).
Only include notifications that are relevant *now* or in the *immediate future*. Do not include notifications for completed tasks or events far in the past/future.
Strictly adhere to the output JSON schema.
`,
});

// Flow definition
const smartRemindersAndNotificationsFlow = ai.defineFlow(
  {
    name: 'smartRemindersAndNotificationsFlow',
    inputSchema: SmartRemindersAndNotificationsInputSchema,
    outputSchema: SmartRemindersAndNotificationsOutputSchema,
  },
  async (input) => {
    // Inject current datetime into the prompt context for the AI to use.
    // This allows the AI to calculate time differences relative to 'now'.
    const now = new Date().toISOString();
    const {output} = await smartRemindersAndNotificationsPrompt({
      ...input,
      CURRENT_DATETIME: now, // Add current datetime to the prompt context for the prompt to use
    });
    return output!;
  }
);
