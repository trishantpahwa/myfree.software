// pages/api/search.ts
import { searchQdrant } from "@/lib/searchRepos";
import { getGeminiEmbedding, getGeminiResponse } from "@/lib/embedding-gemini";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const { query, limit = 50, minScore = 0.7 } = request.body; // Accept optional minScore
        if (!query)
            return response.status(400).json({ error: "Missing query" });

        const embedding = await getGeminiEmbedding(query);
        const results = await searchQdrant(embedding, limit);

        // 🔍 Filter results by score threshold
        const filteredResults = results.filter(
            (r: { score: number }) => r.score >= minScore
        );

        const topResultsText = filteredResults
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

        return response.status(200).json({
            query,
            summary,
            results: filteredResults.map(
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
        return response.status(500).json({ error: error.message });
    }
}
