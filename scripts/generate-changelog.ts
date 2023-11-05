import { getRecentCommits } from "../lib/get-recent-commits"
import { getRepos } from "../lib/get-repos"
import fs from "fs"
import ms from "ms"

async function main() {
  const today = new Date(Date.now()).toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - ms("1d")).toISOString().split("T")[0]

  const repos = await getRepos()

  const commitsToday = []
  const commitsYesterday = []

  for (const repo of repos) {
    if (repo.name === "changelog") continue

    const commits = (await getRecentCommits(repo)).map((commit) => ({
      ...commit,
      repo: `${repo.org}/${repo.name}`,
    }))

    for (const commit of commits) {
      if (commit.date.startsWith(today)) {
        commitsToday.push(commit)
      } else if (commit.date.startsWith(yesterday)) {
        commitsYesterday.push(commit)
      }
    }
  }

  // Ensure directory at public/changelogs/<date> for today and yesterday
  fs.mkdirSync(`public/changelogs/${today}`, { recursive: true })
  fs.mkdirSync(`public/changelogs/${yesterday}`, { recursive: true })

  // Write changelog files
  fs.writeFileSync(
    `public/changelogs/${today}/commits.json`,
    JSON.stringify(commitsToday)
  )
  fs.writeFileSync(
    `public/changelogs/${yesterday}/commits.json`,
    JSON.stringify(commitsYesterday)
  )
}
main()
