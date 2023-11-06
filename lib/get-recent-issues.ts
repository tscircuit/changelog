import ms from "ms"
import axios from "axios"
import { cacheCall } from "./cache"

type Repo = {
  org: string
  name: string
}

type Issue = {
  issue_url: string
  created_at: string
  closed_at: string
  title: string
  user: string
  state: string
}

export const getRecentIssues = async (repo: Repo): Promise<Issue[]> => {
  const cacheKey = `issues-${repo.org}-${repo.name}`

  const issues: Issue[] = []
  try {
    const response = await cacheCall(cacheKey, () =>
      axios
        .get(
          `https://api.github.com/repos/${repo.org}/${repo.name}/issues?per_page=100`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        )
        .then((r) => r.data)
    )

    // Parse the response data to extract issue information
    for (const item of response) {
      if (item.pull_request) continue // Skip pull requests, which are also returned in the issues endpoint
      if (item.user?.login?.includes?.("bot")) continue // Skip bot issues
      issues.push({
        issue_url: item.html_url,
        state: item.state,
        created_at: item.created_at.split("T")[0],
        closed_at: item.closed_at?.split?.("T")[0],
        title: item.title,
        user: item.user.login,
      })
    }
  } catch (error: any) {
    console.log(
      `[${repo.name}] Error fetching issues:`,
      error?.response?.data?.message
    )
    if (
      error?.response?.data?.message?.toLowerCase?.() ===
      "Git Repository is empty.".toLowerCase()
    )
      return []
    throw error // Rethrow the error for the caller to handle
  }

  return issues
}
