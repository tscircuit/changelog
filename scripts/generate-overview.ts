import fs from "fs"
import stringify from "safe-stable-stringify"

type OverviewJson = {
  commit_graph_starting_date: string
  commit_graph_ending_date: string
  /**
   * Each number represents the number of commits on that day
   */
  commit_graph: number[]

  version_released_on_date: {
    [date: string]: {
      [repo: string]: string
    }
  }

  recent_open_issues: Array<{
    issue_url: string
    created_at: string
    title: string
    user: string
  }>
  recent_closed_issues: Array<{
    issue_url: string
    created_at: string
    closed_at: string
    title: string
    user: string
  }>

  /**
   * The most recent 1,000 commits.
   * NOTE: non-meaningful commits messages are filtered out, e.g. wherever the
   * message contains "wip" or "bump"
   */
  recent_commits: Array<{
    repo: string // "org/repo-name"
    commit_url: string
    message: string
    date: string // "yyyy-mm-dd"
    author: string
  }>
}

const readAndParseOrEmptyArray = (filePath: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch (error) {
    return []
  }
}

/**
 * Go through every directory in "public/changelogs/*" (all named as a date) and
 * create "public/overview.json" based on the "public/changelogs/<date>/
 */
async function main() {
  const filesInDir = fs.readdirSync("public/changelogs")

  const overview: OverviewJson = {
    commit_graph_starting_date: "",
    commit_graph_ending_date: "",
    commit_graph: [],
    recent_commits: [],
    recent_closed_issues: [],
    recent_open_issues: [],
    version_released_on_date: {},
  }

  filesInDir.sort()

  for (const file of filesInDir) {
    const dir = `public/changelogs/${file}`
    const stat = fs.statSync(dir)
    if (!stat.isDirectory()) continue

    const commits = readAndParseOrEmptyArray(`${dir}/commits.json`) as Array<{
      repo: string // "org/repo-name"
      commit_url: string
      message: string
      date: string // "yyyy-mm-dd"
      author: string
    }>
    const closedIssues = readAndParseOrEmptyArray(`${dir}/issues_closed.json`)
    const openedIssues = readAndParseOrEmptyArray(`${dir}/issues_created.json`)

    // Add to recent_commits
    overview.recent_commits.push(
      ...commits.filter(
        (c) =>
          !c.message.toLowerCase().includes("wip") &&
          !c.message.toLowerCase().includes("bump") &&
          !c.author.toLowerCase().includes("bot")
      )
    )
    overview.recent_closed_issues.push(...closedIssues)
    overview.recent_open_issues.push(...openedIssues)

    // Search commits for version releases
    const version_release_commits = commits.filter((c) =>
      c.message.startsWith("chore(release):")
    )
    for (const release_commit of version_release_commits) {
      const version = release_commit.message.split(" ")[1]

      if (!overview.version_released_on_date[release_commit.date]) {
        overview.version_released_on_date[release_commit.date] = {}
      }

      const existing_version =
        overview.version_released_on_date[release_commit.date][
          release_commit.repo
        ]

      if (!existing_version || existing_version < version) {
        overview.version_released_on_date[release_commit.date][
          release_commit.repo
        ] = version
      }
    }

    // Add to commit_graph
    const date = file
    const count = commits.length
    overview.commit_graph.push(count)

    // Update commit_graph_starting_date and commit_graph_ending_date
    if (!overview.commit_graph_starting_date) {
      overview.commit_graph_starting_date = date
    }
    overview.commit_graph_ending_date = date
  }

  // Make sure the recently opened issues weren't closed
  overview.recent_open_issues = overview.recent_open_issues.filter(
    (open_issue) =>
      !overview.recent_closed_issues.some(
        (closed_issue) => closed_issue.issue_url === open_issue.issue_url
      )
  )

  overview.recent_closed_issues.sort(
    (a, b) => -1 * a.closed_at.localeCompare(b.closed_at)
  )
  overview.recent_open_issues.sort(
    (a, b) => -1 * a.created_at.localeCompare(b.created_at)
  )

  // Write overview.json
  fs.writeFileSync(
    "public/changelogs/overview.json",
    stringify(overview, null, "  ")
  )
}
main()
