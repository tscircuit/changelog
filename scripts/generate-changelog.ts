import { getRecentCommits } from "../lib/get-recent-commits"
import { getRepos } from "../lib/get-repos"
import stringify from "safe-stable-stringify"
import fs from "fs"
import ms from "ms"
import { getRecentIssues } from "../lib/get-recent-issues"

async function main() {
  const today = new Date(Date.now()).toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - ms("1d")).toISOString().split("T")[0]

  const repos = await getRepos()

  const dates = [today, yesterday]

  if (process.argv.includes("--long")) {
    for (let i = 2; i < 365; i++) {
      const date = new Date(Date.now() - ms(`${i}d`))
        .toISOString()
        .split("T")[0]
      dates.push(date)
    }
  }

  const dateData: Record<
    string,
    {
      commits: any[]
      issues_created: any[]
      issues_closed: any[]
    }
  > = {}

  for (const date of dates) {
    dateData[date] = { commits: [], issues_created: [], issues_closed: [] }
  }

  for (const repo of repos) {
    if (repo.name === "changelog") continue

    const commits = (await getRecentCommits(repo)).map((commit) => ({
      ...commit,
      repo: `${repo.org}/${repo.name}`,
    }))

    const issues = (await getRecentIssues(repo)).map((issue) => ({
      ...issue,
      repo: `${repo.org}/${repo.name}`,
    }))

    for (const date of dates) {
      for (const commit of commits) {
        if (commit.date.startsWith(date)) {
          dateData[date].commits.push(commit)
        }
      }
      for (const issue of issues) {
        if (issue.created_at.startsWith(date)) {
          dateData[date].issues_created.push(issue)
        }
        if (issue.closed_at?.startsWith?.(date)) {
          dateData[date].issues_closed.push(issue)
        }
      }
    }
  }

  for (const date of dates) {
    const { commits, issues_created, issues_closed } = dateData[date]

    if (
      commits.length === 0 &&
      issues_created.length === 0 &&
      issues_closed.length === 0
    )
      continue

    fs.mkdirSync(`public/changelogs/${date}`, { recursive: true })

    // Write changelog files
    if (commits.length > 0) {
      fs.writeFileSync(
        `public/changelogs/${date}/commits.json`,
        stringify(commits, null, "  ")
      )
    }
    if (issues_created.length > 0) {
      console.log(issues_created)
      fs.writeFileSync(
        `public/changelogs/${date}/issues_created.json`,
        stringify(issues_created, null, "  ")
      )
    }
    if (issues_closed.length > 0) {
      fs.writeFileSync(
        `public/changelogs/${date}/issues_closed.json`,
        stringify(issues_closed, null, "  ")
      )
    }
  }
}
main()
