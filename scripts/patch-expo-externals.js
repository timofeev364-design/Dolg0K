const fs = require('fs');
const path = require('path');

// Target file search paths relative to project root
const POSSIBLE_PATHS = [
    'node_modules/@expo/cli/build/src/start/server/metro/externals.js',
    // Handle monorepo structure where it might be hoisted
    '../../node_modules/@expo/cli/build/src/start/server/metro/externals.js',
];

function findExternalsFile() {
    // 1. Try resolving via Node resolution (most reliable)
    try {
        const expoCliPkg = require.resolve('@expo/cli/package.json');
        const expoCliRoot = path.dirname(expoCliPkg);
        const candidate = path.join(expoCliRoot, 'build/src/start/server/metro/externals.js');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    } catch (e) {
        // @expo/cli might not be installed yet or not found
    }

    // 2. Try hardcoded paths
    for (const p of POSSIBLE_PATHS) {
        const fullPath = path.resolve(process.cwd(), p);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    return null;
}

const filePath = findExternalsFile();

if (!filePath) {
    // Determine if we should fail or just warn
    // For postinstall, we usually warn if devDependencies aren't there yet (e.g. prod install)
    // But this is critical for local dev.
    console.log('[@babki/patch-expo] @expo/cli externals.js not found. Skipping patch.');
    // Exit 0 so we don't break install if it's not needed/available
    process.exit(0);
}

console.log(`[@babki/patch-expo] Found externals.js at: ${filePath}`);

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to find "node:module" in the file and replace with "module"
    // The issue is typically in the `externals` object or array
    // We strictly replace "node:<mod>" with "<mod>"

    // Check if patch is needed
    if (!content.includes('"node:')) {
        console.log('[@babki/patch-expo] No "node:" prefixes found. Already patched or not present.');
        process.exit(0);
    }

    const originalContent = content;
    // Replace "node:fs" with "fs", "node:path" with "path", etc.
    // We use a regex dealing with quotes to be safe.
    content = content.replace(/"node:([a-zA-Z0-9_\/]+)"/g, '"$1"');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('[@babki/patch-expo] Successfully patched remove "node:" prefixes.');
    } else {
        console.log('[@babki/patch-expo] content.replace did not change anything.');
    }

} catch (err) {
    console.error('[@babki/patch-expo] Error applying patch:', err);
    process.exit(1);
}
