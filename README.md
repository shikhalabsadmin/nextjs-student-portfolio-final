# Student Portfolio Platform

A web application that helps students build and showcase their academic portfolios while enabling teachers to create assignments, review student work, and provide feedback.

**🔗 Quick Links:**
- 🌐 [Live Application](https://student-portfolio-shikha-learning-labs.vercel.app/)
- 📦 [GitHub Repository](https://github.com/shikhalabsadmin/nextjs-student-portfolio-final.git)

## About

This platform allows students to document their learning journey, submit assignments, and create a public portfolio showcasing their best work. Teachers can create assignments, review submissions, provide feedback, and verify completed work. The platform supports multiple user roles with appropriate access controls.

## Features

### For Students
- **Dashboard**: View all assignments with filtering by subject, status, and date
- **Assignment Management**: Complete multi-step assignments with file uploads, rich text editing, and reflection
- **Portfolio Creation**: Build a public portfolio showcasing approved assignments
- **Profile Management**: Update personal information, grade level, and school details
- **Progress Tracking**: Monitor assignment status and feedback from teachers

### For Teachers
- **Assignment Creation**: Create assignments with questions, instructions, and due dates
- **Submission Review**: Review student submissions with a detailed interface
- **Feedback System**: Provide detailed feedback, approve or request revisions
- **Skills Assessment**: Evaluate and tag student skills demonstrated in assignments
- **Analytics Dashboard**: View statistics and insights about student performance

### For Administrators
- **User Management**: Manage users, roles, and permissions
- **System Administration**: Access admin dashboard and reports
- **Platform Configuration**: Configure system settings and preferences

### Platform Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **File Upload**: Support for images, documents, and other file types
- **Rich Text Editing**: Advanced text editor with formatting options
- **Single Sign-On (SSO)**: Integration with external learning platforms
- **Real-time Updates**: Immediate feedback and status updates

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query for server state, Context API for global state
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling
- **Text Editor**: Tiptap rich text editor
- **Charts**: Recharts for data visualization

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 16 or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js (or use yarn if preferred)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Supabase Access**: Contact your team lead for access to the company Supabase project

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shikhalabsadmin/nextjs-student-portfolio-final.git
   cd nextjs-student-portfolio-final
   ```
   
   **Note**: Access to this repository is restricted to authorized team members only.

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

   **Getting Supabase credentials:**
   - Contact your team lead or DevOps team for the Supabase project credentials
   - Or access the company Supabase dashboard (internal access required)
   - Navigate to Settings → API to get the Project URL and anon/public key

   **SSO Shared Secret:**
   - Contact your team lead or DevOps administrator for the shared secret value
   - This is required only if you're integrating with external learning platforms

4. **Start the development server**
   ```bash
npm run dev
```

5. **Open your browser**
   
   The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── api/              # API service functions
├── components/       # React components organized by feature
│   ├── admin/       # Admin-specific components
│   ├── assignment/  # Assignment-related components
│   ├── auth/        # Authentication components
│   ├── student/     # Student-specific components
│   ├── teacher/     # Teacher-specific components
│   └── ui/          # Reusable UI components
├── config/          # Configuration files (routes, roles)
├── constants/       # Application constants
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── integrations/    # Third-party service integrations
├── lib/             # Utility functions and services
├── pages/           # Page-level components
├── query-key/       # React Query key definitions
├── scripts/         # Utility scripts
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## Authentication

The platform supports two authentication methods:

### Standard Authentication
Users can sign up and sign in using email and password. After registration, users select their role (Student or Teacher), which determines their access and interface.

### Single Sign-On (SSO)
The platform can integrate with external learning platforms using JWT-based authentication. When a user clicks a link from an external platform, they are automatically authenticated using a secure token.

**Authentication Flow:**
1. User signs up or signs in
2. System checks for existing user role
3. If no role exists, user selects their role
4. User is redirected to their appropriate dashboard

## Development Guidelines

### Code Style
- Follow the existing code patterns and conventions
- Use TypeScript for all new code
- Run `npm run lint` before committing changes
- Use meaningful variable and function names

### Component Structure
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for component props
- Add error boundaries for error handling

### File Naming
- Components: PascalCase (e.g., `StudentDashboard.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuthState.ts`)
- Utilities: camelCase (e.g., `dateUtils.ts`)
- Types: camelCase (e.g., `assignment.ts`)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_PORTFOLIO_SHARED_SECRET` | Shared secret for SSO integration | Only if using SSO |

**Important**: Never commit the `.env` file to version control. The `.gitignore` file is configured to exclude it.

## Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   
   The `dist/` folder contains the production-ready files. Deploy this folder to your hosting provider (Vercel, Netlify, etc.).

## Deployment

The project includes a `vercel.json` configuration file for deployment. Deployment is typically handled by the DevOps team through CI/CD pipelines.

**Live Application:** [https://student-portfolio-shikha-learning-labs.vercel.app/](https://student-portfolio-shikha-learning-labs.vercel.app/)

**For manual deployment:**
- Build the application: `npm run build`
- The `dist/` folder contains the production-ready files
- Contact the DevOps team for deployment procedures

**Important**: Always set environment variables in the hosting platform's dashboard before deploying. Contact your team lead for production environment credentials.

## Troubleshooting

### Common Issues

**Port already in use**
- Change the port in `vite.config.ts` or stop the process using port 8080

**Supabase connection errors**
- Verify your environment variables are set correctly
- Check that your Supabase project is active
- Ensure your IP address is allowed (if using IP restrictions)

**Build errors**
- Run `npm run lint` to identify issues
- Ensure all TypeScript types are properly defined
- Check that all dependencies are installed

**Authentication issues**
- Verify your Supabase credentials are correct
- Check that the user has a profile in the database
- Clear browser cache and localStorage

## Development Workflow

### Making Changes

1. **Create a feature branch** from the main branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the development guidelines

3. **Test thoroughly** before committing

4. **Commit your changes** with clear messages
   ```bash
   git commit -m 'Brief description of changes'
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** through the internal repository interface

### Code Review Process
- All changes require code review before merging
- Follow the existing code style and patterns
- Write clear commit messages
- Add comments for complex business logic
- Update documentation if needed
- Ensure all tests pass before requesting review

## Support and Contact

For technical issues, questions, or access requests:
- Contact your team lead or project manager
- Reach out to the development team via internal communication channels
- Check the project documentation in the internal wiki
- For urgent production issues, follow the company's incident management process

---

**Internal Project - Shikha Learning Labs**

