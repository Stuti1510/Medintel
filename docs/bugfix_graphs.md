# Bugfix & Root-Cause Diagnosis: Frontend Chart Rendering

## 1. Problem Summary
In the legacy prototype, charts on the evaluation, comparison, and dataset pages frequently failed to render, appeared blank, or crashed the frontend UI during user testing.

---

## 2. Root Cause Analysis

### Issue 1: Hardcoded API Endpoints and Port/URL Mismatches
- **Root Cause:** The legacy frontend contained scattered `fetch('http://localhost:8000/api/...')` strings or relative paths without fallback. When the backend was hosted on different ports (or behind reverse proxies/Vite dev proxies), requests silently threw network `TypeError` exceptions.
- **Consequence:** Component promises were rejected, unhandled exceptions halted React rendering, and charts were left unmounted.

### Issue 2: Recharts `ResponsiveContainer` 0-Height Collapse
- **Root Cause:** In Recharts, `<ResponsiveContainer width="100%" height="100%">` relies on calculating the CSS bounding client rect of its immediate parent DOM container.
- **The Bug:** When placed inside Tailwind flexbox containers (`flex flex-col flex-1`) without an explicit fixed height or `min-height`, the browser computes the container height as `0px`.
- **Consequence:** Recharts logs `[Recharts] The width(0) and height(0) of chart should be greater than 0, please check the container's width and height.` and renders an empty SVG or blank canvas.

### Issue 3: Missing `not_run` / Empty State Protocol
- **Root Cause:** When experiments had not yet completed or benchmark CSVs had not been generated, endpoints either returned `500 Internal Server Error` or empty arrays `[]`.
- **The Bug:** Frontend chart components called `.map()` on undefined fields or attempted to compute domains on `NaN` / empty arrays, causing React uncaught invariant crashes (`Cannot read properties of undefined`).

---

## 3. Systematic Architectural Solution

### Solution 1: Centralized Configuration via `VITE_API_BASE_URL`
- Created `frontend/.env` and `frontend/.env.example` defining `VITE_API_BASE_URL=http://localhost:8000/api`.
- Built `frontend/src/services/api.ts` which routes all requests through `API_BASE_URL`.
- Structured custom `ApiError` class that captures and surfaces the exact failed endpoint URL:
  ```typescript
  export class ApiError extends Error {
    url: string;
    status?: number;
    ...
  }
  ```

### Solution 2: Shared `ChartCard` Component with Guaranteed Height
- Created `frontend/src/components/charts/ChartCard.tsx`.
- Guaranteed height:
  ```tsx
  <div className={`w-full min-h-[260px] ${heightClass} relative flex items-center justify-center`}>
  ```
  Every chart container specifies an explicit `min-h-[260px]` and default `h-72` or `h-80`, guaranteeing that Recharts `ResponsiveContainer` receives positive dimensions.

### Solution 3: Resilient Tri-State Lifecycle (Loading, Error with URL, Empty State)
- The backend `/api/results/{exp_id}` endpoint contract returns:
  `{"rows": [], "status": "not_run", "message": "Experiment has not been run yet."}` rather than throwing 500.
- `ChartCard` inspects `status`:
  - **Loading:** Renders animated SVG spinner with `"Loading benchmark data..."`.
  - **Error:** Renders alert badge and the exact target URL for developer debugging.
  - **Not Run:** Renders a clean dashed empty state: `"No results yet — run the experiments"`.
  - **Success:** Safely mounts `ResponsiveContainer` with validated data rows.

---

## 4. Verification Checklist
- [x] All charts specify `ChartCard` wrapper with explicit height classes.
- [x] `VITE_API_BASE_URL` configured in `.env` and `.env.example`.
- [x] No chart crashes when experiment CSVs are missing (`status: not_run` handled gracefully).
- [x] All 4 pages (`ClinicalAnalysisPage`, `ModelComparisonPage`, `DatasetDashboardPage`, `ExplainabilityPage`) adhere strictly to this pattern.
