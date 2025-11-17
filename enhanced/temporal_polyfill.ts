/**
 * Temporal API polyfill for date/time operations.
 *
 * This module provides access to the TC39 Temporal API via the official polyfill.
 * The Temporal API is a modern JavaScript API for working with dates and times,
 * designed to replace the problematic Date object.
 *
 * References:
 * - Temporal Proposal: https://tc39.es/proposal-temporal/
 * - Polyfill: https://github.com/js-temporal/temporal-polyfill
 * - Deno Temporal Docs: https://docs.deno.com/api/web/temporal
 *
 * NOTE: Once Deno natively supports Temporal (currently in Stage 3),
 * this polyfill can be removed and we can use the built-in `Temporal` global.
 */

// Import the Temporal polyfill from npm
import { Temporal } from "npm:@js-temporal/polyfill@0.4.4";

// Re-export for use in other modules
export { Temporal };

// Type exports for TypeScript
export type {
  Temporal as TemporalNamespace,
} from "npm:@js-temporal/polyfill@0.4.4";
