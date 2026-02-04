# Developer Guide (Windows)

## Prerequisites
- Node.js (v18+ recommended)
- Git
- VS Code (recommended)

## Quick Start (Golden Commands)

Run these commands from the **root** of the repository:

### 1. Install Dependencies
```powershell
npm install
```
*Note: This automatically runs a postinstall patch for Windows compatibility.*

### 2. Typecheck (Mobile)
```powershell
npm run mobile:typecheck
```
*Runs TypeScript compiler without emitting files.*

### 3. Run Tests (Mobile)
```powershell
npm run mobile:test
```
*Runs Jest tests.*

### 4. Start Web Version (Mobile)
```powershell
npm run mobile:web
```
*Starts Expo Web server.*

## Troubleshooting

### Windows Specific Issues
- **Command not found**: Ensure you are running commands from the root directory.
- **'cnpm' is not recognized**: Use `npm` instead.
- **Node:sea error**: If you encounter errors related to `node:sea` (Node 24+), run `node scripts/postinstall-patch.js` manually or reinstall dependencies.

### Cleaning the Project
If you have weird errors, try a clean install:
```powershell
rm -r -fo node_modules
rm -r -fo apps/mobile/node_modules
rm -r -fo package-lock.json
npm install
```
