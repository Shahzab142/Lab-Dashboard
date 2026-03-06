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
<<<<<<< HEAD
        const baseUrl = import.meta.env.VITE_API_URL || "https://lab-systems-monitoring-server-kt3b.onrender.com/api";
=======
        // PRODUCTION SERVER: lab-systems-monitoring-server-kt3b.onrender.com
        const baseUrl = "https://lab-systems-monitoring-server-kt3b.onrender.com/api";
>>>>>>> 66ae7c1203dc72ac37ef8ba3c0744ac73f438bfd
        const res = await fetch(
            `${baseUrl}${path}`,
            finalOptions
        );

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
