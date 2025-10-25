'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProctorMonitor } from '@/components/proctor-monitor';
import { QuestionPanel } from '@/components/question-panel';
import { CodeEditor } from '@/components/code-editor';
import { Logo } from '@/components/logo';
import { Timer } from '@/components/timer';
import { Button } from '@/components/ui/button';
import { ChevronsRight, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Contest, Question } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from '@/lib/firebase';

export default function ContestClientPage({ contest }: { contest: Contest }) {
  const router = useRouter();
  const { user: currentUser, loading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [router, currentUser, loading]);

  // For demonstration, we'll use the first level.
  const currentLevel = contest.levels[0];
  
  // State to manage the active question
  const [activeQuestion, setActiveQuestion] = useState<Question>(currentLevel.questions[0]);

  const endTime = new Date(new Date().getTime() + currentLevel.timeLimit * 60000);

  const handleEndContest = () => {
    if (!currentUser) return;
    const COMPLETED_CONTESTS_KEY = `completed_contests_${currentUser.id}`;
    const completedContestsStr = localStorage.getItem(COMPLETED_CONTESTS_KEY);
    const completedContests = completedContestsStr ? JSON.parse(completedContestsStr) : [];
    if (!completedContests.includes(contest.id)) {
      completedContests.push(contest.id);
      localStorage.setItem(COMPLETED_CONTESTS_KEY, JSON.stringify(completedContests));
    }
    router.push('/dashboard');
  };

  if (!isClient || loading || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <ProctorMonitor contestId={contest.id}>
      <div className="flex h-screen flex-col bg-card">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 shrink-0">
          <Logo />
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentLevel.name}</Badge>
                <Badge variant="outline">{activeQuestion.difficulty}</Badge>
            </div>
            <Timer endTime={endTime} />
            <Button size="sm" variant="secondary">
              Next Level <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" /> End Contest
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to end the contest?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your progress will be saved, but you will not be able to re-enter this contest.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndContest}>End Contest</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        <main className="grid flex-1 grid-cols-1 md:grid-cols-2 overflow-hidden">
          <QuestionPanel 
            level={currentLevel} 
            activeQuestionId={activeQuestion.id}
            onQuestionSelect={setActiveQuestion}
          />
          <CodeEditor 
            question={activeQuestion} 
            contestId={contest.id}
            user={currentUser}
          />
        </main>
      </div>
    </ProctorMonitor>
  );
}
