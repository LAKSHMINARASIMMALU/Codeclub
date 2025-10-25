
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Layers } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Contest } from '@/lib/types';
import { useUser } from '@/lib/firebase';
import { listenToContests } from '@/lib/contestService';

export default function DashboardPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [completedContests, setCompletedContests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useUser();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const unsubscribe = listenToContests((contestsData) => {
      setContests(contestsData);
      setLoading(false);
    });
    
    // Update the current time every second
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const COMPLETED_CONTESTS_KEY = `completed_contests_${currentUser.id}`;
      const storedCompleted = localStorage.getItem(COMPLETED_CONTESTS_KEY);
      const allCompleted = storedCompleted ? JSON.parse(storedCompleted) : [];
      setCompletedContests(allCompleted);
    }
  }, [currentUser]);


  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold font-headline mb-6">Contests</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Contests</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contests.map((contest) => {
            const isCompleted = completedContests.includes(contest.id);
            const hasStarted = now >= contest.startTime;
            const hasEnded = now > contest.endTime;
            const isRunning = hasStarted && !hasEnded;
            
            const isDisabled = isCompleted || !isRunning;

            let buttonText = 'View Contest';
            let descriptionText = `Starts ${formatDistanceToNow(contest.startTime, { addSuffix: true })}`;

            if (isCompleted) {
                buttonText = 'Contest Ended';
                descriptionText = 'You have completed this contest.';
            } else if (hasEnded) {
                buttonText = 'Contest Ended';
                descriptionText = 'This contest has ended.';
            } else if (isRunning) {
                buttonText = 'Join Contest';
                descriptionText = `Ends ${formatDistanceToNow(contest.endTime, { addSuffix: true })}`;
            }


            return (
              <Card key={contest.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline">{contest.title}</CardTitle>
                  <CardDescription>
                    {descriptionText}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(contest.startTime, 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(contest.startTime, 'p')} - {format(contest.endTime, 'p')}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>{contest.levels.length} Levels</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                   <Button className="w-full" asChild={!isDisabled} disabled={isDisabled}>
                    {isDisabled ? (
                      <span>{buttonText}</span>
                    ) : (
                      <Link href={`/contest/${contest.id}`}>{buttonText}</Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
        })}
      </div>
    </div>
  );
}
