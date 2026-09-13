# Portfolio reference correction — 2026-09-13

## Summary

Corrected the portfolio to follow the approved reference: a three-panel top row, two project previews and a vertical experience tile below, and tools/contact stacked at the far right. Restored heading-above-image project cards, the seated editorial illustration, compact technology badges, the centered project tray, and the site's verified email address.

## Test results

Command: `npx.cmd playwright test tests/e2e/projects-modal.spec.js`

```text
✓ active layers trap focus and zoom panning stays bounded
✓ server-rendered fallback: homepage content and previews stay visible without JavaScript
✓ reference composition, real destinations, and centered tray with stacked zoom
✓ all four projects and project navigation use the displayed order
✓ mobile and tablet stack without horizontal overflow
✓ failed preview reserves its frame and offers retry
✓ reduced motion: panels remain visible and have no entrance animation

7 passed (40.1s)
```

Command: `npm.cmd run build`

```text
✔ Client built in 2471ms
✔ Server built in 1198ms
[nitro] ✔ Nuxt Nitro server built
Exit code: 0
```

The browser checks cover relative desktop panel positions, centered dialog geometry, the four-project order, gallery selection, zoom controls and clamped drag bounds, focus trapping/restoration, topmost Escape behavior, background inertness, 390px/768px layouts, image failure/retry without frame collapse, reduced motion, and visible content without JavaScript.

## Screenshot comparison

These are local Playwright captures of only the affected homepage and overlays.

| Before correction | After correction |
| --- | --- |
| ![Prior homepage](./attachments/2026-09-13-portfolio-bento-redesign/homepage-before.png) | ![Corrected homepage](./attachments/2026-09-13-portfolio-bento-redesign/homepage-after.png) |

The earlier broken tray could not be opened to capture a prior equivalent. The corrected tray and viewer are recorded as working states:

![Centered project tray](./attachments/2026-09-13-portfolio-bento-redesign/tray-after.png)

![Expanded image viewer](./attachments/2026-09-13-portfolio-bento-redesign/viewer-after.png)

## Notes

- The before capture is the previous local implementation, taken before this correction; it is not the approved mockup. It used the existing Playwright desktop viewport; the after capture uses 1440 × 1000. This comparison documents composition changes, not a pixel-diff baseline.
- Actual project screenshots are preserved from the repository. Their content differs from the synthetic examples in the design references.
- The email destination is restored to `mailto:czedrixb@gmail.com`, verified against the existing footer.
- No deployment or external publication was performed.
- The build reports the existing outdated Browserslist database warning; it completes successfully.
- The seated illustration was generated with the built-in image tool and saved at `public/images/seated-developer.png`. Prompt: “Create a standalone transparent PNG editorial ink illustration for a dark portfolio intro tile. Full body adult young man with short black tousled hair seated on a simple wooden stool, leaning slightly forward with forearm on knee, holding a closed dark sketchbook beside his leg, looking thoughtfully to the right. Natural human proportions. Beige gray textured jacket, charcoal trousers, black shoes, a small lime green cuff accent. Vintage contemporary magazine pen-and-ink illustration with subtle stippling and paper grain only within painted shapes. Full stool and shoes visible. No desk, laptop, coffee, text, background, floor or decorative objects. Transparent background. Centered portrait composition with close framing around the full figure. Avoid 3D and cartoon mascot style.”

