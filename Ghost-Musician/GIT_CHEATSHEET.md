# Ghost Musician | GitHub – Companion SOP

## One-time setup (already done)
```powershell
git init
git remote add origin https://github.com/AetherWave-Studio/ghost-musician.git
git branch -M main
git push -u origin main
```

## Daily start (sync before work)
```powershell
git status
git pull origin main
```

## Make & save changes
```powershell
git add .
git commit -m "Describe your change"
git push
```

## Inspect & undo (safely)
```powershell
git log --oneline --graph
git diff
git restore <file>
git restore --staged <file>
```

## Working with branches (feature flow)
```powershell
git checkout -b feature/my-change
git push -u origin feature/my-change
git checkout main
git pull origin main
git branch -d feature/my-change
git push origin --delete feature/my-change
```

## Stashing (quickly shelve WIP)
```powershell
git stash
git pull origin main
git stash pop
```

## Remotes (verify/fix)
```powershell
git remote -v
git remote set-url origin https://github.com/AetherWave-Studio/ghost-musician.git
```

## Ignore the right stuff
```
node_modules
dist
.DS_Store
server/public
vite.config.ts.*
*.tar.gz
```

Tip: after editing `.gitignore`, if something was already tracked:
```powershell
git rm -r --cached node_modules dist server/public
git commit -m "chore: stop tracking build artifacts"
git push
```

## Handling pull blocked (local edits)
```powershell
git add .
git commit -m "WIP"
git pull origin main
# resolve conflicts if any
git add .
git commit -m "Resolve merge conflicts"
git push
```

## Version pins & releases (optional)
```powershell
git tag v0.1.0
git push origin v0.1.0
```

## Global identity (one-time per machine)
```powershell
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```
