// Simple singleton to hold credentials and avoid circular dependencies
export const authConfig = {
    baseUrl: null as string | null,
    apiKey: null as string | null,
};

export const setAuthConfig = (url: string | null, key: string | null) => {
    authConfig.baseUrl = url;
    authConfig.apiKey = key;
};
