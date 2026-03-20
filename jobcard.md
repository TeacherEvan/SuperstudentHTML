# SuperStudent Jobcard: Interactive + Colorful Quality Plan

## Vision Alignment
Super Student should feel joyful, colorful, responsive, and stable for classroom use. Engineering hygiene must protect this UX by preventing runtime regressions and making failures observable.

## What Was Audited
- Runtime stability around render/audio/storage lifecycle.
- Existing telemetry hooks for error/performance tracking.
- CI quality gates and e2e coverage readiness.
- Documentation consistency for contributors and Copilot usage.

## Key Risks Found
- Canvas DPI scaling accumulated across resize events.
- Audio methods could run without a valid `AudioContext`.
- Welcome screen listener lifecycle lacked full cleanup guarantees.
- E2E pipeline existed in scripts but lacked executable test suite/config.

## Implemented Notes
- Canvas transform reset added before re-scaling to preserve visual accuracy.
- Audio safety guards added for null context and safe source stopping.
- Welcome screen now clears timers and detaches resize listeners deterministically.
- Debug/monitor mode wiring added (`?debug=1` or `localStorage.superstudent_debug=1`).
- New Playwright config and e2e starter suite added (`tests/e2e-specs/app-flow.spec.cjs`).
- CI now installs Playwright browser and runs e2e tests before build.

## Intuitive Suggestions (Next Iteration)
- Add classroom smoke scenario: launch → choose mode → complete first interaction loop.
- Track boot and level-transition latency with pass/fail thresholds in CI artifacts.
- Introduce lightweight “health panel” route for QA builds only.
- Expand e2e to include touch simulation and reduced-motion accessibility checks.
- Keep color/animation richness while gating expensive effects behind performance level.

## Engineer Etiquette / Hygiene Checklist (Concise)
- No silent runtime failures for critical flows; log with context.
- Every long-lived listener/timer must have explicit cleanup path.
- Keep UX-facing constants centralized and named.
- Pair bugfixes with regression tests where practical.
- Keep docs updated whenever adding operational controls.
