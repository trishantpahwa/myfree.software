import {
    initCollection,
    upsertRepoToQdrant,
    toUUIDv5FromURL,
} from "@/lib/vector-db-rest";
import { getGeminiEmbedding } from "@/lib/embedding-gemini";
import { fetchGitHubRepoWithCode } from "@/lib/github";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const { repoUrl } = request.body;
        if (!repoUrl)
            return response.status(400).json({ error: "repoUrl is required" });

        const { metadata } = await fetchGitHubRepoWithCode(repoUrl);

        const combinedText = [
            metadata.name,
            metadata.description,
            metadata.topics.join(", "),
            metadata.readme,
        ].join("\n\n");

        const embedding = await getGeminiEmbedding(combinedText);

        await initCollection(embedding.length);

        const id = toUUIDv5FromURL(repoUrl);
        await upsertRepoToQdrant(id, embedding, metadata);

        return response
            .status(200)
            .json({ status: "indexed", repo: metadata.name });
    } catch (err) {
        const error = err as Error;
        console.error(error);
        return response.status(500).json({ error: error.message });
    }
}
