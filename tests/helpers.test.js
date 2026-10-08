import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { interpolateColor, debounce, throttle, createElement } from '../js/utils/helpers.js';

describe('Helpers - js/utils/helpers.js', () => {
  describe('createElement', () => {
    beforeEach(() => {
      globalThis.Node = class Node {};
      globalThis.document = {
        createElement: (tag) => {
          const el = Object.create(globalThis.Node.prototype);
          el.tagName = tag.toUpperCase();
          el.className = '';
          el.textContent = '';
          el.style = {};
          el.dataset = {};
          el.attrs = {};
          el.children = [];
          el.listeners = {};
          el.setAttribute = (k, v) => { el.attrs[k] = v; };
          el.addEventListener = (event, fn) => { el.listeners[event] = fn; };
          el.appendChild = (child) => { el.children.push(child); };
          return el;
        },
        createTextNode: (text) => {
          const node = Object.create(globalThis.Node.prototype);
          node.nodeType = 3;
          node.textContent = text;
          return node;
        },
      };
    });

    afterEach(() => {
      delete globalThis.document;
      delete globalThis.Node;
    });

    it('creates element with attributes, style, dataset, events, and text children', () => {
      const onClick = vi.fn();
      const el = createElement('button', {
        className: 'btn-primary',
        id: 'action-btn',
        onClick,
        dataset: { action: 'refresh' },
        style: { color: 'gold' },
      }, ['Click Me']);

      expect(el.tagName).toBe('BUTTON');
      expect(el.className).toBe('btn-primary');
      expect(el.attrs['id']).toBe('action-btn');
      expect(el.dataset.action).toBe('refresh');
      expect(el.style.color).toBe('gold');
      expect(el.children.length).toBe(1);
      expect(el.children[0].textContent).toBe('Click Me');

      el.listeners.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles child Node instances', () => {
      const child = createElement('span', { textContent: 'Inner' });
      const parent = createElement('div', {}, [child]);
      expect(parent.children.length).toBe(1);
      expect(parent.children[0].tagName).toBe('SPAN');
    });
  });

  describe('interpolateColor', () => {
    it('interpolates HSL colors between boundaries', () => {
      const low = [152, 69, 50];
      const high = [0, 75, 58];

      const color0 = interpolateColor(0, low, high);
      expect(color0).toBe('hsl(152, 69%, 50%)');

      const color1 = interpolateColor(1, low, high);
      expect(color1).toBe('hsl(0, 75%, 58%)');

      const colorMid = interpolateColor(0.5, low, high);
      expect(colorMid).toMatch(/hsl\(\d+, \d+%, \d+%\)/);
    });

    it('clamps values below 0 and above 1', () => {
      const low = [152, 69, 50];
      const high = [0, 75, 58];
      expect(interpolateColor(-1, low, high)).toBe(interpolateColor(0, low, high));
      expect(interpolateColor(2, low, high)).toBe(interpolateColor(1, low, high));
    });
  });

  describe('debounce', () => {
    it('debounces rapid calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 200);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(250);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('throttles execution within delay limit', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 200);

      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(250);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });
});
