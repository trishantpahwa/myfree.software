import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    if (request.method !== "GET") {
        return response.status(405).json({ error: "Method Not Allowed" });
    }

    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
        return response.status(401).json({ error: "Unauthorized" });
    }

    try {
        let allRepositories: any[] = [];
        let page = 1;
        const perPage = 100; // GitHub's maximum per page

        while (true) {
            const _response = await fetch(
                `https://api.github.com/user/repos?page=${page}&per_page=${perPage}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );

            if (!_response.ok) {
                const errorData = await _response.json();
                return response
                    .status(_response.status)
                    .json({ error: errorData.message });
            }

            const repositories = await _response.json();

            if (repositories.length === 0) {
                break; // No more repositories
            }

            allRepositories = allRepositories.concat(repositories);

            if (repositories.length < perPage) {
                break; // Last page reached
            }

            page++;
        }

        return response.status(200).json(allRepositories);
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
}
