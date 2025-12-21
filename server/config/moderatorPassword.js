const fs = require('fs').promises;
const path = require('path');

const PASSWORD_FILE = path.join(__dirname, 'moderator-password.txt');
const DEFAULT_PASSWORD = 'test123';

let cachedPassword = null;

async function loadPasswordFromFile() {
  try {
    const data = await fs.readFile(PASSWORD_FILE, 'utf8');
    const trimmed = data.trim();
    if (trimmed) {
      cachedPassword = trimmed;
      return trimmed;
    }
  } catch (error) {
    // Ignore missing file; fallback to env/default.
  }

  const envPassword = process.env.MODERATOR_PASSWORD;
  if (envPassword) {
    cachedPassword = envPassword;
    return envPassword;
  }

  cachedPassword = DEFAULT_PASSWORD;
  return DEFAULT_PASSWORD;
}

async function getModeratorPassword() {
  if (cachedPassword) {
    return cachedPassword;
  }
  return loadPasswordFromFile();
}

async function setModeratorPassword(newPassword) {
  await fs.mkdir(path.dirname(PASSWORD_FILE), { recursive: true });
  await fs.writeFile(PASSWORD_FILE, newPassword, 'utf8');
  cachedPassword = newPassword;
  return newPassword;
}

module.exports = {
  getModeratorPassword,
  setModeratorPassword,
  DEFAULT_PASSWORD
};
