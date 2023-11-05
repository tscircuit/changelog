import { getRecentCommits } from "../lib/get-recent-commits"
import { getRepos } from "../lib/get-repos"

async function main() {
  // const repos = await getRepos()
  // console.log(repos)
  console.log(
    await getRecentCommits({
      name: "builder",
      org: "tscircuit",
    })
  )
}
main()
