'use server';
/**
 * @fileOverview AI-powered proctoring system to identify and report potential cheating behaviors.
 *
 * - analyzeProctoringLogs - Analyzes proctoring logs to identify suspicious activities.
 * - AiProctoringInput - The input type for the analyzeProctoringLogs function.
 * - AiProctoringOutput - The return type for the analyzeProctoringLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiProctoringInputSchema = z.object({
  userId: z.string().describe('The ID of the user being proctored.'),
  contestId: z.string().describe('The ID of the contest the user is participating in.'),
  logs: z.array(
    z.object({
      timestamp: z.number().describe('The timestamp of the event.'),
      eventType: z.string().describe('The type of the event (e.g., tab-switch, key-stroke).'),
      details: z.record(z.any()).optional().describe('Additional details about the event.'),
    })
  ).describe('An array of proctoring logs for the user.'),
  code: z.string().describe('The code the user was working on at the time of the event.'),
});
export type AiProctoringInput = z.infer<typeof AiProctoringInputSchema>;

const AiProctoringOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the user activity is deemed suspicious.'),
  explanation: z.string().describe('An explanation of why the activity is suspicious, or why not.'),
});
export type AiProctoringOutput = z.infer<typeof AiProctoringOutputSchema>;

export async function analyzeProctoringLogs(input: AiProctoringInput): Promise<AiProctoringOutput> {
  return aiProctoringFlow(input);
}

const proctoringPrompt = ai.definePrompt({
  name: 'proctoringPrompt',
  input: {schema: AiProctoringInputSchema},
  output: {schema: AiProctoringOutputSchema},
  prompt: `You are an AI proctor analyzing a student's coding contest activity to detect potential cheating.

You are provided with the student's user ID, contest ID, proctoring logs (timestamps, event types, and details), and the code they were working on.

Your task is to determine if the student's activity is suspicious based on the logs and code, and provide a concise explanation.

Consider the following factors when making your determination:

*   Frequency and pattern of tab switches: Rapid or unusual tab switching may indicate the student is searching for answers or communicating with others.
*   Suspicious keystrokes: Unusual key combinations or frequent use of copy-paste may indicate plagiarism.
*   The student's code: Examine the code for any signs of plagiarism or external assistance.
*   Correlation between events: Look for any correlations between tab switches, keystrokes, and code changes that may suggest suspicious activity.

Based on your analysis, set the isSuspicious output field to true if you believe the student is cheating, and provide a detailed explanation in the explanation field. Otherwise, set isSuspicious to false and explain why the activity is not suspicious.

User ID: {{{userId}}}
Contest ID: {{{contestId}}}
Proctoring Logs: {{{JSON.stringify(logs, null, 2)}}}
Code: {{{code}}}

Considerations:

*   A few tab switches are normal, but excessive tab switching is not.
*   Copying code from StackOverflow is considered cheating.
*   Searching documentation is not.
`,
});

const aiProctoringFlow = ai.defineFlow(
  {
    name: 'aiProctoringFlow',
    inputSchema: AiProctoringInputSchema,
    outputSchema: AiProctoringOutputSchema,
  },
  async input => {
    const {output} = await proctoringPrompt(input);
    return output!;
  }
);
