#!/bin/bash

# Sync c3i_backup_one with upstream zerobyte repository
# This script fetches and merges the latest changes from the original zerobyte project

set -e

echo "🔄 Syncing with upstream zerobyte repository..."
echo ""

# Check if upstream remote exists, add it if not
if ! git remote | grep -q "^upstream$"; then
    echo "📌 Adding upstream remote..."
    git remote add upstream https://github.com/nicotsx/zerobyte.git
    echo "✅ Upstream remote added"
else
    echo "✅ Upstream remote already configured"
fi

echo ""
echo "📥 Fetching latest changes from upstream..."
git fetch upstream

echo ""
echo "🔍 Checking for new commits..."
COMMITS_BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "0")

if [ "$COMMITS_BEHIND" = "0" ]; then
    echo "✅ Already up to date with upstream!"
else
    echo "📊 Found $COMMITS_BEHIND new commit(s) in upstream"
    echo ""
    echo "Recent upstream commits:"
    git log --oneline HEAD..upstream/main | head -10
    echo ""

    read -p "Do you want to merge these changes? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔀 Merging upstream changes..."
        git merge upstream/main -m "Merge upstream zerobyte changes"
        echo "✅ Merge completed successfully!"
        echo ""
        echo "📝 Don't forget to test the changes and push to your fork:"
        echo "   git push origin main"
    else
        echo "❌ Merge cancelled"
    fi
fi

echo ""
echo "📊 Repository status:"
echo "   - Upstream (zerobyte): $(git rev-parse --short upstream/main)"
echo "   - Local (c3i_backup_one): $(git rev-parse --short HEAD)"
echo "   - Commits ahead of upstream: $(git rev-list --count upstream/main..HEAD)"
echo ""
echo "✨ Done!"
