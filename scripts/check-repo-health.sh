#!/bin/bash
# Repository size monitoring script

echo "=== SuperstudentHTML Repository Health Check ==="
echo

echo "📊 Repository Statistics:"
echo "  - Git repository size: $(du -sh .git/ | cut -f1)"
echo "  - Working directory size (excluding node_modules): $(du -sh --exclude=node_modules --exclude=.git . | cut -f1)"
echo "  - Total tracked files: $(git ls-files | wc -l)"
echo

echo "🔍 Large tracked files (>10KB):"
git ls-files --cached | xargs ls -la 2>/dev/null | awk '$5 > 10240 {printf "  - %s: %s\n", $9, $5}' | sort -k3 -nr | head -10
echo

echo "⚠️  Files that should not be tracked:"
git ls-files | grep -E "\.(db|vsidx|sqlite|suo|user|log|tmp|bak)$" | head -10
if [ $? -eq 0 ]; then
    echo "  ^ These files should be added to .gitignore"
else
    echo "  ✅ No problematic files found"
fi
echo

echo "📦 Node modules status:"
if [ -d "node_modules" ]; then
    echo "  - Present: $(du -sh node_modules | cut -f1)"
    if git ls-files | grep -q "node_modules/"; then
        echo "  ⚠️  WARNING: node_modules files are being tracked!"
    else
        echo "  ✅ Properly ignored"
    fi
else
    echo "  - Not installed (run 'npm install')"
fi
echo

echo "🏗️  Build artifacts:"
if [ -d "dist" ]; then
    echo "  - Present: $(du -sh dist | cut -f1)"
    if git ls-files | grep -q "dist/"; then
        echo "  ⚠️  WARNING: dist files are being tracked!"
    else
        echo "  ✅ Properly ignored"
    fi
else
    echo "  - Not built (run 'npm run build')"
fi