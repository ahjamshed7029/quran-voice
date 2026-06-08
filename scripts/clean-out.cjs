/**
 * Robustly cleans the `out/` directory.
 * On Windows, it tries to rename the directory before deleting it to avoid EBUSY errors
 * when common processes (like VS Code, Explorer, or Terminals) have handles open.
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

if (fs.existsSync(outDir)) {
  const tmpName = `${outDir}_to_delete_${Date.now()}`;
  try {
    // Attempting to rename first is the most robust way to "unlock" a directory on Windows
    fs.renameSync(outDir, tmpName);
    console.log(`[clean-out] Renamed out/ to ${path.basename(tmpName)} to unlock it.`);
    
    // Now delete the renamed directory (can be done recursively)
    fs.rmSync(tmpName, { recursive: true, force: true });
    console.log('[clean-out] Successfully removed old contents.');
  } catch (err) {
    // If rename fails, it means the directory itself is heavily locked (e.g. current working directory)
    // Fallback to cleaning children one by one
    console.log('[clean-out] out/ is locked; attempting to clean contents individually...');
    const items = fs.readdirSync(outDir);
    for (const item of items) {
      try {
        fs.rmSync(path.join(outDir, item), { recursive: true, force: true });
      } catch (e) {
        // ignore locked files — Next.js will overwrite them
      }
    }
  }
} else {
  console.log('[clean-out] out/ directory does not exist — skipping.');
}
