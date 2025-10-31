
'use client';

import { useState, useEffect } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Play, UploadCloud } from 'lucide-react';
import type { Question, Submission, User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Editor from "@monaco-editor/react";
import axios from 'axios';

const languages: Record<string, { id: number; name: string }> = {
    'python': { id: 71, name: 'Python (3.8.1)' },
    'java': { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    'c': { id: 50, name: 'C (GCC 9.2.0)' },
    'cpp': { id: 54, name: 'C++ (GCC 9.2.0)' },
    'javascript': { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
};

const defaultCode: Record<string, string> = {
    python: `# Happy coding!
import sys

def solve():
  # Read from stdin, write to stdout
  pass

solve()
`,
    java: `// Happy coding!
import java.util.Scanner;

class Solution {
  public static void main(String[] args) {
    // Read from stdin, write to stdout
    Scanner sc = new Scanner(System.in);
  }
}`,
    cpp: `// Happy coding!
#include <iostream>
#include <string>

int main() {
  // Read from stdin, write to stdout
  return 0;
}`,
    c: `// Happy coding!
#include <stdio.h>

int main() {
  // Read from stdin, write to stdout
  return 0;
}`,
    javascript: `// Happy coding!
function solve() {
    // Read from stdin, write to stdout
}

solve();
`
};

const SUBMISSIONS_STORAGE_KEY = 'submissions';
const TOTAL_SCORE_PER_QUESTION = 50;

type CodeEditorProps = {
  question: Question;
  contestId: string;
  user: User;
}

type TestResult = {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    error?: string | null;
};

// Construct the Cloud Function URL from environment variables
const cloudFunctionUrl = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/evaluateCode`;


export function CodeEditor({ question, contestId, user }: CodeEditorProps) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(defaultCode['python']);
  const [output, setOutput] = useState('Click "Run Sample" to see the output here.');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState('output');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCode(defaultCode[language] || '');
  }, [language, question]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  }

  const runCodeWithCloudFunction = async (codeToRun: string, input: string) => {
    try {
        const response = await axios.post(cloudFunctionUrl, {
            languageId: languages[language].id,
            sourceCode: codeToRun,
            input: input,
            userId: user.id,
            contestId: contestId,
            questionId: question.id,
            questionTitle: question.title,
        });

        const { result } = response.data;
        if (result.status.id > 2) { // Not "In Queue" or "Processing"
            const errorOutput = result.stderr || result.compile_output;
            if (errorOutput) return { error: atob(errorOutput), output: null };
        }
        return { error: null, output: result.stdout ? atob(result.stdout) : '' };

    } catch (error: any) {
        console.error("Error calling cloud function:", error);
        const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to execute code.';
        return { error: errorMessage, output: null };
    }
  }


  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setOutput(`Running code with sample input...\n\nInput:\n${question.inputSample}`);
    
    const result = await runCodeWithCloudFunction(code, question.inputSample);

    if (result.error) {
      setOutput(`Execution failed:\n\n${result.error}`);
    } else {
      setOutput(`Execution Output:\n\n${result.output}`);
    }
    
    setIsRunning(false);
  }

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setOutput('Submitting and running hidden test cases...');
    setTestResults([]);
    setActiveTab('tests');

    let submissionStatus: 'Passed' | 'Failed' | 'Pending' = 'Pending';
    let calculatedScore = 0;
    let testCases: { input: any; output: any }[];
    
    try {
      try {
        testCases = JSON.parse(question.hiddenTestCases || '[]');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Configuration Error',
          description: 'The hidden test cases for this question are formatted incorrectly. Please contact an admin.',
        });
        setIsSubmitting(false);
        return;
      }
        
      if (testCases.length === 0) {
          toast({
              variant: 'destructive',
              title: 'No Test Cases',
              description: 'This question has no hidden test cases configured.',
          });
          setIsSubmitting(false);
          return;
      }

      let passedCount = 0;
      const results: TestResult[] = [];
      for (const tc of testCases) {
          const expectedOutput = String(tc.output).trim();
          const result = await runCodeWithCloudFunction(code, String(tc.input));
          
          const actualOutput = result.output ? result.output.trim() : null;
          const passes = !result.error && actualOutput === expectedOutput;

          if (passes) {
              passedCount++;
          }
          results.push({
              passed: passes,
              input: String(tc.input),
              expected: expectedOutput,
              actual: actualOutput ?? "No output",
              error: result.error
          });
      }
      setTestResults(results);
      
      if (passedCount === testCases.length) {
        submissionStatus = 'Passed';
        calculatedScore = TOTAL_SCORE_PER_QUESTION;
         toast({
          title: "Submission successful!",
          description: "All hidden test cases passed.",
        });
      } else {
          submissionStatus = 'Failed';
          calculatedScore = Math.round((passedCount / testCases.length) * TOTAL_SCORE_PER_QUESTION);
           toast({
              variant: 'destructive',
              title: "Submission failed",
              description: `${passedCount} out of ${testCases.length} test cases passed.`,
          });
      }

    } catch (error: any) {
      console.error("Submission error:", error);
      setOutput('An error occurred during submission.');
      submissionStatus = 'Failed';
      calculatedScore = 0;
       toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "Could not process submission due to an error.",
        });
    } finally {
        setIsSubmitting(false);
    }

    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      contestId: contestId,
      questionId: question.id,
      questionTitle: question.title,
      code: code,
      language: language,
      timestamp: new Date(),
      status: submissionStatus,
      score: calculatedScore,
    };

    // This now primarily relies on the cloud function saving to Firestore,
    // but we can keep localStorage as a fallback or for quick UI updates.
    const storedSubmissions = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const submissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
    submissions.push(newSubmission);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  }


  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex shrink-0 items-center justify-between border-b p-2">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languages).map(([key, lang]) => (
              <SelectItem key={key} value={key} className="capitalize">{lang.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleRunCode} disabled={isRunning || isSubmitting}>
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? 'Running...' : 'Run Sample'}
            </Button>
            <Button onClick={handleSubmitCode} disabled={isSubmitting || isRunning}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </div>
      </div>
      
      <PanelGroup direction="vertical">
        <Panel defaultSize={60} minSize={20}>
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme='vs-dark'
             />
        </Panel>
        <PanelResizeHandle className="flex h-2 items-center justify-center bg-muted transition-colors hover:bg-muted-foreground/20 active:bg-muted-foreground/30">
            <div className="h-1 w-10 rounded-full bg-border" />
        </PanelResizeHandle>
        <Panel defaultSize={40} minSize={20}>
            <div className="flex-grow border-t h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                    <TabsList className="shrink-0 justify-start rounded-none border-b bg-card px-4">
                        <TabsTrigger value="output">Output</TabsTrigger>
                        <TabsTrigger value="tests">Test Results</TabsTrigger>
                    </TabsList>
                    <TabsContent value="output" className="mt-0 flex-grow overflow-y-auto">
                        <pre className="p-4 font-code text-sm whitespace-pre-wrap bg-black text-white h-full">{output}</pre>
                    </TabsContent>
                    <TabsContent value="tests" className="mt-0 flex-grow relative">
                      <ScrollArea className="absolute inset-0">
                          <div className="p-4">
                              {isSubmitting && testResults.length === 0 ? <p className="text-muted-foreground">Running hidden test cases...</p> : null}
                              {!isSubmitting && testResults.length === 0 ? <p className="text-muted-foreground">Submission results will appear here.</p> : null}
                              {testResults.length > 0 && (
                              <div className="space-y-4">
                                  {testResults.map((result, index) => (
                                      <div key={index} className={`rounded-md border p-3 ${result.passed ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                          <div className="flex items-center justify-between mb-2">
                                              <h3 className="flex items-center gap-2 font-semibold">
                                                  {result.passed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                                  Test Case {index + 1}
                                              </h3>
                                              <span className={`text-sm font-bold ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                                                  {result.passed ? 'Passed' : 'Failed'}
                                              </span>
                                          </div>
                                          <div className="font-code text-xs space-y-2">
                                            <div>
                                              <p className="font-medium text-muted-foreground">Input:</p>
                                              <pre className="p-2 bg-black/30 rounded-sm mt-1">{result.input}</pre>
                                            </div>
                                            {result.error ? (
                                                <div>
                                                    <p className="font-medium text-red-400">Error:</p>
                                                    <pre className="p-2 bg-red-900/50 rounded-sm mt-1 whitespace-pre-wrap">{result.error}</pre>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                    <p className="font-medium text-muted-foreground">Expected Output:</p>
                                                    <pre className="p-2 bg-black/30 rounded-sm mt-1">{result.expected}</pre>
                                                    </div>
                                                    <div>
                                                    <p className="font-medium text-muted-foreground">Your Output:</p>
                                                    <pre className={`p-2 rounded-sm mt-1 ${result.passed ? 'bg-black/30' : 'bg-red-900/50'}`}>{result.actual}</pre>
                                                    </div>
                                                </>
                                            )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              )}
                          </div>
                      </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

    