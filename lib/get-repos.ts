import ms from "ms"
import axios from "axios"
import { getCache } from "./cache"

type Repo = {
  org: string
  name: string
}

export const getRepos = async (): Promise<Repo[]> => {
  const cache = await getCache()
  if (await cache.getItem("repolist")) {
    return JSON.parse(await cache.getItem("repolist"))
  }

  const repos: Array<Repo> = []
  let page = 1

  while (true) {
    const response = await axios.get(
      `https://api.github.com/orgs/tscircuit/repos?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.mercy-preview+json", // for topics
        },
      }
    )

    if (response.data.length === 0) {
      break
    }

    for (const repo of response.data) {
      repos.push({
        name: repo.name,
        org: `tscircuit`,
      })
    }

    page += 1
  }

  await cache.setItem("repolist", JSON.stringify(repos), {
    ttl: ms("24h"),
  })

  return repos
}
