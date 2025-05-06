export const PROFILE_KEYS = {
    authSession: ['auth-session'] as const,
    profile: (userId: string) => ['profile', userId] as const,
} as const;