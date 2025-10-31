## Deploying to GitHub Pages

This project is a static site (plain `index.html`, `styles.css`, `script.js`). GitHub Actions workflows are included to publish it to GitHub Pages from the `main` branch and deploy PR previews.

### One-time repo setup
1. Push this repository to GitHub.
2. Create an empty `gh-pages` branch:
   
   **Option A: Use the initialization script (recommended)**
   ```bash
   ./init-gh-pages.sh
   ```
   
   **Option B: Manual setup**
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   echo "# GitHub Pages" > README.md
   touch .nojekyll
   mkdir -p pr
   git add README.md .nojekyll
   git commit -m "Initialize gh-pages branch"
   git push origin gh-pages
   git checkout main
   ```

3. In your repository, go to Settings → Pages.
4. Set Source to "Deploy from a branch" and select the `gh-pages` branch with `/ (root)` folder.

### How deployment works

#### Main branch deployment
- On every push to `main`, the workflow at `.github/workflows/deploy-pages.yml` runs.
- It copies `index.html`, `styles.css`, and `script.js` to the root of the `gh-pages` branch.
- A `.nojekyll` file ensures GitHub Pages serves files as-is.

#### PR preview deployments
- When a PR is marked as ready for review, the workflow at `.github/workflows/pr-preview.yml` runs.
- It deploys the PR content to `pr/<pr-number>/` on the `gh-pages` branch.
- A comment is automatically added to the PR with the preview URL.
- The preview is updated automatically with each new commit.
- When the PR is closed, the preview is automatically cleaned up.

### Accessing the site

After the first successful run, your sites will be available at:

- Main site: `https://<username>.github.io/<repo>/`
- PR preview: `https://<username>.github.io/<repo>/pr/<pr-number>/`

For example, if your repo is `magnusbakken/time-tracking-converter`:
- Main: `https://magnusbakken.github.io/time-tracking-converter/`
- PR #123: `https://magnusbakken.github.io/time-tracking-converter/pr/123/`

If you use a custom domain, configure it in Settings → Pages.

### Local development
Open `index.html` directly in a browser or serve with a simple static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.
