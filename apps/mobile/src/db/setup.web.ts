/**
 * Web Database setup (stub)
 * Заглушка для веба, так как мы используем localStorage напрямую в репозиториях/адаптере
 */

// Mock types needed for exports
export type AppDatabase = any;

export function getDatabase() {
    console.warn('getDatabase called on web - this should not happen if repositories are web-aware');
    return null;
}

export async function initDatabase(): Promise<void> {
    console.log('Database init skipped on web (using localStorage)');
}

export async function clearAllData(): Promise<void> {
    console.log('Clearing localStorage data...');
    if (typeof localStorage !== 'undefined') {
        localStorage.clear();
    }
}
