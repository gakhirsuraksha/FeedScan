import { SimulatedSource } from './SimulatedSource';
import { CloudSource } from './CloudSource';
import type { DataSource } from './DataSource';
import type { ScenarioName } from '../types';

export type SourceMode = 'live' | 'demo';

const KEY = 'feedscan.mode';

/** Which telemetry source the Device page has selected. Defaults to demo. */
export function getMode(): SourceMode {
  return (localStorage.getItem(KEY) as SourceMode) || 'demo';
}

export function setMode(mode: SourceMode): void {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent('feedscan-mode-change', { detail: mode }));
}

/** Creates the right DataSource for the current mode. `scenario` only matters in demo mode. */
export function createSource(mode: SourceMode, scenario: ScenarioName = 'good_feed'): DataSource {
  return mode === 'live' ? new CloudSource() : new SimulatedSource(scenario);
}
