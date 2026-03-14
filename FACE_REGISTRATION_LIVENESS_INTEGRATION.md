# Face Registration + Liveness Integration Guide

This document explains the exact frontend implementation currently used in the Sagenex user app for face registration, and how to reuse it in a signup flow in another project.

## 1) Current Entry Points in This Project

### Profile trigger
- File: `src/app/profile/page.tsx`
- Section: `Face Verification`
- CTA route:
  - `router.push("/face-test?mode=enroll&next=/profile")`

### Face flow page
- File: `src/app/face-test/page.tsx`
- Query params used:
  - `mode=enroll` enables enrollment-first UX
  - `next=/some/path` decides redirect after successful enrollment

## 2) APIs Used by Frontend

Defined in `src/actions/user.ts`:

1. `GET /api/v1/user/biometrics/status`
- Action: `getBiometricsStatus()`
- Purpose: show current enrollment + approval state.

2. `POST /api/v1/user/biometrics/enroll`
- Action: `enrollFaceEmbedding(payload)`
- Payload:
```json
{
  "embedding": [0.123, -0.456],
  "source": "SELFIE",
  "faceImageUrl": "data:image/jpeg;base64,...",
  "meta": {
    "note": "test enroll",
    "capture": "webcam"
  }
}
```

3. `POST /api/v1/user/biometrics/verify`
- Action: `verifyFaceEmbedding(payload)`
- Payload:
```json
{
  "embedding": [0.123, -0.456],
  "purpose": "LOGIN",
  "livenessScore": 0.8,
  "meta": {
    "note": "test verify"
  }
}
```

Notes:
- These calls use authenticated headers from `getAuthHeaders()`.
- For signup usage, either:
  1. run face enrollment only after account creation + login token exists, or
  2. add separate pre-auth backend endpoints.

## 3) Models and Assets Required

`src/app/face-test/page.tsx` loads face-api models from:
- `MODEL_PATH = "/models/face-api"`

Required files in `public/models/face-api`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

## 4) UI Architecture

The page composes 4 UI blocks:
- `FaceScanHero` (camera view + oval + alignment hints)
- `DeviceSheet` (camera/model readiness + device picker + retry)
- `LivenessPanel` (step guidance and progress)
- `ActionsPanel` (start scan, enroll, verify, return)

## 4A) Visual Guidance Spec (Skeleton + Left/Right Overlay)

This is the part teams usually miss. The camera must not be plain video; it needs visual guidance layers so users can complete liveness reliably.

### Camera container behavior
- Use a full-screen camera on mobile and contained panel on desktop.
- Keep selfie view mirrored:
  - video class uses horizontal flip (`scaleX(-1)` equivalent).
- Add dark mask over video so overlays stay readable.

### Required overlay layers (in order)
Implement these on top of the video:

1. Oval face frame (primary guide)
- Large centered oval where face should fit.
- Default style: soft border (emerald/green with low opacity).
- When aligned: stronger border + glow.

2. Skeleton-style guide lines
- Add crosshair lines inside oval:
  - vertical line through center
  - horizontal line through center
- Add rotating/animated tick ring around the oval (visual “scanner” feel).
- This is the “skeleton” reference users asked for.
- Component reference: `FaceScanHero` includes these via:
  - `face-scan-ticks`
  - `face-scan-crosshair`
  - aligned state class `face-scan-aligned`

3. Step instruction bubble (top center)
- Show only while liveness is running.
- Text by step:
  - center -> `Look Straight Ahead`
  - left -> `Slowly Turn Left`
  - right -> `Slowly Turn Right`
- Add 3 mini progress dots for current step hold count (0..3).

4. Face alignment chip (corner)
- Live hint text:
  - `Move slightly left/right/up/down`
  - `Face aligned`
  - `Hold still... 1/3`, `2/3`, `3/3`
- Aligned state should turn green; non-aligned amber/yellow.

5. Sweep line animation (only during running)
- Horizontal scan line moving through oval while `livenessStatus = running`.

6. Success overlay (passed state)
- Dim background + big check icon + `Verification Complete`.
- Hide step instructions once passed.

### Left/Right progress overlay (outside camera)
Use a dedicated liveness panel (`LivenessPanel`) in addition to on-video instructions:

- Step pills always represent 3 steps:
  - Straight, Left, Right
- State colors:
  - done: green with check mark
  - current: highlighted and animated
  - pending: muted
- For current step, show hold-progress bar based on `livenessProgress / 3`.

### Mobile-specific behavior
- Hide floating “models/camera” chips after liveness starts to reduce clutter.
- Keep bottom controls sticky:
  - idle: show `Start Face Scan`
  - running: hide enroll/verify buttons
  - passed: show `Enroll Face`

### Desktop-specific behavior
- Keep two-column layout:
  - left: camera + overlays
  - right: liveness panel + actions panel
- Show all diagnostic chips and instruction cards.

Main local state in `src/app/face-test/page.tsx`:
- camera/models:
  - `modelsReady`, `modelsLoading`, `cameraReady`
  - `videoDevices`, `selectedDeviceId`
- flow:
  - `livenessStatus`: `idle | running | passed`
  - `livenessStepIndex`, `livenessProgress`
  - `loadingAction`: `enroll | verify | null`
- biometrics:
  - `isEnrolled`, `biometricsApproved`, `enrollSuccess`
- feedback:
  - `faceAligned`, `faceHint`, `yawDeg`, `error`

## 5) Liveness Logic (Implemented)

Liveness is a 3-step head-pose sequence:
- Steps: `center -> left -> right`
- Constant: `LIVENESS_STEPS = ["center", "left", "right"]`

Detection loop details:
- Runs every ~350ms via `setTimeout` recursion (`runLivenessLoop`).
- Detector:
  - `detectSingleFace(...TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))`
  - with landmarks (`withFaceLandmarks()`)
- Yaw estimation from landmarks:
  - eye centers + nose tip offset
  - yaw ratio mapped to degrees (`* 60`)
  - smoothed by averaging last 3 frames
- Match thresholds (`matchesStep`):
  - center: `-8 <= yaw <= 8`
  - left: `yaw > 12`
  - right: `yaw < -12`
- Step pass condition:
  - matched pose must be stable for 3 consecutive frames (`stableCount >= 3`).
- If no face for 3 loop cycles:
  - sets user error: move closer and center face.

Alignment checks:
- Face box corners must stay inside an oval guide.
- UI hint updates (`move left/right/up/down`, `face aligned`, etc.).

## 6) Capture + Embedding Extraction

Before capture, page enforces:
- models loaded
- camera ready
- liveness status is `passed`

Capture path:
1. `detectAllFaces(...).withFaceLandmarks().withFaceDescriptors()`
2. Hard checks:
- no face => error
- multiple faces => error
3. Embedding:
- 128D descriptor converted to number array with precision `toFixed(6)`
4. Snapshot:
- crop around face box with 20% padding
- resize to width 360
- encode JPEG (`quality 0.7`) as `faceImageUrl`

## 7) Enrollment and Redirect Behavior

Enrollment action:
- `handleEnroll()` calls enroll API with embedding + snapshot.
- On success (`embeddingId` exists):
  - refreshes status
  - redirects to `next` query param or `/profile`

Verification action:
- `handleVerify()` exists for testing and sends embedding to verify API.

## 8) Error Handling and Device Recovery

Camera errors mapped for user clarity:
- `NotAllowedError`: permission blocked
- `NotFoundError`: no camera
- `NotReadableError`: camera busy
- `OverconstrainedError`: unsupported constraints
- `SecurityError`: HTTPS/localhost required

Recovery actions:
- retry button triggers model load + camera ensure
- camera device selector available in `DeviceSheet`

## 9) What To Reuse in Signup Project

Recommended implementation order:
1. Reuse the same visual components and state machine from `face-test`.
2. Keep the same 3-step liveness algorithm initially (center/left/right).
3. Reuse embedding extraction and single-face enforcement.
4. Trigger enrollment only when auth token exists.
5. On success, continue signup completion route.

## 10) Signup-Specific Integration Pattern

If integrating inside signup wizard, use this flow:
1. User fills signup form.
2. Backend creates account and returns auth session/token.
3. Open face step (embedded component or dedicated route).
4. Run liveness -> capture -> call enroll API.
5. If enroll success, mark signup step complete and proceed.

If pre-auth enrollment is mandatory, backend must provide separate endpoints (do not reuse `/api/v1/user/biometrics/*` as-is).

## 11) QA Checklist

1. Camera permission denied path shows clear message.
2. Liveness does not pass without center->left->right movement.
3. Multiple faces block capture.
4. Enroll success redirects to expected `next` path.
5. Re-enroll path works when already enrolled.
6. Mobile UI remains usable with bottom floating controls.
7. Model files resolve from `/models/face-api/*` in production.
8. Oval + crosshair + tick-ring “skeleton” overlays render above camera.
9. Top instruction text changes correctly: Straight -> Left -> Right.
10. Running state shows scan line and per-step hold progress.
11. Passed state shows success overlay and unlocks enroll button.

## 12) Source File References

- `src/app/profile/page.tsx`
- `src/app/face-test/page.tsx`
- `src/actions/user.ts`
- `src/app/components/biometrics/FaceScanHero.tsx`
- `src/app/components/biometrics/LivenessPanel.tsx`
- `src/app/components/biometrics/ActionsPanel.tsx`
- `src/app/components/biometrics/DeviceSheet.tsx`
