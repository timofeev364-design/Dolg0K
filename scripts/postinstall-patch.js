/**
 * Postinstall patcher for Node24/Expo compatibility on Windows
 * Fixes "node:sea" error that may occur with newer Node versions
 */

const fs = require('fs');
const path = require('path');

const PATCHES = [
    {
        // Fix for @expo/cli sea module issue on Node 24+
        file: 'node_modules/@expo/cli/build/src/utils/nodeVersion.js',
        search: /process\.versions\.node/g,
        replace: '(process.versions.node || "18.0.0")'
    }
];

function applyPatches() {
    console.log('🔧 Running postinstall patches...');

    let patchedCount = 0;

    for (const patch of PATCHES) {
        const filePath = path.join(process.cwd(), patch.file);

        if (!fs.existsSync(filePath)) {
            // File doesn't exist, skip silently (dependency might not be installed yet)
            continue;
        }

        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            content = content.replace(patch.search, patch.replace);

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`  ✅ Patched: ${patch.file}`);
                patchedCount++;
            }
        } catch (err) {
            console.warn(`  ⚠️ Could not patch ${patch.file}: ${err.message}`);
        }
    }

    if (patchedCount === 0) {
        console.log('  ℹ️ No patches needed');
    } else {
        console.log(`  ✅ Applied ${patchedCount} patch(es)`);
    }
}

applyPatches();
