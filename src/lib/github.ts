const MAX_README_LENGTH = 30000;

function parseUrl(repoUrl: string) {
    const [owner, repo] = new URL(repoUrl).pathname.slice(1).split("/");
    return { owner, repo };
}

function truncateContent(content: string, maxLength = MAX_README_LENGTH) {
    return content.length > maxLength ? content.slice(0, maxLength) : content;
}

export async function fetchGitHubRepoWithCode(repoUrl: string) {
    const { owner, repo } = parseUrl(repoUrl);

    const [metaRes, readmeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                Accept: "application/vnd.github.mercy-preview+json", // needed for topics
            },
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { Accept: "application/vnd.github.v3+json" },
        }),
    ]);

    if (!metaRes.ok || !readmeRes.ok) {
        throw new Error("Repository or README not found");
    }

    const meta = await metaRes.json();
    const readmeJson = await readmeRes.json();

    const readmeDecoded = Buffer.from(readmeJson.content, "base64").toString(
        "utf-8"
    );
    const readme = truncateContent(readmeDecoded);

    return {
        metadata: {
            name: meta.full_name,
            description: meta.description ?? "",
            topics: Array.isArray(meta.topics) ? meta.topics : [],
            language: meta.language ?? "",
            readme,
        },
    };
}
