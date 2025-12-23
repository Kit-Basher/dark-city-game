# Permanent Fix for JSON Parser Corruption

## Root Cause Analysis

### Why It Happens:
1. **SQLite Database Corruption** - Windsurf stores session state in SQLite databases (`state.vscdb`)
2. **Binary Data Corruption** - Tool call JSON parameters get corrupted in binary format
3. **Persistent Storage** - Corruption survives restarts because it's written to disk
4. **No Validation** - System doesn't detect corrupted JSON before parsing

### Storage Locations:
- `/home/c/.config/Windsurf/User/globalStorage/state.vscdb` (SQLite database)
- `/home/c/.config/Windsurf/User/workspaceStorage/*/state.vscdb` (workspace-specific)
- `/home/c/.codeium/windsurf/context_state` (Codeium state)

## Permanent Prevention Measures

### 1. Automated State Cleanup
Create a script to automatically clear corrupted state:

```bash
#!/bin/bash
# Clear corrupted Windsurf state
rm -f /home/c/.config/Windsurf/User/globalStorage/state.vscdb
rm -f /home/c/.config/Windsurf/User/workspaceStorage/*/state.vscdb
rm -rf /home/c/.codeium/windsurf/context_state
```

### 2. Session Isolation
- Use separate workspace directories for different projects
- Avoid sharing sessions between complex tasks

### 3. Prevention Commands
Run this before complex operations:
```bash
find /home/c/.config/Windsurf -name "state.vscdb" -delete
rm -rf /home/c/.codeium/windsurf/context_state
```

### 4. Monitor for Corruption
Watch for JSON parsing errors and immediately clear state

## Why It Keeps Coming Back
The SQLite databases store tool call state in binary format. When this gets corrupted, every new session loads the corrupted data, causing immediate JSON parsing failures.

## Final Solution
The issue requires a patch from Windsurf developers to:
1. Add JSON validation before storing to database
2. Implement automatic corruption detection
3. Add database repair mechanisms
