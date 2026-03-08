'use server';
/**
 * @fileOverview An AI agent that generates an optimized daily schedule based on tasks, appointments, and user preferences.
 *
 * - generateOptimizedSchedule - A function that handles the schedule generation process.
 * - GenerateOptimizedScheduleInput - The input type for the generateOptimizedSchedule function.
 * - GenerateOptimizedScheduleOutput - The return type for the generateOptimizedSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimizedScheduleInputSchema = z.object({
  currentDate: z
    .string()
    .describe('The date for which the schedule is being generated, e.g., "YYYY-MM-DD".'),
  tasks: z
    .array(
      z.object({
        description: z.string().describe('Description of the task.'),
        durationMinutes: z.number().describe('Estimated duration of the task in minutes.'),
        deadline: z
          .string()
          .optional()
          .describe('Optional deadline for the task in "YYYY-MM-DD HH:MM" format.'),
      })
    )
    .describe('A list of tasks to be scheduled.'),
  appointments: z
    .array(
      z.object({
        description: z.string().describe('Description of the appointment.'),
        startTime: z.string().describe('Start time of the appointment in HH:MM format.'),
        endTime: z.string().describe('End time of the appointment in HH:MM format.'),
      })
    )
    .describe('A list of existing appointments.'),
  preferences: z
    .object({
      workingHoursStart: z.string().describe('Start of preferred working hours in HH:MM format.'),
      workingHoursEnd: z.string().describe('End of preferred working hours in HH:MM format.'),
      breakDurationMinutes: z
        .number()
        .optional()
        .describe('Preferred duration for short breaks in minutes.'),
      preferredBreaks: z
        .array(z.string().describe('Preferred time for a break in HH:MM format.'))
        .optional()
        .describe('Specific preferred times for breaks.'),
      importanceRanking: z
        .record(z.string(), z.number().int().min(1))
        .optional()
        .describe(
          'A mapping of task descriptions to their importance rank (lower number means higher importance).'
        ),
    })
    .describe('User preferences for scheduling.'),
});
export type GenerateOptimizedScheduleInput = z.infer<
  typeof GenerateOptimizedScheduleInputSchema
>;

const GenerateOptimizedScheduleOutputSchema = z.object({
  schedule: z
    .array(
      z.object({
        startTime: z.string().describe('Start time of the event in HH:MM format.'),
        endTime: z.string().describe('End time of the event in HH:MM format.'),
        description: z.string().describe('Description of the scheduled event (task or appointment).'),
      })
    )
    .describe('The generated optimized daily schedule.'),
  notes: z
    .string()
    .describe('Any important notes, conflicts, or suggestions regarding the generated schedule.'),
});
export type GenerateOptimizedScheduleOutput = z.infer<
  typeof GenerateOptimizedScheduleOutputSchema
>;

export async function generateOptimizedSchedule(
  input: GenerateOptimizedScheduleInput
): Promise<GenerateOptimizedScheduleOutput> {
  return intelligentScheduleGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentScheduleGenerationPrompt',
  input: {schema: GenerateOptimizedScheduleInputSchema},
  output: {schema: GenerateOptimizedScheduleOutputSchema},
  prompt: `You are an intelligent scheduling assistant. Your goal is to create an optimized daily schedule for the user based on their tasks, appointments, and preferences for the date: {{{currentDate}}}.

Here are the details:

**Tasks to schedule:**
{{#if tasks}}
{{#each tasks}}
- Description: {{{this.description}}}, Estimated Duration: {{{this.durationMinutes}}} minutes{{#if this.deadline}}, Deadline: {{{this.deadline}}}{{/if}}
{{/each}}
{{else}}
No specific tasks provided.
{{/if}}

**Existing appointments:**
{{#if appointments}}
{{#each appointments}}
- Description: {{{this.description}}}, Start Time: {{{this.startTime}}}, End Time: {{{this.endTime}}}
{{/each}}
{{else}}
No existing appointments.
{{/if}}

**User preferences:**
- Preferred working hours: From {{{preferences.workingHoursStart}}} to {{{preferences.workingHoursEnd}}}
{{#if preferences.breakDurationMinutes}}
- Preferred break duration: {{{preferences.breakDurationMinutes}}} minutes
{{/if}}
{{#if preferences.preferredBreaks}}
- Preferred break times: {{#each preferences.preferredBreaks}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if preferences.importanceRanking}}
- Task importance ranking (lower number is higher importance):
  {{#each preferences.importanceRanking}}
  - "{{@key}}": {{{this}}}
  {{/each}}
{{/if}}

Please create a schedule for the date {{{currentDate}}}.
The schedule should integrate all appointments and intelligently place tasks within the working hours, considering task durations, deadlines, and user preferences.
Ensure there are no overlaps. If a task cannot be completed within the day, note it in the 'notes' section.
If possible, integrate short breaks.

Respond with a JSON object strictly following this structure:
${'```json'}
{{{OutputSchema}}}
${'```'}`,
});

const intelligentScheduleGenerationFlow = ai.defineFlow(
  {
    name: 'intelligentScheduleGenerationFlow',
    inputSchema: GenerateOptimizedScheduleInputSchema,
    outputSchema: GenerateOptimizedScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
