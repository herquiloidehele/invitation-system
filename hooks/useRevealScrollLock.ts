import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Locks document scroll to the hero viewport until `revealed` becomes true,
 * then releases the lock and pins the page to the top while late layout
 * shifts (e.g. a Canva iframe finishing measurement) settle. Extracted from
 * CurtainCanvaPage so both the curtain-canva and video-entrance layouts share
 * one implementation.
 */
export function useRevealScrollLock(revealed: boolean): void {
  const scrollLockRef = useRef<{
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
    htmlOverflow: string;
    htmlOverflowAnchor: string;
    bodyOverflowAnchor: string;
    scrollRestoration: History["scrollRestoration"];
  } | null>(null);

  // Lock document scroll until the hero reveal completes. The fixed-body lock
  // keeps the hero visually pinned even if the browser restores an old
  // lower-page scroll offset before hydration.
  useLayoutEffect(() => {
    scrollLockRef.current = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverflowAnchor: document.documentElement.style.overflowAnchor,
      bodyOverflowAnchor: document.body.style.overflowAnchor,
      scrollRestoration: history.scrollRestoration,
    };

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.body.style.position = "fixed";
    document.body.style.top = "0";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflowAnchor = "none";
    document.documentElement.style.overflowAnchor = "none";

    return () => {
      const previous = scrollLockRef.current;
      if (!previous) return;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.position = previous.bodyPosition;
      document.body.style.top = previous.bodyTop;
      document.body.style.left = previous.bodyLeft;
      document.body.style.right = previous.bodyRight;
      document.body.style.width = previous.bodyWidth;
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.overflowAnchor = previous.bodyOverflowAnchor;
      document.documentElement.style.overflowAnchor =
        previous.htmlOverflowAnchor;
      history.scrollRestoration = previous.scrollRestoration;
      scrollLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!revealed) return;

    let frame = 0;
    const resetScroll = () => {
      const scrollingElement = document.scrollingElement;
      if (scrollingElement) scrollingElement.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    frame = requestAnimationFrame(() => {
      const previous = scrollLockRef.current;
      resetScroll();

      if (previous) {
        document.body.style.overflow = previous.bodyOverflow;
        document.body.style.position = previous.bodyPosition;
        document.body.style.top = previous.bodyTop;
        document.body.style.left = previous.bodyLeft;
        document.body.style.right = previous.bodyRight;
        document.body.style.width = previous.bodyWidth;
        document.documentElement.style.overflow = previous.htmlOverflow;
        document.body.style.overflowAnchor = previous.bodyOverflowAnchor;
        document.documentElement.style.overflowAnchor =
          previous.htmlOverflowAnchor;
        history.scrollRestoration = previous.scrollRestoration;
        scrollLockRef.current = null;
      }

      // Phase 1: pin to top every frame for a short window so any sync layout
      // shifts on reveal cannot scroll-anchor the viewport.
      const startedAt = performance.now();
      const PIN_DURATION_MS = 250;
      const pinAtTop = () => {
        resetScroll();
        if (performance.now() - startedAt < PIN_DURATION_MS) {
          frame = requestAnimationFrame(pinAtTop);
        }
      };
      pinAtTop();
    });

    // Phase 2: while the iframe finishes measuring, the document height keeps
    // growing for up to a few seconds. Whenever scrollHeight changes within
    // this window, snap back to the top — unless the user scrolled first.
    let lastScrollHeight = document.documentElement.scrollHeight;
    let userScrolled = false;
    const onUserScroll = () => {
      if (window.scrollY > 4) userScrolled = true;
    };
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("keydown", onUserScroll);

    const heightWatcherStart = performance.now();
    const HEIGHT_WATCHER_MS = 4000;
    const heightWatcher = window.setInterval(() => {
      if (performance.now() - heightWatcherStart > HEIGHT_WATCHER_MS) {
        window.clearInterval(heightWatcher);
        return;
      }
      const next = document.documentElement.scrollHeight;
      if (next !== lastScrollHeight) {
        lastScrollHeight = next;
        if (!userScrolled) resetScroll();
      }
    }, 80);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(heightWatcher);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onUserScroll);
    };
  }, [revealed]);
}
