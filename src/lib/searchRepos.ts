// lib/searchRepos.ts
const QDRANT_URL = process.env.QDRANT_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const COLLECTION = process.env.QDRANT_COLLECTION || "repos";

const headers = {
    "Content-Type": "application/json",
    ...(QDRANT_API_KEY ? { "api-key": QDRANT_API_KEY } : {}),
};

export async function searchQdrant(vector: number[], topK = 5) {
    const body = {
        vector,
        limit: topK,
        with_payload: true,
    };

    const res = await fetch(
        `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
            `Qdrant search failed: ${res.status} ${res.statusText} — ${errorText}`
        );
    }

    const data = await res.json();
    return data.result;
}
