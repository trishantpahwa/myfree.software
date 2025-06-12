// lib/embedding-gemini.ts

export async function getGeminiEmbedding(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "models/gemini-embedding-exp-03-07",
            content: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT",
        }),
    });
    const json = await res.json();
    if (!res.ok || !json.embedding) {
        console.error("Embedding error:", json);
        throw new Error(
            `Embedding failed: ${json.error?.message || res.status}`
        );
    }
    return json.embedding.values;
}

export async function getGeminiResponse(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });
    const json = await res.json();
    if (
        !res.ok ||
        !json.candidates ||
        !json.candidates[0].content.parts[0].text
    ) {
        console.error("Gemini response error:", json);
        throw new Error(
            `Gemini response failed: ${json.error?.message || res.status}`
        );
    }
    return json.candidates[0].content.parts[0].text;
}
