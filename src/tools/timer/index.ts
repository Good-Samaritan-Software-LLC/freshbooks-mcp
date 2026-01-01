/**
 * Timer Tools Module
 *
 * Exports all timer-related tools for time tracking.
 * Note: Timer is not a standalone resource in FreshBooks.
 * All timer operations are implemented through TimeEntry operations.
 */

// Tool definitions
export { timerStartTool } from "./timer-start.js";
export { timerStopTool } from "./timer-stop.js";
export { timerCurrentTool } from "./timer-current.js";
export { timerDiscardTool } from "./timer-discard.js";

// Handlers (wrapped for backward compatibility)
export { timerStartHandler } from "./timer-start.js";
export { timerStopHandler } from "./timer-stop.js";
export { timerCurrentHandler } from "./timer-current.js";
export { timerDiscardHandler } from "./timer-discard.js";

// Schemas
