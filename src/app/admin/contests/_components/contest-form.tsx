
'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Contest } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { addContest, updateContest } from '@/lib/contestService';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';


const questionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string().min(1, 'Category is required'),
  statement: z.string().min(1, 'Statement is required'),
  constraints: z.string().min(1, 'Constraints are required'),
  inputSample: z.string().min(1, 'Input sample is required'),
  outputSample: z.string().min(1, 'Output sample is required'),
  hiddenTestCases: z.string().min(1, 'Hidden test cases are required'),
});

const levelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Level name is required'),
  timeLimit: z.coerce.number().min(1, 'Time limit must be at least 1 minute'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

const contestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.date({ required_error: 'Start time is required' }),
  endTime: z.date({ required_error: 'End time is required' }),
  levels: z.array(levelSchema).min(1, 'At least one level is required'),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type ContestFormValues = z.infer<typeof contestSchema>;

export function ContestForm({ contest }: { contest?: Contest }) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ContestFormValues>({
    resolver: zodResolver(contestSchema),
    defaultValues: contest
      ? {
          ...contest,
          startTime: contest.startTime instanceof Timestamp ? contest.startTime.toDate() : new Date(contest.startTime),
          endTime: contest.endTime instanceof Timestamp ? contest.endTime.toDate() : new Date(contest.endTime),
        }
      : {
          title: '',
          startTime: undefined,
          endTime: undefined,
          levels: [],
        },
  });

  const { fields: levelFields, append: appendLevel, remove: removeLevel } = useFieldArray({
    control: form.control,
    name: 'levels',
  });

  async function onSubmit(data: ContestFormValues) {
    const contestData = {
      ...data,
      levels: data.levels.map(level => ({
        ...level,
        questions: level.questions.map(q => ({...q, id: q.id || `q-${Date.now()}-${Math.random()}`})),
        id: level.id || `level-${Date.now()}-${Math.random()}`
      }))
    };

    try {
      if (contest && contest.id) {
        await updateContest(contest.id, contestData);
        toast({ title: 'Success', description: 'Contest updated successfully.' });
      } else {
        await addContest(contestData);
        toast({ title: 'Success', description: 'Contest created successfully.' });
      }
      router.push('/admin/contests');
      router.refresh();
    } catch (error) {
        console.error("Failed to save contest", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not save the contest. You may not have the required permissions.",
        });
    }
  }

  const handleTimeChange = (field: any, timeValue: string) => {
    if (!timeValue) return;
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDate = field.value ? new Date(field.value) : new Date();
    newDate.setHours(hours, minutes, 0, 0);
    field.onChange(newDate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Contest Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contest Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Weekly Challenge #1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP p") : <span>Pick a date and time</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, 'HH:mm') : ''} onChange={(e) => handleTimeChange(field, e.target.value)} />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                   <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP p") : <span>Pick a date and time</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                         <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, 'HH:mm') : ''} onChange={(e) => handleTimeChange(field, e.target.value)} />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={levelFields.map((_, index) => `level-${index}`)} className="space-y-4">
          {levelFields.map((levelItem, levelIndex) => (
            <AccordionItem key={levelItem.id} value={`level-${levelIndex}`} className="border-none">
              <Card>
                <CardHeader className='flex-row items-center justify-between p-4'>
                    <AccordionTrigger className="w-full hover:no-underline p-0">
                        <CardTitle className='text-xl'>Level {levelIndex + 1}</CardTitle>
                    </AccordionTrigger>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLevel(levelIndex)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </CardHeader>
                <AccordionContent className="p-6 pt-0">
                  <LevelForm levelIndex={levelIndex} form={form} />
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => appendLevel({ name: '', timeLimit: 10, questions: [] })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Level
        </Button>

        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : (contest ? 'Save Changes' : 'Create Contest')}
        </Button>
      </form>
    </Form>
  );
}

function LevelForm({ levelIndex, form }: { levelIndex: number; form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `levels.${levelIndex}.questions`,
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`levels.${levelIndex}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Level Name</FormLabel>
            <FormControl><Input placeholder="e.g., Array Fundamentals" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`levels.${levelIndex}.timeLimit`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Limit (minutes)</FormLabel>
            <FormControl><Input type="number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <h3 className="text-lg font-semibold pt-4">Questions</h3>
      {fields.map((questionItem, questionIndex) => (
        <Card key={questionItem.id} className="bg-muted/50">
          <CardHeader className="flex-row items-center justify-between p-4">
            <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(questionIndex)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <FormField
              control={form.control}
              name={`levels.${levelIndex}.questions.${questionIndex}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`levels.${levelIndex}.questions.${questionIndex}.difficulty`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`levels.${levelIndex}.questions.${questionIndex}.category`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input placeholder="e.g., Array, String, DP" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name={`levels.${levelIndex}.questions.${questionIndex}.statement`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Statement</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name={`levels.${levelIndex}.questions.${questionIndex}.constraints`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constraints</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name={`levels.${levelIndex}.questions.${questionIndex}.inputSample`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Input Sample</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name={`levels.${levelIndex}.questions.${questionIndex}.outputSample`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Output Sample</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name={`levels.${levelIndex}.questions.${questionIndex}.hiddenTestCases`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hidden Test Cases</FormLabel>
                  <FormControl><Textarea placeholder='Provide test cases as a JSON string, e.g., [{"input": "[1,2]", "output": "3"}]' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: '', difficulty: 'Easy', category: '', statement: '', constraints: '', inputSample: '', outputSample: '', hiddenTestCases: ''})}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
      </Button>
    </div>
  );
}
