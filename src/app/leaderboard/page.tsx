'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import type { Submission, LeaderboardEntry, User, Contest, ProctoringLog } from '@/lib/types';
import { formatDistanceStrict } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase/config';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const SUBMISSIONS_STORAGE_KEY = 'submissions';
const USERS_STORAGE_KEY = 'users';
const PROCTORING_LOGS_KEY = 'proctoring_logs';

const calculateLeaderboard = (submissions: Submission[], users: User[], proctoringLogs: ProctoringLog[]): LeaderboardEntry[] => {
  const userAggregates: { [userId: string]: { score: number, problemsSolved: Set<string>, firstSubmissionTime: Date | null, lastPassedSubmissionTime: Date | null, warnings: number } } = {};

  const attendedUserIds = new Set(submissions.map(s => s.userId));

  users.forEach(user => {
    if (user.role === 'student' && attendedUserIds.has(user.id)) {
      userAggregates[user.id] = { score: 0, problemsSolved: new Set(), firstSubmissionTime: null, lastPassedSubmissionTime: null, warnings: 0 };
    }
  });

  Object.keys(userAggregates).forEach(userId => {
    const userSubmissions = submissions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (userSubmissions.length > 0) {
      userAggregates[userId].firstSubmissionTime = new Date(userSubmissions[0].timestamp);
      
      const passedSubmissions = userSubmissions.filter(s => s.status === 'Passed');
      if (passedSubmissions.length > 0) {
          const lastPassedSubmission = passedSubmissions[passedSubmissions.length - 1];
          userAggregates[userId].lastPassedSubmissionTime = new Date(lastPassedSubmission.timestamp);
      }
    }

    const questionSubmissions: { [questionId: string]: Submission[] } = {};
    userSubmissions.forEach(s => {
      if (!questionSubmissions[s.questionId]) {
        questionSubmissions[s.questionId] = [];
      }
      questionSubmissions[s.questionId].push(s);
    });

    let totalScore = 0;
    const questionsSolved = new Set<string>();

    Object.values(questionSubmissions).forEach(subs => {
      const lastSubmission = subs[subs.length - 1];
      if (lastSubmission.status === 'Passed') {
        questionsSolved.add(lastSubmission.questionId);
      }
      totalScore += lastSubmission.score;
    });

    userAggregates[userId].score = totalScore;
    userAggregates[userId].problemsSolved = questionsSolved;

    const userWarnings = proctoringLogs.filter(log => log.userId === userId);
    userAggregates[userId].warnings = userWarnings.length;
  });

  const leaderboardData = Object.entries(userAggregates).map(([userId, data]) => {
    const user = users.find(u => u.id === userId);
    let timeTaken = '-';
    if (data.firstSubmissionTime && data.lastPassedSubmissionTime) {
      timeTaken = formatDistanceStrict(data.lastPassedSubmissionTime, data.firstSubmissionTime);
    }

    return {
      rank: 0,
      userId,
      userName: user ? user.name : 'Unknown User',
      problemsSolved: data.problemsSolved.size,
      score: data.score,
      timeTaken: timeTaken,
      warnings: data.warnings,
    };
  });

  leaderboardData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
    // Add timeTaken as a tie-breaker if scores and problems solved are equal
    if (a.timeTaken !== '-' && b.timeTaken !== '-') {
        // A simple string comparison might not be ideal, but for formatDistanceStrict it works for sorting
        return a.timeTaken.localeCompare(b.timeTaken);
    }
    return 0;
  });

  return leaderboardData.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [contests, setContests] = useState<Contest[]>([]);
    const [selectedContest, setSelectedContest] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        const q = query(collection(db, 'contests'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allContests: Contest[] = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                allContests.push({
                    id: doc.id,
                    ...data,
                    startTime: (data.startTime as Timestamp).toDate(),
                    endTime: (data.endTime as Timestamp).toDate(),
                } as Contest);
            });
            setContests(allContests);
            if (allContests.length > 0 && !selectedContest) {
                setSelectedContest(allContests[0].id);
            }
        });

        return () => unsubscribe();
    }, [selectedContest]);

    useEffect(() => {
        if (!isClient || !selectedContest) return;

        const storedSubmissions = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
        const allSubmissions: Submission[] = storedSubmissions ? JSON.parse(storedSubmissions).map((s:any) => ({...s, timestamp: new Date(s.timestamp)})) : [];
        
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

        const storedLogs = localStorage.getItem(PROCTORING_LOGS_KEY);
        const allLogs: ProctoringLog[] = storedLogs ? JSON.parse(storedLogs) : [];

        const contestSubmissions = allSubmissions.filter(s => s.contestId === selectedContest);
        const contestLogs = allLogs.filter(log => log.contestId === selectedContest);
        
        const leaderboardData = calculateLeaderboard(contestSubmissions, users, contestLogs);
        setLeaderboard(leaderboardData);

    }, [isClient, selectedContest]);

    if (!isClient) {
        return <div>Loading leaderboard...</div>;
    }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline">Leaderboard</h1>
        <div className="w-64">
            <Select onValueChange={setSelectedContest} value={selectedContest || ''}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a contest" />
                </SelectTrigger>
                <SelectContent>
                {contests.map(contest => (
                    <SelectItem key={contest.id} value={contest.id}>
                    {contest.title}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contest Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Problems Solved</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time Taken</TableHead>
                <TableHead>Warnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {entry.rank <= 3 && <Trophy className={`h-4 w-4 ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' :
                      'text-yellow-700'
                    }`} />}
                    {entry.rank}
                  </TableCell>
                  <TableCell>{entry.userName}</TableCell>
                  <TableCell>{entry.problemsSolved}</TableCell>
                  <TableCell>{entry.score}</TableCell>
                  <TableCell>{entry.timeTaken}</TableCell>
                  <TableCell>{entry.warnings}</TableCell>
                </TableRow>
              ))}
              {leaderboard.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No submissions for this contest yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
