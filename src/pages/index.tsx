import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

// Define types for repo and result
interface Repo {
  name: string;
  url: string;
  description?: string;
  topics?: string[];
}

interface SearchResult {
  score: number;
  repo: Repo;
}

export default function Home() {

  const router = useRouter();

  const [query, setQuery] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setResults(json.results || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIngest() {
    setIndexing(true);
    setError(null);
    setIndexStatus(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ingest failed");
      setIndexStatus(`Indexed repo: ${json.repo}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <span role="img" aria-label="Search">🔍</span> Search GitHub Repositories
      </h1>

      <div className="space-y-2">
        <Input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="e.g. https://github.com/user/repo"
        />
        <Button onClick={handleIngest} disabled={indexing} className="w-fit">
          {indexing ? "Indexing..." : "📥 Ingest Repo"}
        </Button>
        {indexStatus && <p className="text-green-500 text-sm">✅ {indexStatus}</p>}
      </div>

      <div className="space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for topics, descriptions..."
        />
        <Button onClick={handleSearch} disabled={loading} className="w-fit">
          {loading ? "Searching..." : "🔎 Search"}
        </Button>
      </div>

      {error && <p className="text-red-500">❌ {error}</p>}

      {results.length > 0 && (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-zinc-800 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Score</th>
                <th className="px-4 py-2 font-semibold">Repository</th>
                <th className="px-4 py-2 font-semibold">Description</th>
                <th className="px-4 py-2 font-semibold">Topics</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr key={i} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-300">
                    {result.score.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-blue-600 dark:text-blue-400 font-medium">
                    {result.repo.name}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {result.repo.description || "No description."}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {result.repo.topics?.map((topic: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}