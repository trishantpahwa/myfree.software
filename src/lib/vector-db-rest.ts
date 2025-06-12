// lib/vector-db-rest.ts
import { createHash } from "crypto";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION || "repos";

const headers = {
    "Content-Type": "application/json",
    ...(QDRANT_API_KEY ? { "api-key": QDRANT_API_KEY } : {}),
};

export function toUUIDv5FromURL(url: string) {
    const hash = createHash("sha1").update(url).digest("hex");
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        "5" + hash.slice(13, 16),
        "a" + hash.slice(17, 20),
        hash.slice(20, 32),
    ].join("-");
}

export async function initCollection(vectorSize: number) {
    const res = await fetch(`${QDRANT_URL}/collections`, {
        headers,
    });
    const data = await res.json();
    console.log(data);
    const collections = data.result?.collections || [];
    console.log("Collections:", collections);
    const exists = collections.some(
        (col: { name: string }) => col.name === COLLECTION
    );
    console.log(`Collection "${COLLECTION}" exists:`, exists);
    if (exists) return;

    const body = {
        vectors: {
            size: vectorSize,
            distance: "Cosine",
        },
    };

    const createRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
    });

    if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(
            `Qdrant createCollection failed: ${createRes.status} ${createRes.statusText} — ${errText}`
        );
    }
}

export async function upsertRepoToQdrant(
    id: string,
    vector: number[],
    payload: Record<string, unknown>
) {
    const body = {
        points: [
            {
                id,
                vector,
                payload,
            },
        ],
    };

    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(
            `Qdrant upsert failed: ${res.status} ${res.statusText} — ${errText}`
        );
    }
}
