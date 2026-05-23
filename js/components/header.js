// ============================================================
// header.js — Header component
// ============================================================

import { appState } from '../services/state.js';
import { LABELS } from '../utils/constants.js';
import { formatTimeAgo, formatTime } from '../utils/formatters.js';
import { $ } from '../utils/helpers.js';

export function initHeader() {
  // ── Token Selector ──
  const tokenBtns = document.querySelectorAll('.token-btn');
  tokenBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tokenBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.set('selectedToken', btn.dataset.token);
    });
  });

  // ── Refresh Toggle ──
  const refreshToggle = $('#refresh-toggle');
  if (refreshToggle) {
    refreshToggle.addEventListener('change', () => {
      appState.set('isAutoRefresh', refreshToggle.checked);
    });
  }

  // ── Refresh Now Button ──
  const refreshBtn = $('#refresh-now-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      appState.set('forceRefresh', Date.now());
      refreshBtn.classList.add('spinning');
      setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
    });
  }

  // ── Interval Selector ──
  const intervalSelect = $('#refresh-interval');
  if (intervalSelect) {
    intervalSelect.addEventListener('change', () => {
      appState.set('refreshInterval', parseInt(intervalSelect.value));
    });
  }

  // ── Update last updated timestamp ──
  appState.on('lastUpdated', (ts) => {
    const el = $('#last-updated');
    if (el && ts) {
      el.textContent = formatTime(ts);
      el.title = formatTimeAgo(ts);
    }
  });

  // ── Update connection status ──
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  // ── Live clock ──
  updateClock();
  setInterval(updateClock, 1000);
}

function updateConnectionStatus() {
  const statusEl = $('#connection-status');
  if (!statusEl) return;
  
  if (navigator.onLine) {
    statusEl.className = 'status-indicator online';
    statusEl.title = LABELS.online;
  } else {
    statusEl.className = 'status-indicator offline';
    statusEl.title = LABELS.offline;
  }
}

function updateClock() {
  const clockEl = $('#live-clock');
  if (clockEl) {
    clockEl.textContent = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
