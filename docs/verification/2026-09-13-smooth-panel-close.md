# Smooth project panel close

## Summary

Fixed the project detail panel's closing motion by giving the exit a smooth reciprocal ease and removing the competing one-millisecond teardown transition. The panel now decelerates into its originating card while preserving focus restoration, scroll locking, mobile stability, and reduced-motion behavior.

## Test results

`npx.cmd playwright test tests/e2e/ios-panel-motion.spec.js --project=chromium`

```text
6 passed (17.2s)
```

The focused checks cover the real tray's open and close paths, exit duration and easing, every dismissal route, focus restoration, scroll-lock cleanup, mobile background stability, and reduced motion.

## Screenshot comparison

Both screenshots show the Sentrix panel at the same 55% point in its closing timeline.

| Before | After |
|--------|-------|
| ![Before: accelerating exit leaves the panel close to its fully open state](./attachments/2026-09-13-smooth-panel-close/before-closing-panel.png) | ![After: reciprocal easing creates a clear, continuous return toward the project card](./attachments/2026-09-13-smooth-panel-close/after-closing-panel.png) |

## Notes

- Playwright Chromium had to be reinstalled because its local headless-shell cache was incomplete.
- The browser emitted a non-blocking `NO_COLOR` environment warning.
- The screenshot-only test is skipped during normal runs unless `PANEL_SCREENSHOT_PATH` is set.
