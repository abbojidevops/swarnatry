"use client";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceAnchors {
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  noseWing: { x: number; y: number };
  forehead: { x: number; y: number };
  chin: { x: number; y: number };
  neck: { x: number; y: number };
  faceWidth: number;
  faceHeight: number;
  rollAngle: number; // in radians
  pitchAngle?: number;
  yawAngle?: number;
  chest?: { x: number; y: number };
  nose?: { x: number; y: number };
  detected: boolean;
}

// Fallback default face anchors for when face detector is loading or simulated
export const DEFAULT_FACE_ANCHORS: FaceAnchors = {
  leftEar: { x: 0.32, y: 0.52 },
  rightEar: { x: 0.68, y: 0.52 },
  noseWing: { x: 0.53, y: 0.52 },
  forehead: { x: 0.5, y: 0.28 },
  chin: { x: 0.5, y: 0.72 },
  neck: { x: 0.5, y: 0.88 },
  faceWidth: 0.36,
  faceHeight: 0.44,
  rollAngle: 0,
  detected: true,
};

let faceLandmarkerInstance: any = null;
let isLoadingLandmarker = false;

export async function initializeFaceLandmarker(): Promise<any> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (typeof window === "undefined") return null;

  if (isLoadingLandmarker) {
    // Wait until loading finishes
    while (isLoadingLandmarker) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return faceLandmarkerInstance;
  }

  isLoadingLandmarker = true;
  try {
    const { FilesetResolver, FaceLandmarker } = await import(
      "@mediapipe/tasks-vision"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      runningMode: "VIDEO",
      numFaces: 1,
    });

    isLoadingLandmarker = false;
    return faceLandmarkerInstance;
  } catch (error) {
    console.warn("MediaPipe model loading fallback:", error);
    isLoadingLandmarker = false;
    return null;
  }
}

/**
 * Extracts exact jewelry anchor coordinates from MediaPipe Face Landmarks
 */
export function extractJewelryAnchors(
  landmarks: NormalizedLandmark[]
): FaceAnchors {
  if (!landmarks || landmarks.length < 468) {
    return DEFAULT_FACE_ANCHORS;
  }

  // Key MediaPipe Face Mesh Landmark Indices:
  // 177: Left earlobe region
  // 401: Right earlobe region
  // 98: Left nostril wing
  // 327: Right nostril wing
  // 10: Forehead center / top hairline
  // 151: Glabella / forehead mid
  // 152: Chin bottom
  // 234, 454: Left and right cheek / zygomatic arches

  const leftEarPt = landmarks[177] || landmarks[234];
  const rightEarPt = landmarks[401] || landmarks[454];
  const nosePt = landmarks[98] || landmarks[1];
  const foreheadPt = landmarks[10] || landmarks[151];
  const chinPt = landmarks[152];

  // Calculate face width & height
  const dx = rightEarPt.x - leftEarPt.x;
  const dy = rightEarPt.y - leftEarPt.y;
  const faceWidth = Math.sqrt(dx * dx + dy * dy);
  const faceHeight = Math.abs(chinPt.y - foreheadPt.y);

  // Roll angle (tilt of the head)
  const rollAngle = Math.atan2(dy, dx);

  // Dynamically compute Neck Base anchor:
  // Extrapolate below chin landmark 152, proportional to faceHeight
  const neckY = chinPt.y + faceHeight * 0.32;
  const neckX = chinPt.x + (foreheadPt.x - chinPt.x) * -0.15;

  return {
    leftEar: { x: leftEarPt.x, y: leftEarPt.y },
    rightEar: { x: rightEarPt.x, y: rightEarPt.y },
    noseWing: { x: nosePt.x, y: nosePt.y },
    forehead: { x: foreheadPt.x, y: foreheadPt.y },
    chin: { x: chinPt.x, y: chinPt.y },
    neck: { x: neckX, y: neckY },
    faceWidth,
    faceHeight,
    rollAngle,
    detected: true,
  };
}

export const initFaceLandmarker = initializeFaceLandmarker;

export function detectFaceAnchors(
  landmarker: any,
  videoElement: HTMLVideoElement
): FaceAnchors | null {
  if (!videoElement || videoElement.readyState < 2) {
    return null;
  }
  if (!landmarker) {
    return DEFAULT_FACE_ANCHORS;
  }
  try {
    const results = landmarker.detectForVideo(videoElement, performance.now());
    if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
      return extractJewelryAnchors(results.faceLandmarks[0]);
    }
  } catch (e) {
    // MediaPipe detection frame pass
  }
  return DEFAULT_FACE_ANCHORS;
}
