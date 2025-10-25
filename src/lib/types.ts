export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
};

export type Question = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  statement: string;
  constraints: string;
  inputSample: string;
  outputSample: string;
  hiddenTestCases: string;
};

export type Level = {
  id: string;
  name: string;
  timeLimit: number; // in minutes
  questions: Question[];
};

export type Contest = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  levels: Level[];
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  problemsSolved: number;
  score: number;
  timeTaken: string; 
  warnings: number;
};

export type Submission = {
  id: string;
  userId: string;
  userName: string;
  contestId: string;
  questionId: string;
  questionTitle: string;
  code: string;
  language: string;
  timestamp: Date;
  status: 'Passed' | 'Failed' | 'Pending';
  score: number;
};

export type ProctoringLog = {
  userId: string;
  contestId: string;
  timestamp: number;
  eventType: string;
  details?: Record<string, any>;
};
