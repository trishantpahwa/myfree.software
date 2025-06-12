import {
    initCollection,
    upsertRepoToQdrant,
    toUUIDv5FromURL,
} from "@/lib/vector-db-rest";
import { getGeminiEmbedding } from "@/lib/embedding-gemini";
import { fetchGitHubRepoWithCode } from "@/lib/github";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { repoUrl } = req.body;
        if (!repoUrl)
            return res.status(400).json({ error: "repoUrl is required" });

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

        res.status(200).json({ status: "indexed", repo: metadata.name });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
