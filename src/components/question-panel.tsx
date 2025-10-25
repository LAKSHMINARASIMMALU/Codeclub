import * as React from 'react';
import type { Level, Question } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type QuestionPanelProps = {
  level: Level;
  activeQuestionId: string;
  onQuestionSelect: (question: Question) => void;
};

// A helper function to parse markdown-like `code` blocks into styled <code> elements.
const formatWithCode = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="font-code bg-muted text-foreground rounded-sm px-1 py-0.5">{part.slice(1, -1)}</code>;
    }
    // Handle newlines within the non-code parts
    return part.split('\n').map((line, lineIndex, arr) => (
      <React.Fragment key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
};

const formatMultilineAsCode = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, index, arr) => (
    <React.Fragment key={index}>
      {line}
      {index < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}


export function QuestionPanel({ level, activeQuestionId, onQuestionSelect }: QuestionPanelProps) {
  const activeQuestion = level.questions.find(q => q.id === activeQuestionId) as Question;
  
  return (
    <div className="flex h-full">
      <nav className="w-20 border-r bg-background p-2">
        <ul className="space-y-2">
          {level.questions.map((q, index) => (
            <li key={q.id}>
              <button
                onClick={() => onQuestionSelect(q)}
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-md text-sm font-medium transition-colors',
                  q.id === activeQuestionId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-secondary'
                )}
              >
                Q{index + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-prose mx-auto">
          <div className="mb-4 flex items-center gap-4">
            <h1 className="text-2xl font-bold font-headline">{activeQuestion.title}</h1>
            <Badge variant={activeQuestion.difficulty === 'Easy' ? 'secondary' : activeQuestion.difficulty === 'Medium' ? 'default' : 'destructive'}>{activeQuestion.difficulty}</Badge>
          </div>
          
          <div className="text-muted-foreground prose prose-sm max-w-none space-y-4">
            {formatWithCode(activeQuestion.statement)}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">Sample Input</p>
              <div className="font-code text-sm bg-muted p-4 rounded-md">
                <pre>{activeQuestion.inputSample}</pre>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">Sample Output</p>
              <div className="font-code text-sm bg-muted p-4 rounded-md">
                <pre>{activeQuestion.outputSample}</pre>
              </div>
            </div>
          </div>

          <h2 className="mt-6 mb-2 text-lg font-semibold font-headline">Constraints</h2>
          <div className="font-code text-sm bg-muted p-4 rounded-md block">
            <ul className="list-disc pl-5 space-y-1">
                {activeQuestion.constraints.split('\n').map((constraint, i) => (
                    <li key={i}>{formatWithCode(constraint)}</li>
                ))}
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
