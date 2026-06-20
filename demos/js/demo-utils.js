/**
 * Shared utilities for ARS Web Components demo pages.
 *
 * Usage:
 *   import { initDesignSystem, initThemeToggles, createEventLog }
 *     from '/demos/js/demo-utils.js';
 *
 *   initDesignSystem('light');
 *   initThemeToggles();
 *   const log = createEventLog('event-log', 'clear-log');
 *   log.append('ars-foo:bar', 'detail=42');
 */

import {
  initializeArsWebComponents,
  getArsWebComponentsDefaultAdapter,
} from '/dist/design-system.js';
import { registerArsWebComponents } from '/dist/register.js';

// Component modules no longer self-register, so register all ars-* custom
// elements once for the demo pages.
registerArsWebComponents();

/* --------------------------------------------------------------------------
   Design-system helpers
   -------------------------------------------------------------------------- */

/**
 * Initialise the ARS design system with the given theme mode.
 * @param {'light' | 'dark'} mode
 */
export function initDesignSystem(mode = 'light') {
  initializeArsWebComponents({
    designAdapter: getArsWebComponentsDefaultAdapter(mode),
  });
}

/**
 * Wire up theme-light / theme-dark buttons (if they exist).
 * @param {string} lightId  ID of the light-theme button.
 * @param {string} darkId   ID of the dark-theme button.
 */
export function initThemeToggles(lightId = 'theme-light', darkId = 'theme-dark') {
  const lightBtn = document.getElementById(lightId);
  const darkBtn = document.getElementById(darkId);

  lightBtn?.addEventListener('click', () => initDesignSystem('light'));
  darkBtn?.addEventListener('click', () => initDesignSystem('dark'));
}

/* --------------------------------------------------------------------------
   Event-log helper
   -------------------------------------------------------------------------- */

/**
 * Create a managed event-log panel.
 *
 * @param {string} logId    ID of the `.event-log` container.
 * @param {string} clearId  ID of the clear button (optional).
 * @returns {{ append: (eventName: string, detail?: string) => void, clear: () => void }}
 */
export function createEventLog(logId = 'event-log', clearId = 'clear-log') {
  const log = document.getElementById(logId);
  const clearBtn = document.getElementById(clearId);

  function append(eventName, detail = '') {
    if (!log) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'entry';
    entry.innerHTML = `<span class="timestamp">[${time}]</span> <span class="event-name">${eventName}</span>${detail ? ' ' + detail : ''}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  function clear() {
    if (!log) return;
    log.innerHTML = '<div class="entry"><span class="timestamp">[cleared]</span> Listening...</div>';
  }

  clearBtn?.addEventListener('click', clear);

  return { append, clear };
}
