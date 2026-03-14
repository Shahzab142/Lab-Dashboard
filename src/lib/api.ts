export async function apiFetch(path: string, options: RequestInit = {}) {
    const defaultOptions: RequestInit = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        // CONSTANT: Force the verified live backend URL to prevent stale environment variables on Netlify from breaking the connection.
        const LIVE_BACKEND_URL = import.meta.env.VITE_API_URL || "https://labmonitoringserver.onrender.com/api";
        const baseUrl = LIVE_BACKEND_URL;
        const url = new URL(`${baseUrl}${path}`);
        url.searchParams.append("_t", String(Date.now()));
        const res = await fetch(url.toString(), finalOptions);

        if (!res.ok) {
            let errorMessage = `HTTP ${res.status}`;
            try {
                const errorData = await res.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // Not a JSON error response
            }
            console.error(`API Error: ${res.status} ${res.statusText} for ${path}. Detail: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        return await res.json();
    } catch (error) {
        console.error("API Fetch Failure", error);
        throw error;
    }
}
