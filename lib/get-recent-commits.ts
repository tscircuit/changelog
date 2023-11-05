import ms from "ms"
import axios from "axios"
import { cacheCall } from "./cache"

type Repo = {
  org: string
  name: string
}

type Commit = {
  commit_url: string
  date: string
  message: string
  author: string
}

export const getRecentCommits = async (repo: Repo): Promise<Commit[]> => {
  const cacheKey = `commits-${repo.org}-${repo.name}`

  const commits: Commit[] = []
  try {
    const response = await cacheCall(`commits-${repo.org}-${repo.name}`, () =>
      axios
        .get(
          `https://api.github.com/repos/${repo.org}/${repo.name}/commits?per_page=100`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        )
        .then((r) => r.data)
    )

    // Parse the response data to extract commit information
    for (const item of response) {
      if (!item.committer) continue
      commits.push({
        commit_url: item.html_url,
        date: item.commit.author.date.split("T")[0],
        message: item.commit.message,
        author: item.committer.login,
      })
    }
  } catch (error: any) {
    console.log(
      `[${repo.name}] Error fetching commits:`,
      error?.response?.data?.message
    )
    if (
      error?.response?.data?.message?.toLowerCase?.() ===
      "Git Repository is empty.".toLowerCase()
    )
      return []
    throw error // Rethrow the error for the caller to handle
  }

  return commits
}
