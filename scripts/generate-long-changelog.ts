import { getRecentCommits } from "../lib/get-recent-commits"
import { getRepos } from "../lib/get-repos"
import stringify from "safe-stable-stringify"
import fs from "fs"
import ms from "ms"

async function main() {
  const repos = await getRepos()

  for (let i = 1; i < 365; i++) {
    const date = new Date(Date.now() - ms(`${i}d`)).toISOString().split("T")[0]
    console.log(`Generating changelog for ${date}...`)
    const allCommits: any[] = []
    for (const repo of repos) {
      if (repo.name === "changelog") continue

      const commitsFromRepo = (await getRecentCommits(repo)).map((commit) => ({
        ...commit,
        repo: `${repo.org}/${repo.name}`,
      }))

      for (const commit of commitsFromRepo) {
        if (commit.date.startsWith(date)) {
          allCommits.push(commit)
        }
      }
    }
    if (allCommits.length === 0) continue
    fs.mkdirSync(`public/changelogs/${date}`, { recursive: true })
    fs.writeFileSync(
      `public/changelogs/${date}/commits.json`,
      stringify(allCommits, null, "  ")
    )
  }
}
main()
