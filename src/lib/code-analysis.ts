export function analyzeCode(files: string[]) {
    const comments: string[] = [];
    const algorithms: string[] = [];
    const pattern =
        /\b(dynamic programming|memoization|binary search|quicksort|merge sort|graph traversal|dfs|bfs|neural network)\b/gi;

    for (const content of files) {
        const jsMatches = [...content.matchAll(/\/\/(.*)|\/\*([\s\S]*?)\*\//g)];
        comments.push(...jsMatches.map((m) => m[1] || m[2]).filter(Boolean));

        const pyMatches = [...content.matchAll(/#(.*)/g)].map((m) =>
            m[1].trim()
        );
        comments.push(...pyMatches);

        const algMatches = [...content.matchAll(pattern)].map((m) =>
            m[0].toLowerCase()
        );
        algorithms.push(...new Set(algMatches));
    }

    return {
        comments: comments.slice(0, 100),
        algorithms: Array.from(new Set(algorithms)),
    };
}
