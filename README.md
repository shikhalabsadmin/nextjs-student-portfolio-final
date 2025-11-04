# Student Portfolio Platform

> A comprehensive web application for students to build academic portfolios and for teachers to manage assignments, review submissions, and provide feedback.

[![Live Application](https://img.shields.io/badge/Live-Application-brightgreen)](https://student-portfolio-shikha-learning-labs.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/shikhalabsadmin/nextjs-student-portfolio-final)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Project Structure](#project-structure)
  - [Code Style](#code-style)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## Overview

The Student Portfolio Platform is an internal educational tool designed to facilitate the complete assignment lifecycle—from creation to submission to review. Students can document their academic work, build portfolios, and track their progress, while teachers can create assignments, provide feedback, and assess student skills.

### Key Capabilities

- **Role-based access control** with distinct interfaces for students, teachers, and administrators
- **Multi-step assignment workflow** with file uploads, rich text editing, and reflection
- **Public portfolio generation** showcasing approved student work
- **Comprehensive feedback system** with skills assessment and verification
- **Single Sign-On integration** with external learning platforms

## Features

### Student Features

- **Assignment Dashboard**: Filter and view assignments by subject, status, and date
- **Multi-step Assignment Forms**: Structured workflow for completing assignments
- **File Management**: Upload images, documents, and link external resources
- **Rich Text Editor**: Format assignment content with advanced editing capabilities
- **Portfolio Builder**: Create public portfolios from approved assignments
- **Profile Management**: Update personal information, grade level, and school details
- **Progress Tracking**: Monitor assignment status and teacher feedback

### Teacher Features

- **Assignment Creation**: Design assignments with questions, instructions, and due dates
- **Submission Review**: Detailed interface for reviewing student work
- **Feedback System**: Provide structured feedback, approve submissions, or request revisions
- **Skills Assessment**: Tag and evaluate skills demonstrated in assignments
- **Analytics Dashboard**: View statistics and insights on student performance
- **Bulk Operations**: Manage multiple assignments and students efficiently

### Administrator Features

- **User Management**: Control user accounts, roles, and permissions
- **System Administration**: Access admin dashboard with comprehensive reports
- **Platform Configuration**: Configure system settings and preferences

### Platform Capabilities

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Immediate status changes and notifications
- **Secure Authentication**: Email/password and SSO support
- **File Storage**: Integrated file upload and management via Supabase Storage

## Tech Stack

### Frontend

- **React 18** - UI library with modern hooks and concurrent features
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Vite** - Fast build tool and development server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library built on Radix UI

### State Management

- **TanStack Query (React Query)** - Server state management and caching
- **React Context API** - Global application state
- **Zustand** - Lightweight state management for client-side state

### Backend & Database

- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Authentication service
  - File storage
  - Real-time subscriptions

### Form Handling & Validation

- **React Hook Form** - Performant form library
- **Zod** - TypeScript-first schema validation

### UI & Editor

- **Radix UI** - Unstyled, accessible component primitives
- **Tiptap** - Rich text editor framework
- **Recharts** - Composable charting library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** 7.x or higher (comes with Node.js)
- **Git** for version control ([Download](https://git-scm.com/))
- **Access to Supabase project** (contact your team lead)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/shikhalabsadmin/nextjs-student-portfolio-final.git
   cd nextjs-student-portfolio-final
   ```

   > **Note**: Repository access is restricted to authorized team members.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PORTFOLIO_SHARED_SECRET=your_shared_secret_for_sso
   ```

   **Obtaining credentials:**
   - Contact your team lead or DevOps team for Supabase credentials
   - Access the company Supabase dashboard (internal access required)
   - Navigate to Settings → API for Project URL and anon key
   - For SSO secret, contact your DevOps administrator

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:8080` to view the application.

### Configuration

#### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes | - |
| `VITE_PORTFOLIO_SHARED_SECRET` | Shared secret for SSO integration | No* | - |

\* Required only if integrating with external learning platforms

> **Security Note**: Never commit `.env` files to version control. The `.gitignore` file excludes environment files by default.

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on `http://localhost:8080` |
| `npm run build` | Build application for production |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

### Project Structure

```
src/
├── api/                  # API service functions and endpoints
│   ├── assignment.ts     # Assignment-related API calls
│   ├── assignment-files.ts  # File management API
│   └── profiles.ts       # User profile API
├── components/           # React components organized by feature
│   ├── admin/           # Admin dashboard components
│   ├── assignment/      # Assignment form and display components
│   ├── auth/            # Authentication components
│   ├── student/         # Student-specific components
│   ├── teacher/         # Teacher-specific components
│   └── ui/              # Reusable UI component library
├── config/              # Application configuration
│   ├── routes.ts        # Route definitions
│   └── roles.ts         # Role configurations
├── constants/           # Application constants and enums
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── integrations/        # Third-party service integrations
│   └── supabase/       # Supabase client configuration
├── lib/                 # Utility libraries and services
│   ├── api/            # API utilities
│   ├── services/       # Business logic services
│   └── utils/          # Helper functions
├── pages/               # Page-level components (routes)
├── query-key/          # React Query key definitions
├── scripts/             # Utility scripts and migrations
├── types/               # TypeScript type definitions
└── utils/               # Application-specific utilities
```

### Code Style

This project follows consistent coding standards:

#### File Naming Conventions

- **Components**: PascalCase (e.g., `StudentDashboard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuthState.ts`)
- **Utilities**: camelCase (e.g., `dateUtils.ts`)
- **Types**: camelCase (e.g., `assignment.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ASSIGNMENT_STATUS.ts`)

#### Component Guidelines

- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for all component props
- Implement error boundaries for error handling
- Follow the existing component patterns in the codebase

#### Code Quality

- Use TypeScript for all new code
- Run `npm run lint` before committing changes
- Use meaningful variable and function names
- Add JSDoc comments for complex business logic
- Handle all edge cases and null/undefined values

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes** thoroughly

4. **Run linting**

   ```bash
   npm run lint
   ```

5. **Commit your changes** with clear, descriptive messages

   ```bash
   git commit -m "feat: add new feature description"
   ```

6. **Push to your branch**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** through the repository interface

### Code Review Process

- All changes require code review before merging
- Follow existing code patterns and conventions
- Write clear commit messages using conventional commits
- Add comments for complex business logic
- Update documentation as needed
- Ensure linting passes before requesting review

## Deployment

### Production Build

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Preview locally** (optional)

   ```bash
   npm run preview
   ```

3. **Deploy**

   The `dist/` folder contains production-ready static files. Deploy this folder to your hosting provider.

### Deployment Platforms

The project includes `vercel.json` configuration for Vercel deployment. Deployment is typically handled by the DevOps team through CI/CD pipelines.

**Live Application**: [https://student-portfolio-shikha-learning-labs.vercel.app/](https://student-portfolio-shikha-learning-labs.vercel.app/)

**Important**: Always configure environment variables in your hosting platform's dashboard before deploying. Contact your team lead for production credentials.

## Troubleshooting

### Port Already in Use

**Problem**: Port 8080 is already in use.

**Solution**: 
- Stop the process using port 8080, or
- Change the port in `vite.config.ts`:

  ```typescript
  server: {
    port: 3000, // Change to available port
  }
  ```

### Supabase Connection Errors

**Problem**: Failed to connect to Supabase.

**Solutions**:
- Verify environment variables are set correctly in `.env`
- Check that your Supabase project is active
- Ensure your IP address is allowed (if IP restrictions are enabled)
- Verify network connectivity

### Build Errors

**Problem**: TypeScript or build errors.

**Solutions**:
- Run `npm run lint` to identify specific issues
- Ensure all TypeScript types are properly defined
- Verify all dependencies are installed: `npm install`
- Check for missing environment variables

### Authentication Issues

**Problem**: Login fails or user role not found.

**Solutions**:
- Verify Supabase credentials are correct
- Check that the user has a profile in the database
- Clear browser cache and localStorage
- Verify user role is set correctly in the profiles table

### Module Not Found Errors

**Problem**: Import errors or module resolution issues.

**Solutions**:
- Ensure all dependencies are installed: `npm install`
- Check that file paths use the `@/` alias correctly
- Verify TypeScript path mappings in `tsconfig.json`
- Restart the development server

## Support

For technical issues, questions, or access requests:

- **Team Lead**: Contact your team lead or project manager
- **Development Team**: Reach out via internal communication channels
- **Documentation**: Check the project documentation in the internal wiki
- **Production Issues**: Follow the company's incident management process for urgent production issues

---

**Internal Project - Shikha Learning Labs**

For repository access or additional information, contact your team lead.

