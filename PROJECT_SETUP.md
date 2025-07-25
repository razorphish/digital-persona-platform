# Digital Persona Platform - Modern Stack Setup

## 🏗️ Architecture Overview

This is a modern full-stack Digital Persona Platform built with:

### Frontend (Next.js App)

- **Next.js 14** with App Router
- **React 18** with TypeScript
- **tRPC** for type-safe API calls
- **Tailwind CSS** for styling
- **Better Auth** for authentication
- **React Hook Form** for form handling
- **Tanstack Query** for data fetching

### Backend (tRPC Server)

- **tRPC** for type-safe API
- **Express.js** server
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Better Auth** for authentication
- **JWT** for session management

### Database & ORM

- **PostgreSQL** for production
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for migrations

## 📁 Project Structure

```
digital-persona-platform/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/         # Next.js app router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/         # Utilities and configurations
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── server/              # tRPC backend server
│       ├── src/
│       │   ├── router.ts    # tRPC routes and procedures
│       │   └── index.ts     # Express server setup
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/            # Drizzle ORM schema and database config
│   │   ├── src/
│   │   │   ├── schema.ts    # Database schema definitions
│   │   │   └── index.ts     # Database connection
│   │   └── drizzle.config.ts
│   │
│   └── shared/              # Shared types and validation schemas
│       ├── src/
│       │   ├── types.ts     # Shared TypeScript types
│       │   └── index.ts
│       └── package.json
│
├── package.json             # Root workspace configuration
├── turbo.json              # Turbo build system configuration
└── PROJECT_SETUP.md       # This file
```

## 🚀 Features

### Completed Components

1. **User Authentication System**

   - Registration and login with Better Auth
   - JWT-based session management
   - Protected routes and middleware

2. **Database Schema (Drizzle ORM)**

   - Users table with authentication
   - Personas table for digital persona management
   - Chat conversations and messages
   - Social media connections and posts
   - Persona learning data from various sources

3. **tRPC API Routes**

   - Authentication (register, login, me)
   - Personas (CRUD operations)
   - Chat (conversations and messages)
   - Social media (connections management)

4. **Frontend Pages & Components**
   - Landing page with modern design
   - Authentication pages (login/register)
   - Dashboard page (to be implemented)
   - Chat interface (to be implemented)
   - Social media integration (to be implemented)

### Planned Features

1. **Dashboard Page**

   - Overview of user's personas
   - Quick access to chat and social features
   - Personality insights dashboard

2. **Chat Mechanism**

   - Real-time conversations with personas
   - AI-powered responses for persona building
   - Message history and context

3. **Social Media Integration**

   - Connect Twitter, Instagram, Facebook, LinkedIn, TikTok
   - Import posts and interactions
   - Automatic persona learning from social data

4. **Persona Management**
   - Create and customize digital personas
   - View personality traits and preferences
   - Edit and refine persona characteristics

## 📋 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

### 1. Install Dependencies

```bash
# Install root dependencies and workspace packages
npm install

# This will install dependencies for all apps and packages
```

### 2. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE digital_persona;
```

2. Set up environment variables in each app:

**apps/web/.env.local:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/digital_persona"
BETTER_AUTH_SECRET="your-better-auth-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_TRPC_URL="http://localhost:3001"
```

**apps/server/.env:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/digital_persona"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

**packages/database/.env:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/digital_persona"
```

### 3. Database Migration

```bash
# Generate and run database migrations
cd packages/database
npm run db:push
```

### 4. Start Development Servers

```bash
# Start all services in development mode
npm run dev

# Or start individual services:
# Frontend: npm run dev --workspace=apps/web
# Backend: npm run dev --workspace=apps/server
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **tRPC API**: http://localhost:3001/api/trpc
- **Health Check**: http://localhost:3001/health

## 🔧 Development Commands

```bash
# Build all packages
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Clean build artifacts
npm run clean

# Database operations
npm run db:push      # Push schema changes
npm run db:migrate   # Generate migrations
npm run db:studio    # Open Drizzle Studio
```

## 🗄️ Database Schema

### Core Tables

1. **users** - User accounts and authentication
2. **sessions** - Better Auth session management
3. **accounts** - Social login accounts
4. **personas** - User's digital personas
5. **conversations** - Chat conversations
6. **messages** - Chat messages
7. **social_connections** - Connected social media accounts
8. **social_posts** - Imported social media posts
9. **persona_learning_data** - AI insights from various sources

### Key Relationships

- Users have many personas
- Personas have many conversations
- Conversations have many messages
- Users have many social connections
- Social connections have many posts
- Personas have learning data from multiple sources

## 🔐 Authentication Flow

1. User registers/logs in via Better Auth
2. JWT token generated for API access
3. Frontend stores token in localStorage
4. Backend validates token on protected routes
5. User session maintained across requests

## 🎨 UI Components

The frontend uses a modern component library built with:

- Tailwind CSS for styling
- CSS variables for theming
- Responsive design patterns
- Accessible components

## 🔄 API Integration

The frontend communicates with the backend through:

- tRPC for type-safe API calls
- React Query for caching and state management
- Automatic type inference from backend to frontend
- Error handling and loading states

## 🚀 Deployment

### Frontend (Vercel/Netlify)

- Build command: `npm run build`
- Output directory: `apps/web/.next`

### Backend (Railway/Heroku/VPS)

- Build command: `npm run build`
- Start command: `npm start`
- Port: Environment variable `PORT`

### Database (PostgreSQL)

- Any PostgreSQL provider (Supabase, Railway, etc.)
- Run migrations: `npm run db:push`

## 🔧 Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `BETTER_AUTH_SECRET` - Better Auth secret key

### Optional Variables

- `OPENAI_API_KEY` - For AI-powered features
- `TWITTER_API_KEY` - For Twitter integration
- `INSTAGRAM_CLIENT_ID` - For Instagram integration

## 📚 Technology Decisions

### Why tRPC?

- End-to-end type safety
- No code generation required
- Excellent TypeScript integration
- Built-in React Query integration

### Why Drizzle ORM?

- Type-safe database operations
- Lightweight and fast
- Great TypeScript support
- SQL-like syntax

### Why Better Auth?

- Modern authentication solution
- Built-in security features
- Social login support
- TypeScript-first approach

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **TypeScript Errors**

   - Run `npm run type-check` to see all errors
   - Ensure all dependencies are installed
   - Check import paths are correct

3. **tRPC Connection Issues**
   - Verify backend server is running on port 3001
   - Check CORS configuration
   - Ensure frontend points to correct API URL

## 🤝 Contributing

1. Create feature branch from main
2. Implement changes with TypeScript
3. Add tests if applicable
4. Submit pull request

## 📄 License

This project is private and proprietary.

---

This modern stack provides a solid foundation for building AI-powered digital persona applications with excellent developer experience and type safety throughout the entire stack.
