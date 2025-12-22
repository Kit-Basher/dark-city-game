#!/bin/bash
echo "Clearing corrupted JSON parser state..."

# Kill Windsurf processes
pkill -f windsurf
sleep 2

# Remove corrupted SQLite databases
find /home/c/.config/Windsurf -name "state.vscdb*" -delete 2>/dev/null
rm -rf /home/c/.codeium/windsurf/context_state 2>/dev/null

# Clear workspace storage corruption
find /home/c/.config/Windsurf/User/workspaceStorage -name "*.backup" -delete 2>/dev/null

echo "State cleared. Restart Windsurf when ready."
