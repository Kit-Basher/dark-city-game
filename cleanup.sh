#!/bin/bash

# Create a backup branch first
git checkout -b backup/cleanup-$(date +%Y%m%d)

# Remove temporary files
rm -f double-check.html \
   example-workaround.html \
   fix-json-parser.sh \
   nuclear-fix.md \
   NUCLEAR-FIX.sh \
   other-session-test.txt \
   permanent-fix.md \
   reinstall-test.html \
   system-patch-procedure.md \
   test-file.txt \
   test-restart.html \
   tool-call-error-report.md

# Add all changes
git add .

# Commit the cleanup
git commit -m "Clean up temporary and test files"

echo "Cleanup complete. Changes are on branch 'backup/cleanup-$(date +%Y%m%d)'"
echo "To merge these changes into master, run:"
echo "  git checkout master && git merge backup/cleanup-$(date +%Y%m%d)"
