// src/query-key/client.ts
// This file creates and exports a configured QueryClient instance for use with React Query

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Don't retry failed queries
        retry: false,
        // Automatically refetch when window regains focus
        refetchOnWindowFocus: false,
        // Automatically refetch when component mounts
        refetchOnMount: true,
        // Automatically refetch when network reconnects
        refetchOnReconnect: true,
        // Set staleTime to 0 to always fetch fresh data
        staleTime: 0,
      },
    },
  });

