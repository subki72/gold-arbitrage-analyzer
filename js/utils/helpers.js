// ============================================================
// helpers.js — Utility functions
// ============================================================

/**
 * Query selector shorthand
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Buat elemen DOM
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'className') el.className = val;
    else if (key === 'textContent') el.textContent = val;
    else if (key === 'innerHTML') el.innerHTML = val;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else if (key === 'dataset') Object.entries(val).forEach(([k, v]) => el.dataset[k] = v);
    else el.setAttribute(key, val);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Interpolasi warna antara dua warna HSL
 * Digunakan untuk heatmap
 * @param {number} value - 0 ke 1
 * @param {Array} colorLow - [h, s, l] untuk nilai rendah
 * @param {Array} colorHigh - [h, s, l] untuk nilai tinggi
 * @returns {string} hsl string
 */
export function interpolateColor(value, colorLow = [152, 69, 50], colorHigh = [0, 75, 58]) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const h = colorLow[0] + (colorHigh[0] - colorLow[0]) * clampedValue;
  const s = colorLow[1] + (colorHigh[1] - colorLow[1]) * clampedValue;
  const l = colorLow[2] + (colorHigh[2] - colorLow[2]) * clampedValue;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Animasi angka counting
 * @param {HTMLElement} element
 * @param {number} target
 * @param {number} duration - ms
 * @param {Function} formatter
 */
export function animateValue(element, target, duration = 800, formatter = v => v.toFixed(2)) {
  const start = parseFloat(element.dataset.currentValue || '0');
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;

    element.textContent = formatter(current);
    element.dataset.currentValue = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.dataset.currentValue = target;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Fetch dengan timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp angka dalam range
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
