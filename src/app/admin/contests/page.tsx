
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Calendar, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Contest } from '@/lib/types';
import { listenToContests, deleteContest } from '@/lib/contestService';
import { useToast } from '@/hooks/use-toast';

function ContestPageContent() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = listenToContests((contestsData) => {
      setContests(contestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteContest = async (contestId: string) => {
    if (window.confirm('Are you sure you want to delete this contest?')) {
        try {
            await deleteContest(contestId);
            toast({
                title: 'Contest Deleted',
                description: 'The contest has been successfully removed.',
            })
        } catch (error) {
            console.error("Error removing document: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the contest.',
            })
        }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline">Contest Management</h1>
        <Button asChild>
          <Link href="/admin/contests/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Contest
          </Link>
        </Button>
      </div>

      {contests.length === 0 ? (
        <p>No contests found. Create one to get started!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <Card key={contest.id}>
              <CardHeader>
                <CardTitle className="font-headline">{contest.title}</CardTitle>
                <CardDescription>
                  {format(new Date(contest.startTime), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(contest.startTime), 'p')} - {format(new Date(contest.endTime), 'p')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{contest.levels.length} levels, {contest.levels.reduce((acc, level) => acc + level.questions.length, 0)} questions</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/admin/contests/${contest.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteContest(contest.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminContestsPage() {
  return <ContestPageContent />;
}
