# Exact reference character — 2026-09-13

## Summary

Replaced the generated seated man with the original character pixels from the approved homepage reference. CSS clips the character region from a byte-identical copy of the reference image, preserving the pose, linework, colors, and notebook without redrawing the illustration.

## Test results

`npx.cmd playwright test tests/e2e/reference-character.spec.js`

```text
✓ intro character uses the original reference artwork
1 passed (3.1s)
```

The focused test verifies the reference asset loads, the CV link remains visible, and the character stays within the mobile viewport. Source and public-asset SHA-256 hashes match.

## Screenshot comparison

| Before | After |
| --- | --- |
| ![Previous generated character](./attachments/2026-09-13-exact-reference-character/character-before.png) | ![Original reference character](./attachments/2026-09-13-exact-reference-character/character-after.png) |

## Notes

- Only the introduction panel was captured.
- The original image is copied to `public/images/homepage-character-reference.png`; CSS displays its character region (112,190,224,264). A lower-left clipping notch excludes the mockup's CV text.
- This intentionally uses the source reference at its original resolution, following the explicit request for the exact artwork. It retains the original dark background pixels around the figure.
- A built-in image-tool extraction was tried but rejected because it changed details. No generated replacement is used by this change. Extraction prompt: “Background extraction only. Extract the exact illustrated seated man and wooden stool from the TOP LEFT introduction panel of this reference. Preserve the existing character's exact pose, silhouette, hand-drawn outlines, flat beige jacket, charcoal trousers, black shoes, lime cuff, book, proportions and face. DO NOT redesign, reinterpret, render realistically, change pose, or generate a new character. Remove all surrounding UI, text, dark background and panels. Output only this exact seated figure and stool as a clean transparent PNG tightly framed around the figure with small transparent margin. This is an extraction/edit of the supplied pixels, not an illustration-generation request.”
- No deployment was performed.

