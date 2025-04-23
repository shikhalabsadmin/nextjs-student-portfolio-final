import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthState, initAuth } from "@/hooks/useAuthState";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loading } from "@/components/ui/loading";
import { AppRouter } from "@/router";
import { logger } from "@/lib/logger";
import { Error } from "@/components/ui/error";

// Create module-specific logger
const appLogger = logger.forModule("App");

// QueryClient initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  },
});

// Make queryClient globally available for non-hook contexts (like auth state manager)
if (typeof window !== 'undefined') {
  (window as { __REACT_QUERY_GLOBAL_CLIENT__?: QueryClient }).__REACT_QUERY_GLOBAL_CLIENT__ = queryClient;
  appLogger.info("QueryClient made globally available");
}

appLogger.info("QueryClient initialized", {
  config: queryClient.getDefaultOptions(),
});

const App: React.FC = () => {
  const { user, userRole, isLoading } = useAuthState();

  appLogger.info("App component mounted", { user, userRole, isLoading });

  useEffect(() => {
    logger.time("Auth initialization");
    try {
      initAuth();
      appLogger.info("Auth initialized successfully");
    } catch (error) {
      appLogger.error("Failed to initialize auth", error);
    } finally {
      logger.timeEnd("Auth initialization");
    }
  }, []);

  // Render logic
  appLogger.debug("Preparing to render", { user, userRole, isLoading });

  if (isLoading) {
    appLogger.debug("Rendering loading state");
    return <Loading fullScreen />;
  }

  appLogger.debug("Rendering main application");
  try {
    return (
      <ErrorBoundary fallback={<Error fullScreen={true} message="Something went wrong" />}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppRouter user={user} userRole={userRole} />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    appLogger.error("Failed to render application", error);
    throw error;
  }
};

export default App;