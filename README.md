# Branch Protection Action

This template includes tests, linting, a validation workflow, publishing, and versioning guidance.

## Usage

```yaml
uses: LEDBrain/branch-protection-action@v1.0.0
with:
    # Optional: branch to lift the restriction on; defaults to the current branch
    branch: main
    # Required
    token: ${{ secrets.GH_PAT }}
```

## Code in Main

Install the dependencies

```bash
npm install
```

Run prepare script before commit

```bash
npm run prepare
```

## Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos. Packaging the action will create a packaged action in the dist folder.

Run prepare

```bash
npm run prepare
```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

## Create a release branch

Users shouldn't consume the action from master since that would be latest code and actions can break compatibility between major versions.

Checkin to the v1 release branch

```bash
git checkout -b v1
git commit -a -m "release: <commit>"
```

```bash
git push origin v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

We try to stick to this (see above)

![actions-release-schema](./.github/action-releases.png)
