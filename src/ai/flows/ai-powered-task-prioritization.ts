'use server';
/**
 * @fileOverview An AI agent for prioritizing tasks based on user input.
 *
 * - aiPoweredTaskPrioritization - A function that handles the task prioritization process.
 * - AIPoweredTaskPrioritizationInput - The input type for the aiPoweredTaskPrioritization function.
 * - AIPoweredTaskPrioritizationOutput - The return type for the aiPoweredTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizationTaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  name: z.string().describe('The name or title of the task.'),
  description: z.string().optional().describe('A detailed description of the task.'),
  deadline: z
    .string()
    .optional()
    .describe('Optional deadline for the task in ISO 8601 format (e.g., "2024-12-31T23:59:59Z").'),
  currentPriority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .optional()
    .describe('The current or suggested priority level of the task.'),
  category: z.string().optional().describe('The category or project this task belongs to.'),
});

const AIPoweredTaskPrioritizationInputSchema = z.object({
  tasks: z.array(PrioritizationTaskSchema).describe('A list of tasks to be prioritized.'),
  goals: z.array(z.string()).describe('A list of overarching user goals that should influence prioritization.'),
  userPreferences:
    z.object({
      focusOnHighImpact: z.boolean().optional().describe('If true, the AI should prioritize tasks with potentially higher impact.'),
      workHoursPerDay: z.number().optional().describe('Average number of hours the user plans to work per day. Used for workload estimation.'),
      avoidOverwhelm: z.boolean().optional().describe('If true, the AI should try to distribute critical tasks to avoid overwhelming the user.'),
    })
    .optional()
    .describe('Optional user preferences that guide the prioritization.'),
});
export type AIPoweredTaskPrioritizationInput = z.infer<typeof AIPoweredTaskPrioritizationInputSchema>;

const AIPoweredTaskPrioritizationOutputSchema = z.object({
  prioritizedTaskIds: z.array(z.string()).describe('An ordered list of task IDs, from highest to lowest priority.'),
  reasoning: z.string().describe('A detailed explanation for the suggested task prioritization.'),
});
export type AIPoweredTaskPrioritizationOutput = z.infer<typeof AIPoweredTaskPrioritizationOutputSchema>;

export async function aiPoweredTaskPrioritization(
  input: AIPoweredTaskPrioritizationInput
): Promise<AIPoweredTaskPrioritizationOutput> {
  return aiPoweredTaskPrioritizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredTaskPrioritizationPrompt',
  input: {schema: AIPoweredTaskPrioritizationInputSchema},
  output: {schema: AIPoweredTaskPrioritizationOutputSchema},
  prompt: `You are an expert AI assistant specialized in task management and prioritization. Your goal is to help the user focus on the most important work first by analyzing their tasks, deadlines, and defined goals to suggest an optimal prioritization order.

Here are the user's tasks:
{{#each tasks}}
- ID: {{{id}}}
  Name: {{{name}}}
  {{#if description}}Description: {{{description}}}{{/if}}
  {{#if deadline}}Deadline: {{{deadline}}}{{/if}}
  {{#if currentPriority}}Current Priority: {{{currentPriority}}}{{/if}}
  {{#if category}}Category: {{{category}}}{{/if}}
{{/each}}

Here are the user's overarching goals:
{{#each goals}}
- {{{this}}}
{{/each}}

{{#if userPreferences}}
Here are the user's preferences to consider:
  {{#if userPreferences.focusOnHighImpact}}Focus on High Impact: {{userPreferences.focusOnHighImpact}}{{/if}}
  {{#if userPreferences.workHoursPerDay}}Work Hours Per Day: {{userPreferences.workHoursPerDay}}{{/if}}
  {{#if userPreferences.avoidOverwhelm}}Avoid Overwhelm: {{userPreferences.avoidOverwhelm}}{{/if}}
{{/if}}

Based on this information, provide an optimal prioritization of the task IDs, from highest to lowest priority. Also, provide a clear and concise reasoning for your prioritization. The output MUST be a JSON object conforming to the AIPoweredTaskPrioritizationOutputSchema.`,
});

const aiPoweredTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'aiPoweredTaskPrioritizationFlow',
    inputSchema: AIPoweredTaskPrioritizationInputSchema,
    outputSchema: AIPoweredTaskPrioritizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
