#!/bin/bash
# Setup script for git hooks to maintain repository quality

echo "🔧 Setting up git hooks for SuperstudentHTML..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for SuperstudentHTML

echo "🔍 Running pre-commit checks..."

# Check for large files (>1MB)
large_files=$(git diff --cached --name-only | xargs ls -la 2>/dev/null | awk '$5 > 1048576 {print $9}')
if [ ! -z "$large_files" ]; then
    echo "❌ Large files detected (>1MB). Consider using Git LFS:"
    echo "$large_files"
    echo "To bypass this check, use: git commit --no-verify"
    exit 1
fi

# Check for IDE files
ide_files=$(git diff --cached --name-only | grep -E "\.(db|vsidx|sqlite|suo|user)$")
if [ ! -z "$ide_files" ]; then
    echo "❌ IDE-specific files detected:"
    echo "$ide_files"
    echo "These should be added to .gitignore"
    echo "To bypass this check, use: git commit --no-verify"
    exit 1
fi

# Check for common mistake files
mistake_files=$(git diff --cached --name-only | grep -E "(Error\.jpg|debug\.png|temp\.|\.tmp|\.log)$")
if [ ! -z "$mistake_files" ]; then
    echo "❌ Temporary/debug files detected:"
    echo "$mistake_files"
    echo "These files should not be committed"
    echo "To bypass this check, use: git commit --no-verify"
    exit 1
fi

# Run linting if available and files changed
js_files=$(git diff --cached --name-only | grep "\.js$")
if [ ! -z "$js_files" ] && [ -f "package.json" ] && npm list eslint > /dev/null 2>&1; then
    echo "🔍 Running ESLint..."
    if ! npm run lint; then
        echo "❌ Linting failed. Fix errors before committing."
        echo "To bypass this check, use: git commit --no-verify"
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed!"
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks setup complete!"
echo
echo "The following hooks are now active:"
echo "  - pre-commit: Prevents large files, IDE files, and linting errors"
echo
echo "To bypass hooks temporarily, use: git commit --no-verify"