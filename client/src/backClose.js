import { useEffect, useRef } from 'react';

// Phone "back" button support for pop-ups. Opening a pop-up (item card, cart, search, favourites, category list,
// photo viewer) adds one history entry; pressing Back then closes the top-most pop-up instead of leaving the site.
// Closing it with its own X / arrow removes that entry again, so Back always behaves as expected.
const stack = [];
let ignore = 0;
let listening = false;

const onPop = () => {
  if (ignore > 0) { ignore -= 1; return; } // popstate caused by our own history.back()
  const top = stack.pop();
  if (top) top.close();
};

export function useBackClose(open, close) {
  const ref = useRef(close);
  ref.current = close;
  useEffect(() => {
    if (!open) return undefined;
    const entry = { close: () => ref.current() };
    stack.push(entry);
    try { history.pushState({ ov: true }, ''); } catch { /* ignore */ }
    if (!listening) { window.addEventListener('popstate', onPop); listening = true; }
    return () => {
      const i = stack.indexOf(entry);
      if (i < 0) return; // already closed by the Back button
      stack.splice(i, 1);
      if (history.state && history.state.ov) { ignore += 1; history.back(); } // closed with X: drop our entry
    };
  }, [open]);
}
