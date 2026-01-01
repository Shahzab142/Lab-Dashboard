export async function apiFetch(path: string) {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}${path}`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!res.ok) {
            console.error(`API Error: ${res.status} ${res.statusText} for ${path}`);
            throw new Error(`API error ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error("API Fetch Failure", error);
        throw error;
    }
}

