# gh-performyard

A tiny node.js app which collects dev stats from Github. For the _specified_ repository, the following details are generated:

- Total number of PRs raised by the _specified_ user
- PR Title
- PR Description
- Time taken to merge
- Total number of PRs reviewed by the _specified_ user

### STEP 1
Create Github Personal Access Token with SSO enabled.

https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line#creating-a-token

### STEP 2
Update `config.js`

```js
module.exports = {
  GITHUB_AUTH_TOKEN: 'YOUR_TOKEN_HERE',
  GITHUB_ORG: 'freshdesk',
  GITHUB_REPO: 'nucleus',
  GITHUB_USER: 'shibulijack-fd',
  PR_BASE_BRANCH: 'master',
  PR_STATE: 'closed'
}
```

### STEP 3

Run the node.js script to generate stats from Github since Jan 1, 2019.

```
npm start
```
