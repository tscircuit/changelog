import ms from "ms"
import axios from "axios"
import { getCache } from "./cache"

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
  const cache = await getCache()

  // Attempt to fetch the commits from the cache
  const cachedCommits = await cache.getItem(cacheKey)
  if (cachedCommits) {
    return JSON.parse(cachedCommits)
  }

  const commits: Commit[] = []
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repo.org}/${repo.name}/commits`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    // Parse the response data to extract commit information
    for (const item of response.data) {
      if (!item.committer) continue
      commits.push({
        commit_url: item.html_url,
        date: item.commit.author.date.split("T")[0],
        message: item.commit.message,
        author: item.committer.login,
      })
    }

    // Cache the retrieved commits
    await cache.setItem(cacheKey, JSON.stringify(commits), {
      ttl: ms("1h"), // You can set TTL as per your requirement
    })
  } catch (error: any) {
    console.error(
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
