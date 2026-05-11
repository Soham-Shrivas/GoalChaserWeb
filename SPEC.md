# GoalChaser Web - Specification

## Project Overview
- **Name**: GoalChaser Web
- **Type**: Full-stack productivity web application
- **Core**: Track study time, compete on leaderboards, live study rooms, friends, groups
- **Platforms**: Desktop, Mobile, PWA

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Realtime**: Socket.IO + Firebase Realtime
- **Database**: Firestore
- **Storage**: Firebase Storage

## Core Features
1. **Authentication** - Email/password, Google OAuth
2. **Study Timer** - Stopwatch, Pomodoro, subjects, glow effects
3. **Tasks/Todos** - CRUD with subjects, completion tracking
4. **Statistics** - Daily/weekly/monthly charts, heatmap
5. **Friends** - Add, remove, requests, search
6. **Groups** - Create, join, study sessions together
7. **Live Study Rooms** - Real-time collaborative rooms with timers
8. **Leaderboards** - Global, friends, weekly/monthly
9. **Profile** - Avatar, bio, stats
10. **Theme** - Dark/Light mode toggle
11. **Notifications** - Push notifications
12. **Admin Panel** - User management (admin only)

## UI/UX
- Modern dark theme by default
- Light theme option
- Responsive design
- PWA support
- Smooth animations

## Database Schema (Firestore)
- users collection
- sessions collection
- friends collection
- groups collection
- rooms collection
- messages collection
- notifications collection