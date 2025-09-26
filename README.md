## Deploying to GitHub Pages

This project is a static site (plain `index.html`, `styles.css`, `script.js`). A GitHub Actions workflow is included to publish it to GitHub Pages from the `main` branch.

### One-time repo setup
1. Push this repository to GitHub.
2. In your repository, go to Settings → Pages.
3. Set Source to "GitHub Actions" (if not already).

### How deployment works
- On every push to `main`, the workflow at `.github/workflows/deploy-pages.yml` runs.
- It copies `index.html`, `styles.css`, and `script.js` into `dist/` and publishes that folder.
- A `.nojekyll` file is included so Pages serves files as-is.

### Accessing the site
After the first successful run, the deployment job outputs the site URL under the GitHub Actions run summary (also shown in Settings → Pages). It will look like:

- User site: `https://<username>.github.io/<repo>/`

If you use a custom domain, configure it in Settings → Pages.

### Local development
Open `index.html` directly in a browser or serve with a simple static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.
