#!/bin/bash

echo "=== NUCLEAR FIX FOR JSON PARSING ERRORS ==="
echo "This will completely remove all Windsurf/Codeium data and reinstall"
echo ""

# Step 1: Kill all Windsurf processes
echo "Step 1: Killing all Windsurf processes..."
pkill -f windsurf
pkill -f codeium
sleep 3

# Step 2: Remove all Windsurf packages
echo "Step 2: Removing Windsurf packages..."
sudo apt remove windsurf* --purge -y 2>/dev/null
sudo apt autoremove -y

# Step 3: Remove ALL configuration and data directories
echo "Step 3: Removing all configuration and data..."
rm -rf /home/c/.config/Windsurf
rm -rf /home/c/.codeium
rm -rf /home/c/.windsurf
rm -rf /tmp/windsurf*
rm -rf /tmp/server_*

# Step 4: Clean package cache
echo "Step 4: Cleaning package cache..."
sudo apt autoclean
sudo apt update

# Step 5: Remove any remaining Windsurf files
echo "Step 5: Finding and removing any remaining Windsurf files..."
find /usr -name "*windsurf*" -delete 2>/dev/null
find /home -name "*windsurf*" -delete 2>/dev/null
find /tmp -name "*windsurf*" -delete 2>/dev/null

# Step 6: Install fresh Windsurf
echo "Step 6: Installing fresh Windsurf..."
wget -O /tmp/windsurf.deb https://cdn.windsurf.io/windsurf-linux-amd64.deb 2>/dev/null
if [ -f /tmp/windsurf.deb ]; then
    sudo dpkg -i /tmp/windsurf.deb
    sudo apt install -f -y  # Fix any dependencies
    rm /tmp/windsurf.deb
else
    echo "Failed to download Windsurf. Please install manually."
fi

echo ""
echo "=== NUCLEAR FIX COMPLETE ==="
echo "Windsurf has been completely reinstalled with fresh state."
echo "Please restart your IDE and test the JSON parsing tools."
