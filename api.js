const API_URL = "http://localhost:5000/api";

export async function request(endpoint, method = "GET", body = null) {

    const token = localStorage.getItem("token");

    const res = await fetch(API_URL + endpoint, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : null
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}