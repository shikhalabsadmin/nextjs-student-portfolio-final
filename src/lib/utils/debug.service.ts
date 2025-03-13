import { debug } from "@/lib/assignment.service";

interface APIParams {
  [key: string]: string | number | boolean | null | undefined;
}

export const debugAPI = {
  request: (method: string, endpoint: string, params?: APIParams) => {
    debug.log(`🌐 API Request: ${method} ${endpoint}`, { params });
  },
  response: (method: string, endpoint: string, data: unknown, error?: unknown) => {
    if (error) {
      debug.error(`❌ API Error: ${method} ${endpoint}`, { error });
    } else {
      debug.log(`✅ API Response: ${method} ${endpoint}`, { data });
    }
  },
  step: (stepName: string, details?: unknown) => {
    debug.log(`📍 Step: ${stepName}`, details || {});
  },
  info: (message: string, details?: unknown) => {
    debug.log(`ℹ️ Info: ${message}`, details || {});
  },
  warn: (message: string, details?: unknown) => {
    debug.log(`⚠️ Warning: ${message}`, details || {});
  },
  error: (message: string, error?: unknown) => {
    debug.error(`❌ Error: ${message}`, error || {});
  }
}; 