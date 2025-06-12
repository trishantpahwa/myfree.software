// pages/api/search.ts
import { searchQdrant } from "@/lib/searchRepos";
import { getGeminiEmbedding, getGeminiResponse } from "@/lib/embedding-gemini";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Missing query" });

        const embedding = await getGeminiEmbedding(query);
        const results = await searchQdrant(embedding);

        const topResultsText = results
            .map(
                (
                    r: { payload: { name: string; description?: string } },
                    i: number
                ) =>
                    `${i + 1}. ${r.payload.name}: ${
                        r.payload.description || "No description"
                    }`
            )
            .join("\n");

        const summary = await getGeminiResponse(`
User asked: "${query}"

Here are the most relevant GitHub repositories:
${topResultsText}

Give a helpful summary of what this user may be looking for and which repo is most useful.
        `);

        res.status(200).json({
            query,
            summary,
            results: results.map(
                (r: {
                    score: number;
                    payload: {
                        name: string;
                        description?: string;
                        url: string;
                        topics?: string[];
                    };
                }) => ({
                    score: r.score,
                    repo: {
                        name: r.payload.name,
                        description: r.payload.description,
                        url: r.payload.url,
                        topics: r.payload.topics,
                    },
                })
            ),
        });
    } catch (err) {
        const error = err as Error;
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
