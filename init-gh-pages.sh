#!/bin/bash
# Script to initialize the gh-pages branch for GitHub Pages deployment

set -e

echo "🚀 Initializing gh-pages branch for GitHub Pages..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if gh-pages branch already exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "⚠️  gh-pages branch already exists locally"
    read -p "Do you want to recreate it? This will delete the existing branch. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    git branch -D gh-pages
fi

# Check if gh-pages exists on remote
if git ls-remote --heads origin gh-pages | grep -q gh-pages; then
    echo "⚠️  gh-pages branch exists on remote"
    read -p "Do you want to recreate it? This will delete the remote branch. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    git push origin --delete gh-pages
fi

# Create orphan gh-pages branch
echo "📝 Creating orphan gh-pages branch..."
git checkout --orphan gh-pages

# Remove all files from the index
git rm -rf .

# Create initial files
echo "# GitHub Pages" > README.md
touch .nojekyll

# Create a simple directory structure
mkdir -p pr

# Add and commit
git add README.md .nojekyll pr/.gitkeep
echo "pr/.gitkeep" >> pr/.gitkeep  # Create .gitkeep to track empty directory
git add pr/.gitkeep
git commit -m "Initialize gh-pages branch"

# Push to remote
echo "⬆️  Pushing gh-pages branch to remote..."
git push -u origin gh-pages

# Return to original branch
echo "↩️  Returning to $CURRENT_BRANCH branch..."
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ gh-pages branch initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repository Settings → Pages"
echo "2. Set Source to 'Deploy from a branch'"
echo "3. Select the 'gh-pages' branch with '/ (root)' folder"
echo "4. Save the settings"
echo ""
echo "Your site will be available at: https://<username>.github.io/<repo>/"
