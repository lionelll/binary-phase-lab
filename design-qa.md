# Design QA

final result: passed

## Scope

- Aligned the binary phase lab header with the shared crystal/ternary lab header system.
- Aligned the left, center, and right workspace tracks with the exact shared crystal/ternary grid.
- Replaced the cached `GR` tab icon URL with the orange/blue brand logo asset requested by the user.
- Removed the secondary Chinese description from the phase-diagram stage heading.
- Verified desktop and responsive behavior at 2560, 1280, 820, 520, and 375 CSS-pixel widths.

## Reference grounding

- User reference: `codex-clipboard-66479a43-c1d2-42e0-a20e-f8d30c9abfed.png`
- User reference: `codex-clipboard-ec18f0f7-f080-466d-af05-4a91f6678932.png`
- User layout issue reference: `codex-clipboard-f8c5c2a4-e0fb-4564-883a-8539fa607e8c.png`
- User favicon reference: `codex-clipboard-db6f2d00-1615-448b-a117-937b58d7e45c.png`
- Code references: `crystal-structure-lab/src/styles.css` and `ternary-phase-lab/app/globals.css`

The Safari reference contains browser chrome and a different browser zoom/device-pixel scale, so visual comparison was normalized to the app viewport. The implementation uses the exact shared desktop component metrics from the two sibling labs.

## Verified metrics

At desktop width above 1280px:

- Header grid row: 96px
- Brand mark: 54px × 54px
- Brand title: 25px
- Brand subtitle: 13px
- Header action: 48px high, 16px text
- Header action icon: 28px × 28px
- Header gap/padding: 28px / 12px 24px
- Workspace tracks: `clamp(290px, 20vw, 400px) minmax(520px, 1fr) clamp(340px, 24vw, 470px)`
- 2560px viewport: 400px / 1646px / 470px
- 1440px viewport: 290px / 760.4px / 345.6px
- Inter-column gap: 12px

At responsive breakpoints:

- 1280px: 270px + flexible center; right rail spans both columns in a two-card grid, no horizontal overflow
- 820px: one-column header with a two-column action grid, no horizontal overflow
- 520px: 34px brand mark, 12px action text, 18px action icons, no horizontal overflow
- 375px: no horizontal overflow

The phase-diagram stage heading contains only `Cu–Ni 匀晶相图`; its secondary description count is zero.

## Evidence

- Implementation screenshot: `docs/design-qa-layout.png`
- Implementation viewport: 2560 × 1363 CSS px
- Implementation screenshot: 2560 × 1363 px, density-normalized 1:1
- Source screenshot: 2560 × 1440 px including Safari browser chrome; comparison used the app-owned content region and exact sibling-project grid metrics
- Full-view comparison: corrected workspace rails are visibly wider and the center track correspondingly narrower, matching the shared grid
- Focused comparison: requested favicon and implementation asset are the same orange/blue transparent PNG; the page now uses a new cache-busting asset URL
- Required fidelity surfaces: typography, spacing, colors, image quality, and copy retain the shared lab system with no remaining P0/P1/P2 mismatch
- Console errors/warnings: none
- Automated tests: 22 passed
- Production build: passed

## Comparison history

- Earlier P1: desktop workspace used `18vw / 22vw` rails instead of the shared `20vw / 24vw` rails. Fixed by copying the exact crystal/ternary grid tracks.
- Earlier P2: the 1280px boundary did not explicitly span the right rail across both columns. Fixed and verified at 1280, 820, and 375px without horizontal overflow.
- Earlier P2: Safari displayed the cached `GR` favicon. Fixed by changing both icon relations to the requested brand asset at a new URL.
