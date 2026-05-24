export async function apiFetch(path: string, options: RequestInit = {}) {
    let token = localStorage.getItem('lab_guardian_token');
    
    // Fallback: check inside the admin user object
    if (!token) {
        const savedUser = localStorage.getItem('lab_guardian_admin');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                token = parsed.token;
            } catch (e) {
                console.error("Failed to parse admin session", e);
            }
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const finalOptions: RequestInit = {
        ...options,
        headers,
    };

    try {
        const baseUrl = import.meta.env.VITE_API_URL || "https://labmonitoringservergo-1f69d6677862.herokuapp.com/api";
        const url = new URL(`${baseUrl}${path}`);
        url.searchParams.append("_t", String(Date.now()));
        const res = await fetch(url.toString(), finalOptions);

        if (!res.ok) {
            if (res.status === 401) {
                console.warn("Session expired. Logging out...");
                localStorage.removeItem('lab_guardian_token');
                localStorage.removeItem('lab_guardian_admin');
                window.location.href = '/login';
                return;
            }
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
