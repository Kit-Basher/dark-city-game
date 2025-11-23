# Dark City RPG Game Hub

A modern, responsive website for managing your Dark City tabletop RPG game using GitHub Pages.

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Character Sheets**: Players can submit character sheets via GitHub Issues
- **Scene Tracking**: Game masters can track and organize game scenes
- **Community Calendar**: Visual calendar showing character activities and scenes
- **Rules Repository**: Easy access to game rules and reference materials
- **Free Hosting**: Powered by GitHub Pages (no cost!)

## Quick Setup

### 1. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository named `dark-city-game`
2. Make it **Public** (required for free GitHub Pages)
3. Upload all files from this project to your repository

### 2. Enable GitHub Pages
1. Go to your repository settings
2. Scroll down to "Pages" section
3. Under "Build and deployment", select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

Your site will be available at: `https://[your-username].github.io/dark-city-game/`

### 3. Configure GitHub Issues
Create issue templates for character sheets and scenes:

1. Create `.github/ISSUE_TEMPLATE/character-sheet.md`:
```markdown
---
name: Character Sheet
about: Submit a new character sheet
title: "[Character] "
labels: character-sheet
assignees: ''
---

Copy and paste the character sheet template from `characters/template.md`
```

2. Create `.github/ISSUE_TEMPLATE/scene.md`:
```markdown
---
name: Scene
about: Submit a new game scene
title: "[Scene] "
labels: scene
assignees: ''
---

Copy and paste the scene template from `scenes/template.md`
```

### 4. Update Configuration
Edit `js/app.js` and replace `yourusername` with your actual GitHub username:

```javascript
const REPO_OWNER = 'yourusername'; // Replace with your GitHub username
```

## How It Works

### Character Sheets
- Players submit character sheets through GitHub Issues
- Each issue is labeled "character-sheet"
- The website automatically displays all character sheets
- Character activities are tracked in the calendar

### Scene Tracking
- Game masters submit scenes through GitHub Issues
- Each issue is labeled "scene"
- Scenes appear in the scene tracker and calendar
- Date information is extracted for calendar display

### Calendar System
- Automatically pulls data from character sheets and scenes
- Shows what each character is doing on any given day
- Visual indicators for days with events
- Navigate between months easily

## Customization

### Styling
- Edit `css/style.css` to customize colors, fonts, and layout
- The current theme uses a dark, urban aesthetic suitable for "Dark City"

### Content
- Add your game rules to the `rules/` directory
- Update the hero image in `index.html`
- Modify the navigation menu as needed

### Advanced Features
- Add GitHub Actions for automated workflows
- Integrate with Discord bot for notifications
- Use GitHub Discussions for player communication

## File Structure

```
dark-city-game/
├── index.html          # Main page
├── css/
│   └── style.css       # Styling
├── js/
│   └── app.js          # JavaScript functionality
├── characters/
│   └── template.md     # Character sheet template
├── scenes/
│   └── template.md     # Scene tracking template
├── images/             # Game images and assets
├── rules/              # Game rules documentation
└── README.md           # This file
```

## Maintenance

### Regular Tasks
- Review and approve character sheet submissions
- Update scenes as they're completed
- Add new rules and reference materials
- Monitor GitHub Issues for player questions

### Backups
- All content is version-controlled with Git
- GitHub provides automatic backups
- You can clone the repository locally for additional backup

## Support

For help with:
- **GitHub Pages**: [GitHub Pages Documentation](https://docs.github.com/en/pages)
- **GitHub Issues**: [GitHub Issues Documentation](https://docs.github.com/en/issues)
- **Web Development**: Check the code comments in the files

## License

This project is open source. Feel free to modify and distribute for your own games!

---

**Happy Gaming! 🎲**
