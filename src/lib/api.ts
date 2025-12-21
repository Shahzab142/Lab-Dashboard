import { supabase } from "./supabase";

export async function apiFetch(path: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}${path}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
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
