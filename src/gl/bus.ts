import type { Stage } from './Stage';

/** Single shared WebGL stage, set by <GLCanvas/> and driven by sections. */
export const bus: { stage: Stage | null; ready: boolean } = { stage: null, ready: false };

export const READY_EVENT = 'xtreme:ready';
