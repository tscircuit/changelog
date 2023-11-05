import fs from "fs"
import stringify from "safe-stable-stringify"

type OverviewJson = {
  commit_graph_starting_date: string
  commit_graph_ending_date: string
  /**
   * Each number represents the number of commits on that day
   */
  commit_graph: number[]

  /**
   * The most recent 1,000 commits.
   * NOTE: non-meaningful commits messages are filtered out, e.g. wherever the
   * message contains "wip"
   */
  recent_commits: Array<{
    repo: string // "org/repo-name"
    commit_url: string
    message: string
    date: string // "yyyy-mm-dd"
  }>
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
  }

  filesInDir.sort()

  for (const file of filesInDir) {
    const dir = `public/changelogs/${file}`
    const stat = fs.statSync(dir)
    if (!stat.isDirectory()) continue

    const commits = JSON.parse(
      fs.readFileSync(`${dir}/commits.json`, "utf8")
    ) as Array<{
      repo: string // "org/repo-name"
      commit_url: string
      message: string
      date: string // "yyyy-mm-dd"
    }>

    // Add to recent_commits
    overview.recent_commits.push(
      ...commits.filter((c) => !c.message.toLowerCase().includes("wip"))
    )

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

  // Write overview.json
  fs.writeFileSync("public/changelogs/overview.json", stringify(overview))
}
main()
