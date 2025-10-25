# **App Name**: CodeDuel Pro

## Core Features:

- Secure Authentication: Firebase Authentication implementation for both admin (fixed credentials) and student (email/password) roles with role-based access control.
- Contest Management: Admin panel for creating, editing, and deleting coding contests. Dynamic addition of questions with title, difficulty, problem statement, constraints, input/output samples, hidden test cases, and category, leveraging Firestore to store contest data.
- Real-time Proctoring with AI: The proctoring system identifies and reports on potential cheating using AI. LLMs determine if specific logged behaviors (like rapid tab switching or specific keyboard inputs) are statistically anomalous. Any potentially questionable behaviors, the responsible code, and time will be sent to the admin.
- Live Code Execution: Integrated Monaco Editor with support for multiple languages, offering real-time code execution and compilation via Judge0 or Firebase Cloud Functions.
- Automated Progression: The timer continues to work accurately, even across reloads and tab closing, to keep student on track. Submission happen when time ends.
- Real-Time Leaderboard: Dynamic leaderboard that updates live using Firestore, ranking participants by problems solved, time taken, and penalties incurred.
- Submission Tracking: Tracks and saves user submissions, as well as proctoring data.

## Style Guidelines:

- Primary color: Saturated blue (#4285F4) to evoke a sense of trust and reliability, mirroring a professional coding environment.
- Background color: Light gray (#F5F5F5) to ensure readability and reduce eye strain during long coding sessions.
- Accent color: Vibrant orange (#FF9800) to highlight important elements and CTAs, providing a clear visual contrast.
- Body text: 'Inter' sans-serif, for a clean, modern, highly readable, neutral style, well-suited for both the code editor and interface.
- Headlines: 'Space Grotesk' sans-serif, for short descriptive text labels throughout the UI. Space Grotesk gives off a computerized techy feel and vibe well.
- Code Font: 'Source Code Pro' monospace, designed for code display for enhanced readability, suitable for code snippets and blocks within documentation.
- Crisp and professional icon set that is intuitive and consistent for navigation and actions.
- Split-screen layout with a left panel for problem statements and a right panel for the code editor, optimizing screen real estate.
- Subtle transitions and animations to enhance user experience, such as level unlocks or successful submission confirmations.