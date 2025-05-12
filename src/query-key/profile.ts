export const PROFILE_KEYS = {
    authSession: ['auth-session'] as const,
    profile: (userId: string) => ['profile', userId] as const,
    profilePicture: {
        // Key for the profile picture URL
        url: (userId: string, imageId?: string) => ['profile', userId, 'picture', imageId] as const,
        // Key for upload status
        upload: (userId: string) => ['profile', userId, 'picture', 'upload'] as const,
        // Key for all profile pictures
        all: (userId: string) => ['profile', userId, 'pictures'] as const,
    }
} as const;