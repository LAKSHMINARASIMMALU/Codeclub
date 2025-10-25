'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { User, Contest, Submission } from '@/lib/types';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

const SUBMISSIONS_STORAGE_KEY = 'submissions';


export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeContestsCount, setActiveContestsCount] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const fetchUsers = async () => {
        const querySnapshot = await getDocs(collection(db, 'users'));
        setTotalUsers(querySnapshot.size);
    };

    const fetchContests = async () => {
        const querySnapshot = await getDocs(collection(db, 'contests'));
        const now = new Date();
        const active = querySnapshot.docs
            .map(doc => ({...doc.data(), endTime: (doc.data().endTime as Timestamp).toDate()}))
            .filter(c => c.endTime > now).length;
        setActiveContestsCount(active);
    };

    const fetchSubmissions = () => {
        const storedSubmissions = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
        if (storedSubmissions) {
            const parsedSubmissions = JSON.parse(storedSubmissions).map((s: any) => ({...s, timestamp: new Date(s.timestamp)}));
            setSubmissions(parsedSubmissions);
        }
    };
    
    fetchUsers();
    fetchContests();
    fetchSubmissions();

  }, []);

  const totalSubmissions = submissions.length;
  const passRate = totalSubmissions > 0 ? (submissions.filter(s => s.status === 'Passed').length / totalSubmissions * 100).toFixed(0) : 0;

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContestsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Pass Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5).map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.userName}</TableCell>
                  <TableCell>{submission.questionTitle}</TableCell>
                  <TableCell>{submission.status}</TableCell>
                  <TableCell>{format(submission.timestamp, 'Pp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
