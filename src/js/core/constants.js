// Shared runtime constants for src/js/core — extracted from main.js to reduce
// coupling and make values centralised / localisable.

export const LEVEL_COMPLETION_DELAY_MS = 3000;
export const MAX_RETRY_ATTEMPTS = 3;
export const LEVEL_SEQUENCE = ['colors', 'shapes', 'alphabet', 'numbers', 'clcase', 'phonics'];

// Repeated DOM id literal — hoisted so it lives in one place.
export const LEVEL_MENU_CONTAINER_ID = 'level-menu-container';
