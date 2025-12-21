import { supabase } from "./supabase";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(
        `${import.meta.env.VITE_API_URL}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
                ...options.headers,
            },
        }
    );

    if (!res.ok) {
        throw new Error(`API error ${res.status}`);
    }

    return res.json();
}
