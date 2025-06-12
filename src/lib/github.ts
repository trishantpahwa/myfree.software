const langs = ["js", "ts", "py", "java", "cpp"];

function parseUrl(repoUrl: string) {
    const [owner, repo] = new URL(repoUrl).pathname.slice(1).split("/");
    return { owner, repo };
}

async function fetchFile(
    owner: string,
    repo: string,
    path: string
): Promise<string> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: { Accept: "application/vnd.github.v3+json" },
        }
    );
    if (!res.ok) return "";
    const json = await res.json();
    if (json.type === "file" && json.encoding === "base64") {
        return Buffer.from(json.content, "base64").toString("utf-8");
    }
    return "";
}

async function fetchFilePaths(owner: string, repo: string): Promise<string[]> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.tree
        .filter(
            (f: any) =>
                f.type === "blob" &&
                langs.some((ext) => f.path.endsWith(`.${ext}`))
        )
        .map((f: any) => f.path);
}

export async function fetchGitHubRepoWithCode(repoUrl: string) {
    const { owner, repo } = parseUrl(repoUrl);

    const [metaRes, readmeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Accept: "application/vnd.github.v3+json" },
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { Accept: "application/vnd.github.v3+json" },
        }),
    ]);

    if (!metaRes.ok || !readmeRes.ok)
        throw new Error("Repository or README not found");

    const meta = await metaRes.json();
    const readmeJson = await readmeRes.json();
    const readme = Buffer.from(readmeJson.content, "base64").toString("utf-8");

    const filePaths = await fetchFilePaths(owner, repo);
    // const codeFiles = await Promise.all(
    //     filePaths.map((p) => fetchFile(owner, repo, p))
    // );

    return {
        metadata: {
            name: meta.full_name,
            description: meta.description,
            topics: meta.topics,
            language: meta.language,
            readme,
        },
        // codeFiles,
    };
}
