import { describe, it, expect } from 'vitest';
import { Store, appState } from '../js/services/state.js';

describe('Reactive State Store - js/services/state.js', () => {
  it('initializes with state values', () => {
    const store = new Store({ count: 10, name: 'PAXG' });
    expect(store.get('count')).toBe(10);
    expect(store.get('name')).toBe('PAXG');
  });

  it('notifies key-specific listeners on value change', () => {
    const store = new Store({ token: 'PAXG' });
    let notifiedVal = null;
    let oldVal = null;

    const unsubscribe = store.on('token', (val, old) => {
      notifiedVal = val;
      oldVal = old;
    });

    store.set('token', 'XAUT');
    expect(notifiedVal).toBe('XAUT');
    expect(oldVal).toBe('PAXG');

    unsubscribe();
    store.set('token', 'PAXG');
    expect(notifiedVal).toBe('XAUT'); // Did not fire after unsubscribe
  });

  it('notifies global listeners on any update', () => {
    const store = new Store({ a: 1 });
    const events = [];

    const unsub = store.onAny((key, val) => {
      events.push({ key, val });
    });

    store.set('a', 2);
    store.update({ b: 3 });

    expect(events.length).toBe(2);
    expect(events[0]).toEqual({ key: 'a', val: 2 });
    expect(events[1]).toEqual({ key: 'b', val: 3 });
    unsub();
  });

  it('resets token history without cross-asset state contamination', () => {
    const store = new Store({
      tokenPriceHistory: {
        PAXG: { binance: [[1, 2600]] },
        XAUT: { okx: [[1, 2610]] },
      },
      tokenSpreadHistory: {
        PAXG: [{ maxSpread: 0.5 }],
        XAUT: [{ maxSpread: 0.4 }],
      },
    });

    store.resetTokenHistory('PAXG');
    expect(store.get('tokenPriceHistory').PAXG).toEqual({});
    expect(store.get('tokenPriceHistory').XAUT).toEqual({ okx: [[1, 2610]] });
    expect(store.get('tokenSpreadHistory').PAXG).toEqual([]);
    expect(store.get('tokenSpreadHistory').XAUT).toEqual([{ maxSpread: 0.4 }]);
  });
});
