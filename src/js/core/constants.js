// Shared runtime constants for src/js/core — extracted from main.js to reduce
// coupling and make values centralised / localisable.

export const LEVEL_COMPLETION_DELAY_MS = 3000;
export const MAX_RETRY_ATTEMPTS = 3;
export const LEVEL_SEQUENCE = ['colors', 'shapes', 'alphabet', 'numbers', 'clcase', 'phonics'];

// Repeated DOM id literal — hoisted so it lives in one place.
export const LEVEL_MENU_CONTAINER_ID = 'level-menu-container';

// Repeated DOM id literals (≥3× in main.js) — hoisted so markup strings are
// centralised and cannot drift between create / query / testid sites.
export const ERROR_CONTAINER_ID = 'error-container';
export const COMPLETION_SCREEN_ID = 'completion-screen';
export const LEVEL_LOADING_OVERLAY_ID = 'level-loading-overlay';
export const SETTINGS_MODAL_ID = 'settings-modal';

// Custom-event type string used by the performance monitor and consumed by
// the runtime + resource optimizer. Hoisted so the name lives in one place.
export const PERFORMANCE_LEVEL_CHANGED_EVENT = 'PerformanceLevelChanged';
