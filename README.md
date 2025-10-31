## Deploying to GitHub Pages

This is a React application built with Vite and styled with Tailwind CSS. GitHub Actions workflows are included to build and publish the app to GitHub Pages from the `main` branch and deploy PR previews.

### One-time repo setup

1. Push this repository to GitHub.

2. **(Optional)** Pre-create the `gh-pages` branch:
   
   The workflows will automatically create the `gh-pages` branch on the first deployment if it doesn't exist. However, if you prefer to set it up manually first:
   
   **Option A: Use the initialization script**
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
   
   **Note:** If the `gh-pages` branch hasn't been created yet, you'll need to wait for the first deployment to run (by pushing to `main` or opening a PR). After the first deployment, the branch will appear and you can configure it in Settings → Pages.

### How deployment works

#### Main branch deployment
- On every push to `main`, the workflow at `.github/workflows/deploy-pages.yml` runs.
- It installs dependencies, runs tests, and builds the React app using Vite.
- The built files from the `dist/` directory are copied to the root of the `gh-pages` branch.
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

#### Install dependencies
```bash
npm install
```

#### Run development server
```bash
npm run dev
```
Then visit `http://localhost:5173`

#### Run tests
```bash
npm test
```

#### Build for production
```bash
npm run build
```

#### Preview production build
```bash
npm run preview
```

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **dayjs** - Date manipulation
- **xlsx** - Excel file reading/writing
- **react-datepicker** - Date picker component
