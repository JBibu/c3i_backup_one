# Keeping in Sync with Upstream zerobyte

This fork of zerobyte (c3i_backup_one) maintains synchronization with the original project while adding desktop application support via Tauri.

## Quick Sync

Run the sync script to check for and merge upstream changes:

```bash
./sync-upstream.sh
```

## Manual Sync

If you prefer to sync manually:

```bash
# 1. Fetch latest upstream changes
git fetch upstream

# 2. Check what's new
git log HEAD..upstream/main

# 3. Merge upstream changes
git merge upstream/main

# 4. Resolve any conflicts if needed
# ... make changes ...
git add .
git commit -m "Resolve merge conflicts"

# 5. Push to your fork
git push origin main
```

## Current Status

- **Upstream Repository**: https://github.com/nicotsx/zerobyte
- **Fork Repository**: https://github.com/JBibu/c3i_backup_one
- **Base Commit**: `c75e5cb` (chore(deps): bump the minor-patch group with 9 updates)
- **Divergence**: Fork adds Tauri desktop app, Windows Service support, and cross-platform binaries

## What Gets Merged

When syncing with upstream, you'll get:
- Bug fixes from the original zerobyte project
- New features added to the core backup functionality
- Performance improvements
- Security patches
- Documentation updates

## What Stays Unique

The following additions in c3i_backup_one are preserved:
- `/src-tauri/` - Complete Tauri desktop application
- `/scripts/` - Build and Windows Service installation scripts
- `WINDOWS_SERVICE.md` - Windows deployment guide
- Tauri-specific UI components (titlebar, contexts, etc.)
- Cross-platform build configurations

## Handling Conflicts

Conflicts may arise in:
- **package.json** - Different scripts and dependencies (keep both, favor Tauri additions)
- **Component files** - Upstream UI changes vs Tauri customizations (merge carefully)
- **Server utilities** - Path handling differences (Windows compatibility must be maintained)
- **Configuration files** - Environment variables (keep C3I_BACKUP_ONE_* naming)

### Conflict Resolution Strategy

1. **Always preserve Tauri functionality** - Don't remove desktop app features
2. **Keep Windows compatibility** - Maintain Windows Service and path handling
3. **Merge UI improvements** - Accept upstream UI/UX enhancements when possible
4. **Test thoroughly** - Run tests and build Tauri app after merging

## Automated Sync (Optional)

To automatically check for upstream updates daily:

```bash
# Add to crontab (crontab -e)
0 9 * * * cd /home/javi/Git/c3i_backup_one && git fetch upstream && git log --oneline HEAD..upstream/main | head -5 | mail -s "c3i_backup_one: Upstream updates available" your@email.com
```

## Remote Configuration

```bash
# View configured remotes
git remote -v

# Expected output:
# origin    git@github.com:JBibu/c3i_backup_one.git (fetch)
# origin    git@github.com:JBibu/c3i_backup_one.git (push)
# upstream  https://github.com/nicotsx/zerobyte.git (fetch)
# upstream  https://github.com/nicotsx/zerobyte.git (push)
```

## Version Tracking

After merging upstream changes:

1. Check the latest upstream version tag:
   ```bash
   git describe --tags upstream/main
   ```

2. Update your fork's version in `package.json` and `src-tauri/tauri.conf.json`

3. Tag your release:
   ```bash
   git tag -a v0.X.X -m "Merge upstream v0.22.0 + Tauri enhancements"
   git push origin --tags
   ```

## Testing After Sync

Always test after merging upstream changes:

```bash
# 1. Install dependencies (in case of package.json changes)
bun install

# 2. Run type checking
bun run tsc

# 3. Run tests
bun run test

# 4. Test Docker build (core functionality)
bun run start:dev

# 5. Test Tauri build (desktop app)
bun run tauri:dev

# 6. Build sidecar for Windows Service
bun run build:sidecar
```

## Getting Help

If you encounter issues during sync:

1. Check this guide for conflict resolution strategies
2. Review the original zerobyte changelog
3. Test in a separate branch first:
   ```bash
   git checkout -b sync-upstream-test
   git merge upstream/main
   # Test thoroughly
   git checkout main
   git merge sync-upstream-test
   ```

## Contributing Back to Upstream

If you fix bugs that apply to the core zerobyte functionality (not Tauri-specific):

1. Create a separate branch with just the fix
2. Submit a PR to https://github.com/nicotsx/zerobyte
3. Once merged upstream, it will come back in the next sync
