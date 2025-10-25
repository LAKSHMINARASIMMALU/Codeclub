'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';
import type { ProctoringLog } from '@/lib/types';
import { analyzeProctoringLogs } from '@/ai/ai-proctoring';
import { useUser } from '@/lib/firebase';

const MAX_WARNINGS = 3;
const PROCTORING_LOGS_KEY = 'proctoring_logs';

export function ProctorMonitor({ children, contestId }: { children: React.ReactNode; contestId: string }) {
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const getLockoutKey = useCallback(() => {
    if (!currentUser) return null;
    return `contest_lockout_${contestId}_${currentUser.id}`;
  }, [currentUser, contestId]);

  useEffect(() => {
    if (currentUser) {
      const lockoutKey = `contest_lockout_${contestId}_${currentUser.id}`;
      const isAlreadyLocked = localStorage.getItem(lockoutKey) === 'true';
      if (isAlreadyLocked) {
        setIsLocked(true);
      }
    }
  }, [contestId, currentUser]);

  const logAndWarn = useCallback((eventType: string, details?: Record<string, any>) => {
    if (!currentUser || isLocked) return;

    const newLog: ProctoringLog = {
      userId: currentUser.id,
      contestId,
      timestamp: Date.now(),
      eventType,
      details,
    };

    const storedLogs = localStorage.getItem(PROCTORING_LOGS_KEY);
    const logs: ProctoringLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    logs.push(newLog);
    localStorage.setItem(PROCTORING_LOGS_KEY, JSON.stringify(logs));

    const newWarningCount = warnings + 1;
    setWarnings(newWarningCount);
    toast({
      variant: 'destructive',
      title: `Warning ${newWarningCount}/${MAX_WARNINGS}: ${eventType}`,
      description: 'Continuing this behavior may result in disqualification.',
    });

  }, [currentUser, contestId, toast, warnings, isLocked]);

  useEffect(() => {
    if (isLocked) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAndWarn('Tab Switch Detected');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        logAndWarn('Right-click Disabled');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))) {
            e.preventDefault();
            logAndWarn('Developer Tools Blocked');
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [logAndWarn, isLocked]);

  useEffect(() => {
    if (warnings >= MAX_WARNINGS && !isLocked) {
      setIsLocked(true);
      const lockoutKey = getLockoutKey();
      if (lockoutKey) {
        localStorage.setItem(lockoutKey, 'true');
      }
      
      if (currentUser) {
        const COMPLETED_CONTESTS_KEY = `completed_contests_${currentUser.id}`;
        const completedContestsStr = localStorage.getItem(COMPLETED_CONTESTS_KEY);
        const completedContests = completedContestsStr ? JSON.parse(completedContestsStr) : [];
        if (!completedContests.includes(contestId)) {
          completedContests.push(contestId);
          localStorage.setItem(COMPLETED_CONTESTS_KEY, JSON.stringify(completedContests));
        }
      }
    }
  }, [warnings, isLocked, contestId, getLockoutKey, currentUser]);

  if (isLocked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Contest Locked</AlertTitle>
          <AlertDescription>
            You have been locked out of this contest due to repeated violations. Your access to this contest has been permanently revoked.
          </AlertDescription>
           <div className="mt-4">
                <Button onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
            </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
