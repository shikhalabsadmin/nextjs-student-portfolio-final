# Sentry Configuration Guide

This project uses Sentry for error monitoring, performance tracing, session replay, and structured logging.

## Setup Reference

Sentry is initialized in `src/main.tsx` before the React app renders. Configuration uses environment variables from `.env`.

### Environment Variables

```
VITE_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug
```

---

## Error Tracking

### Automatic Error Capture

The app uses `Sentry.ErrorBoundary` in `App.tsx` to automatically capture React component errors.

### Manual Error Capture

Use `Sentry.captureException(error)` in try-catch blocks:

```typescript
import * as Sentry from "@sentry/react";

async function submitForm(data: FormData) {
  try {
    await api.submit(data);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

---

## Performance Tracing

### Automatic Tracing

Page loads and navigation are automatically traced via `browserTracingIntegration()`.

### Custom Spans for UI Actions

```typescript
import * as Sentry from "@sentry/react";

function handleButtonClick() {
  Sentry.startSpan(
    {
      op: "ui.click",
      name: "Submit Assignment",
    },
    () => {
      // Your logic here
      processAssignment();
    }
  );
}
```

### Custom Spans for API Calls

```typescript
import * as Sentry from "@sentry/react";

async function fetchStudentData(studentId: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/students/${studentId}`,
    },
    async () => {
      const response = await fetch(`/api/students/${studentId}`);
      return response.json();
    }
  );
}
```

---

## Structured Logging

### Usage

```typescript
import * as Sentry from "@sentry/react";

const { logger } = Sentry;

// Different log levels
logger.info("User logged in", { userId: "123" });
logger.warn("Rate limit approaching", { remaining: 10 });
logger.error("Payment failed", { orderId: "order_456", amount: 99.99 });
```

### With Template Literals

```typescript
const { logger } = Sentry;

logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info(logger.fmt`Assignment ${assignmentId} submitted by ${studentName}`);
```

---

## Best Practices

1. **Never hardcode DSN** - Always use `import.meta.env.VITE_SENTRY_DSN`
2. **Use meaningful span names** - e.g., "Submit Assignment" not "button click"
3. **Add context to errors** - Include relevant data like user ID, assignment ID
4. **Keep sample rates low in production** - `tracesSampleRate: 0.1` (10%)
5. **Use ErrorBoundary** - Wrap app with `Sentry.ErrorBoundary` for React errors
