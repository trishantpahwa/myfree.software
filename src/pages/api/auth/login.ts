import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    if (request.method !== "POST") {
        return response.status(405).json({ error: "Method Not Allowed" });
    }
    const { code } = request.body;

    if (!code) {
        return response.status(400).json({ error: "Code is required" });
    }

    try {
        const _response = await fetch(
            `https://github.com/login/oauth/access_token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                }),
            }
        );

        const data = await _response.json();

        if (_response.ok) {
            return response.status(200).json({ token: data.access_token });
        } else {
            return response.status(400).json({ error: data.error });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        return response.status(500).json({ error: "Internal Server Error" });
    }
}
