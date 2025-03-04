# Student Portfolio Analyzer

A comprehensive platform for students to document, reflect, and showcase their academic work. This application allows students to build portfolios of their academic achievements, while teachers can manage assignments and verify student submissions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Code Style and Linting](#code-style-and-linting)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Role-based Access Control**: Different interfaces for students, teachers, and administrators
- **Student Dashboard**: Track assignments, submissions, and portfolio progress
- **Teacher Tools**: Create assignments, verify submissions, and manage student work
- **Portfolio Creation**: Students can document and showcase their academic achievements
- **Assignment Management**: Create, edit, and track assignments with deadlines
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

This project is built with modern web technologies:

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query and Context API
- **Routing**: React Router
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Charts & Visualization**: Recharts

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd nextjs-student-portfolio-final

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔐 Authentication

The application uses Supabase for authentication with a custom role selection flow:

1. User signs up/signs in
2. System checks for user role
3. If no role exists, shows role selection modal
4. After role selection:
   - Students → /dashboard
   - Teachers → /assignments

### Key Authentication Files

- `src/integrations/supabase/client.ts` - Supabase client configuration
- `src/hooks/useAuthState.ts` - Central auth state management
- `src/components/auth/RoleSelectionModal.tsx` - Role selection UI
- `src/components/AppRoutes.tsx` - Route protection and role-based navigation

## 📁 Project Structure

The application follows a feature-based structure:

- `src/components/` - Reusable UI components
- `src/pages/` - Page components for different routes
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and helpers
- `src/integrations/` - Third-party service integrations
- `src/types/` - TypeScript type definitions

## 📡 API Documentation

The application uses Supabase as its backend, with the following key API endpoints:

### Authentication

- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Sign in an existing user
- `POST /auth/signout` - Sign out the current user

### Assignments

- `GET /assignments` - List all assignments (filtered by role)
- `GET /assignments/:id` - Get a specific assignment
- `POST /assignments` - Create a new assignment
- `PUT /assignments/:id` - Update an assignment
- `DELETE /assignments/:id` - Delete an assignment

### Submissions

- `GET /submissions` - List all submissions for a user
- `GET /submissions/:id` - Get a specific submission
- `POST /submissions` - Create a new submission
- `PUT /submissions/:id` - Update a submission

### Profiles

- `GET /profiles/:id` - Get a user profile
- `PUT /profiles/:id` - Update a user profile

## 💾 Database Schema

The application uses the following main tables in Supabase:

### Users

- `id` - Primary key
- `email` - User email
- `created_at` - Account creation timestamp

### Profiles

- `id` - Primary key (references users.id)
- `role` - User role (STUDENT, TEACHER, ADMIN)
- `first_name` - User's first name
- `last_name` - User's last name
- `bio` - User biography

### Assignments

- `id` - Primary key
- `title` - Assignment title
- `description` - Assignment description
- `due_date` - Submission deadline
- `created_by` - Teacher who created the assignment
- `created_at` - Creation timestamp

### Submissions

- `id` - Primary key
- `assignment_id` - References assignments.id
- `student_id` - References profiles.id
- `content` - Submission content
- `status` - Submission status (DRAFT, SUBMITTED, VERIFIED)
- `submitted_at` - Submission timestamp

## 🧪 Testing

The project uses Vitest for unit and integration testing.

### Running Tests

```sh
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- `src/tests/` - Contains all test files
- `*.test.tsx` - Component tests
- `*.test.ts` - Utility and hook tests

## 📏 Code Style and Linting

This project uses ESLint and Prettier for code quality and formatting.

### Linting

```sh
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

### Formatting

```sh
# Format code with Prettier
npm run format
```

### VS Code Integration

The project includes recommended VS Code settings and extensions in `.vscode/` to ensure consistent code style across the team.

## 📤 Deployment

### Deployment Options

You can deploy this application using various platforms such as:

- Vercel
- Netlify
- AWS Amplify
- GitHub Pages

### Custom Domain

To use a custom domain, you can configure it through your chosen deployment platform. Most platforms provide straightforward options for connecting your domain.

## ❓ Troubleshooting

### Common Issues

#### Authentication Issues

**Problem**: "User role not found" error after login.

**Solution**: Check if the user has a profile in the `profiles` table with a valid role. You may need to manually add a role or reset the user's account.

#### Supabase Connection Issues

**Problem**: "Failed to connect to Supabase" error.

**Solution**: Verify your environment variables are correctly set in the `.env` file and that your Supabase project is active.

#### Build Errors

**Problem**: TypeScript errors during build.

**Solution**: Run `npm run lint` to identify and fix type issues. Make sure all required types are properly defined.

### Getting Help

If you encounter issues not covered here, please:

1. Check the [issue tracker](https://github.com/your-repo/issues) for similar problems
2. Create a new issue with detailed reproduction steps
3. Contact the project maintainers at support@example.com

## 🤝 Contributing

There are several ways of editing and contributing to this application:

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes.

### Edit a file directly in GitHub

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

### Use GitHub Codespaces

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the Student Portfolio Analyzer Team
