# Bugfix & Conversion Log

Detailed audit of engineering issues encountered and resolved during the migration of MEDINTEL AI into a quality-robust multimodal system.

---

### Bug 1: Corrupted / Partial `.git` Repository
- **Symptom:** `fatal: not a git repository (or any of the parent directories): .git`
- **Cause:** Repository arrived with a partial `.git` folder missing `HEAD` and `config`.
- **Fix:** Ran `git init` to initialize a valid repository head.

### Bug 2: Module Import Paths (`sys.path`)
- **Symptom:** `ModuleNotFoundError: No module named 'data'` or `No module named 'vision'`.
- **Cause:** Python scripts executed from root without DMBI installed as an editable package.
- **Fix:** Added `sys.path.insert(0, ".")` and created `__init__.py` files across all module directories (`data/multimodal`, `vision/classification`, `vision/enhancement`, `multimodal`, `xai`, `backend/app`).

### Bug 3: PyWavelets Missing Dependency for Noise Estimation
- **Symptom:** `ImportError: PyWavelets is not installed. Cannot use estimate_sigma`.
- **Cause:** `skimage.restoration.estimate_sigma` requires `pywavelets`.
- **Fix:** Installed `pywavelets` and implemented a robust Median Absolute Deviation (MAD) of Laplacian fallback in `vision/preprocessing/quality.py`.

### Bug 4: Residual UNet Dimension Mismatch
- **Symptom:** `RuntimeError: The size of tensor a (32) must match the size of tensor b (3) at non-singleton dimension 1`.
- **Cause:** Residual addition in `unet_restore.py` attempted to add the 32-channel penultimate decoder output directly to the 3-channel input before applying the final $1 \times 1$ conv.
- **Fix:** Added residual connection after the final conv: `in_img + self.final_conv(x)`, followed by `clamp(..., 0, 1)`.

### Bug 5: Matplotlib Writable Cache Directory in Sandbox
- **Symptom:** `Matplotlib is creating a temporary cache directory at ... because C:\Users\Stuti\.matplotlib is not writable`.
- **Cause:** Windows sandbox isolates the user home directory, causing Matplotlib to pause and warn.
- **Fix:** Configured `os.environ["MPLCONFIGDIR"] = str(PROJECT_ROOT / ".cache" / "matplotlib")` across `main.py` and evaluation scripts.

### Bug 6: Timm HuggingFace Offline Hub Timeout
- **Symptom:** Model instantiation hung when initializing `timm.create_model("efficientnet_b0", pretrained=True)` inside the network-isolated sandbox.
- **Cause:** Timm attempted to connect to HuggingFace Hub to verify weight hashes.
- **Fix:** Set `os.environ["HF_HUB_OFFLINE"] = "1"` and initialized models with `pretrained=False` when local fold checkpoints exist.

### Bug 7: AnyIO Socketpair Threadpool Hang in Windows Sandbox
- **Symptom:** FastAPI `async def analyze_multimodal` hung when calling `await image.read()` or when tested with `TestClient`.
- **Cause:** AnyIO 4.x creates local socketpairs to coordinate worker threads for async file reads and test portals. Windows sandbox blocks local socketpair creation without elevated permissions.
- **Fix:** Converted the CPU-bound inference endpoint to standard synchronous `def analyze_multimodal` (FastAPI best practice for ML inference) and read the underlying `UploadFile.file.read()` directly without AnyIO thread sockets.

### Bug 8: Recharts ResponsiveContainer 0-Height Collapse
- **Symptom:** Recharts charts rendered completely blank inside flexbox parent containers.
- **Cause:** `ResponsiveContainer` computed height as 0px when placed inside unbounded flex items.
- **Fix:** Built `frontend/src/components/charts/ChartCard.tsx` with explicit container heights (`min-h-[260px]`, `h-72`, `h-80`) and tri-state lifecycle handling (loading skeleton, failed URL error card, `not_run` empty state).

---

### Bug 9: Clinical Analysis Page Stays on Loading and Never Predicts
- **Bug:** Clinical Analysis page never returned a prediction; stayed spinning on loading indefinitely.
- **Cause Found:**
  1. Models and RAG pipeline were loaded lazily on the first request rather than during FastAPI startup lifespan, causing initial cold-start latency.
  2. Frontend fetch lacked an AbortController timeout mechanism, meaning network disconnects or delays caused infinite loading states.
  3. Missing model checkpoint files were swallowed or resulted in unhandled exceptions rather than an explicit 503 response.
  4. Response schema lacked per-stage execution timings (`timings_ms`), causing frontend pipeline progress to remain static.
- **Files Changed:**
  - `backend/app/main.py`
  - `backend/app/services/multimodal_service.py`
  - `backend/app/services/clinical_orchestrator.py`
  - `backend/app/api/endpoints/clinical.py`
  - `backend/app/schemas/clinical_schema.py`
  - `frontend/src/types/clinical.ts`
  - `frontend/src/types/index.ts`
  - `frontend/src/services/api.ts`
  - `frontend/src/pages/ClinicalAnalysisPage.tsx`
  - `tests/test_multimodal_endpoint.py`
- **How It Was Verified:**
  - `python -m pytest tests/test_multimodal_endpoint.py -v` passed all 4 test cases (success with timings, text-only, 400 format error, 503 missing model).
  - Executed POST `/api/analyze/multimodal` with authentic sample image, returning full diagnostic prediction and Grad-CAM in 0.94 seconds on CPU.
  - Verified frontend `npm run build` succeeds with zero errors.

### Bug 10: Research Lab Page Does Not Display Right Away
- **Bug:** The Research Lab page delayed rendering, showing a global skeleton block instead of an immediate dashboard.
- **Cause Found:**
  1. `ResearchLabPage.tsx` blocked page mount behind a single `Promise.all` fetching 6 experiment endpoints (`e1`, `e4`, `e5`, `e7`, `e8`, `summary`), blocking all tab and overview content until the slowest request finished.
  2. No client-side caching for tab data: switching back and forth between tabs triggered duplicate API calls.
  3. `backend/app/api/endpoints/models_eval.py` re-read large CSV files from disk (e.g., `e4_robustness.csv` with 1,250 rows and `manifest.csv`) on every single request without memory caching.
  4. Tab transitions used history `push` rather than `replace`, cluttering browser history stack.
- **Files Changed:**
  - `backend/app/api/endpoints/models_eval.py`
  - `frontend/src/pages/ResearchLabPage.tsx`
- **How It Was Verified:**
  - Header, benchmark tabs, and dataset overview summary cards paint immediately on page mount.
  - Added in-memory mtime-keyed caching in `models_eval.py` reducing repeat endpoint latency to < 5ms.
  - Added client-side tab caching so visited tabs display immediately without re-querying backend.
  - Tab switching uses `replace: true` to prevent browser history stack pollution.
  - Charts styled with explicit `minWidth={0}` and height constraints to prevent Recharts flex collapse.
  - `python -m pytest tests -q` (25 passed).
  - `npm --prefix frontend run build` (build succeeded in 13.05s, 0 errors).

### Bug / Change 11: Streamline Website to Single Quality-Aware Gated Fusion Model
- **Issue:** The site contained comparative UI selectors and comparison tables showcasing 5 distinct models (Text Linear SVM, Image EfficientNet-B0, Late Fusion, Concatenation Fusion, Gated Fusion) rather than focusing exclusively on the final chosen model.
- **Verification of Superiority Claim (from `reports/multimodal/e3_main.csv` across all 5 folds):**
  - **Quality-Aware Gated Fusion:** Accuracy = **0.8341 ± 0.0137** (83.41%), Macro F1 = **0.7779 ± 0.0087** (77.79%), Balanced Accuracy = 0.7879 ± 0.0087, Macro AUC = 0.9732 ± 0.0035, ECE = 0.0260
  - Concatenation Fusion: Accuracy = 0.8102, Macro F1 = 0.7525, Balanced Accuracy = 0.7625, Macro AUC = 0.9612
  - Late Fusion: Accuracy = 0.7994, Macro F1 = 0.7420, Balanced Accuracy = 0.7520, Macro AUC = 0.9536
  - Clinical Text Linear SVM: Accuracy = 0.7841, Macro F1 = 0.7056, Balanced Accuracy = 0.6910, Macro AUC = 0.9272
  - Image EfficientNet-B0: Accuracy = 0.7734, Macro F1 = 0.7211, Balanced Accuracy = 0.7311, Macro AUC = 0.9378
  - *Confirmed:* Quality-Aware Gated Fusion strictly achieves the highest mean macro-F1 (+2.54% over concat, +3.59% over late, +5.68% over image, +7.23% over text) and highest accuracy across all 5 folds.
- **Files Changed:**
  - `frontend/src/pages/ModelComparisonPage.tsx`
  - `frontend/src/components/Navigation.tsx`
  - `frontend/src/pages/LandingPage.tsx`
  - `frontend/src/pages/ClinicalAnalysisPage.tsx`
  - `frontend/src/pages/ResearchLabPage.tsx`
  - `frontend/src/App.tsx`
- **How It Was Verified:**
  - Converted `ModelComparisonPage.tsx` to a single-model performance dashboard for Quality-Aware Gated Fusion:
    - 5-Fold summary metrics card with mean ± standard deviation.
    - 4-class per-class diagnostic performance table (precision, recall, F1, test support).
    - 4x4 normalized confusion matrix with cell sample counts and indigo intensity heatmap.
    - Receiver Operating Characteristic (ROC) curves per class and macro-average.
    - Reliability calibration diagram with ECE = 0.026 and Brier Score = 0.120.
    - Removed violet "DEPLOYED" badge and removed all model comparison selectors.
  - Renamed page title and navigation label to "Model Performance" (`/model-performance`).
  - Added routing aliases `/model-comparison` and `/models` redirecting to `/model-performance`.
  - Updated Landing Page module 03 copy to "Multimodal gated fusion architecture combining EfficientNet-B0 image embeddings with symptom-level clinical feature vectors."
  - Labeled Research Lab Tab 1 as "Ablation Study (Architecture Search)" with development-baseline context.
  - Verified regex `git grep -n -E "late.?fusion|concat(enation)?.?fusion|image.?only|text.?only" frontend/src` returns zero matches outside allowed code comments and ablation reference.
  - `python -m pytest tests -q` passed (25 tests).
  - `npm --prefix frontend run build` succeeded with zero errors (built in 16.33s).

### Bug / Change 12: Remove All Deployment Artefacts and Enforce Local-Only Execution
- **Issue:** Project contained cloud deployment configurations (`deploy.yml`, production references, and deployment wording) when MEDINTEL AI is strictly a research decision-support prototype intended to run locally on `localhost`.
- **Cause Found:**
  1. `.github/workflows/deploy.yml` attempted to build and publish static pages to GitHub Pages rather than running automated test suites.
  2. UI elements and tables displayed "DEPLOYED" badges and referenced production deployments.
  3. Lack of unified, cross-platform local execution scripts for launching both FastAPI backend (port 8000) and Vite frontend (port 5173).
  4. Vite dev server was configured for port 3000 rather than standard 5173.
- **Files Changed:**
  - Deleted `.github/workflows/deploy.yml`
  - Created `.github/workflows/ci.yml` (automated backend pytest and frontend build)
  - `run_local.bat` (Windows one-click launcher)
  - `run_local.sh` (macOS/Linux one-click launcher)
  - `frontend/vite.config.ts` (configured port 5173)
  - `frontend/.env.local` & `frontend/.env.example`
  - `frontend/src/components/DataTable.tsx` (changed highlightLabel from 'DEPLOYED' to 'MEDINTEL MODEL')
  - `frontend/src/pages/PresentationPage.tsx` (removed 'deployed' labels)
  - `frontend/src/pages/HistoryPage.tsx` (updated fold label from 'Fold 0 Deployed' to 'Fold 0 (Gated Fusion)')
  - `docs/architecture.md`
  - `README.md` (prominent Run Locally guide with prerequisites and commands)
- **How It Was Verified:**
  - Created `run_local.bat` and `run_local.sh` verifying Python 3.10+, Node.js 18+, virtual environments, dependencies, and graceful exit cleanup.
  - Verified CORS in `backend/app/main.py` explicitly whitelisting `http://localhost:5173` and `http://127.0.0.1:5173`.
  - Verified no cloud deployment URLs or config files remain (`vercel`, `netlify`, `render`, `heroku`, `docker`).
  - `python -m pytest tests -q` passed (25 passed in 14.31s).
  - `npm --prefix frontend run build` succeeded with zero errors (built in 10.86s).
