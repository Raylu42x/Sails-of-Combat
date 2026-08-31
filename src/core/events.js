// Tiny synchronous event emitter. The core simulation never touches the DOM;
// it announces what happened and the UI layer decides how to show it.
export function createEmitter() {
  const handlers = new Map();
  return {
    on(evt, fn) {
      if (!handlers.has(evt)) handlers.set(evt, []);
      handlers.get(evt).push(fn);
      return () => this.off(evt, fn);
    },
    off(evt, fn) {
      const list = handlers.get(evt);
      if (!list) return;
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    emit(evt, payload) {
      for (const fn of (handlers.get(evt) || []).slice()) fn(payload);
    },
  };
}
