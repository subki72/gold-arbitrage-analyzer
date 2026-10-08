// ============================================================
// helpers.js — Utility helper functions
// ============================================================

/**
 * Find single element matching selector
 * @param {string} selector
 * @param {ParentNode} [context=document]
 * @returns {Element|null}
 */
export const querySelector = (selector, context = document) => context.querySelector(selector);

/**
 * Find all elements matching selector as an array
 * @param {string} selector
 * @param {ParentNode} [context=document]
 * @returns {Element[]}
 */
export const querySelectorAll = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Shorthand aliases for convenience
export const $ = querySelector;
export const $$ = querySelectorAll;

/**
 * Create a DOM element with safe attributes and children
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param {Array<Node|string>} [children=[]]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (val == null) return;
    if (key === 'className') {
      el.className = val;
    } else if (key === 'textContent') {
      el.textContent = val;
    } else if (key === 'innerHTML') {
      // Avoid arbitrary raw injection when possible; caller should prefer textContent
      el.innerHTML = val;
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else if (key === 'dataset' && typeof val === 'object') {
      Object.entries(val).forEach(([k, v]) => {
        el.dataset[k] = v;
      });
    } else {
      el.setAttribute(key, String(val));
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

/**
 * Debounce function execution
 * @param {Function} fn
 * @param {number} [delay=300]
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function execution
 * @param {Function} fn
 * @param {number} [limit=300]
 * @returns {Function}
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Interpolate color between two HSL tuples (used for heatmap spread visualization)
 * @param {number} value - Normalized scale between 0 and 1
 * @param {Array<number>} [colorLow=[152, 69, 50]] - [h, s, l]
 * @param {Array<number>} [colorHigh=[0, 75, 58]] - [h, s, l]
 * @returns {string} HSL string
 */
export function interpolateColor(value, colorLow = [152, 69, 50], colorHigh = [0, 75, 58]) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const h = colorLow[0] + (colorHigh[0] - colorLow[0]) * clampedValue;
  const s = colorLow[1] + (colorHigh[1] - colorLow[1]) * clampedValue;
  const l = colorLow[2] + (colorHigh[2] - colorLow[2]) * clampedValue;
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Animate a numeric DOM text element with easing
 * @param {HTMLElement} element
 * @param {number} target
 * @param {number} [duration=800]
 * @param {Function} [formatter=v => v.toFixed(2)]
 */
export function animateValue(element, target, duration = 800, formatter = v => v.toFixed(2)) {
  if (!element || typeof target !== 'number' || !Number.isFinite(target)) return;
  const start = parseFloat(element.dataset.currentValue || '0') || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic curve
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;

    element.textContent = formatter(current);
    element.dataset.currentValue = String(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter(target);
      element.dataset.currentValue = String(target);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Fetch with configurable timeout and abort signal
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @param {number} [timeout=8000]
 * @returns {Promise<any>}
 */
export async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // If caller provided an abort signal, link it
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export default {
  querySelector,
  querySelectorAll,
  $,
  $$,
  createElement,
  debounce,
  throttle,
  interpolateColor,
  animateValue,
  fetchWithTimeout,
};
