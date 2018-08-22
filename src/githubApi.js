import 'whatwg-fetch'
import { ULEX_FULL_NAME, ULEX_REPO_NAME, README_PATH } from './constants'

const githubApi = (accessToken, username) => {
  const methods = {
    githubFetch: (path, params = '', method = 'GET') =>
      fetch(
        `https://api.github.com${path}?access_token=${accessToken}${params}`,
        { method },
      )
        .then(resp => resp.json())
        .catch(console.error),
    getRepos: (page = 1) =>
      methods.githubFetch('/user/repos', '&per_page=100&page=' + page),
    getUlexForks: () =>
      methods.githubFetch(`/repos/${ULEX_FULL_NAME}/forks`, '&per_page=100'),
    forkedUlex: async () => {
      const ulexForks = await methods.getUlexForks()
      return ulexForks.find(fork => fork.full_name === username + '/Ulex')
    },
    forkUlex: () =>
      methods.githubFetch(`/repos/${ULEX_FULL_NAME}/forks`, '', 'POST'),
    getReadme: () =>
      methods.githubFetch(
        `/repos/${username}/${ULEX_REPO_NAME}/contents/${README_PATH}`,
      ),
  }
  return methods
}

export default githubApi
