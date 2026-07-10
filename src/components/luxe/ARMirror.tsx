// ============================
// MetaDress AR FASHION — ARMirror.tsx
// AR Try-On Mirror using MediaPipe Pose (loaded via CDN)
// ============================

import { useCallback, useEffect, useRef, useState } from "react";
import { AR_OUTFITS, type AROutfit } from "@/lib/luxe/data";
import { drawAbaya, drawFullDress, drawOutfitOverlay, drawSparkles } from "@/lib/luxe/ar-drawing";

declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

type ARStatus = "loading" | "starting" | "active" | "pose" | "error" | "demo";

interface SelectedOutfit extends AROutfit {
  id: string;
}

interface ARMirrorProps {
  open: boolean;
  preSelectOutfit: string | null;
  onClose: () => void;
  showToast: (message: string) => void;
}

export default function ARMirror({ open, preSelectOutfit, onClose, showToast }: ARMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const activeRef = useRef(false);
  const facingModeRef = useRef<"user" | "environment">("user");
  const selectedOutfitRef = useRef<SelectedOutfit | null>(null);

  const [status, setStatus] = useState<ARStatus>("loading");
  const [noCam, setNoCam] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<SelectedOutfit | null>(null);

  selectedOutfitRef.current = selectedOutfit;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ===== SELECT OUTFIT =====
  const selectAROutfit = useCallback((id: string) => {
    const outfit = AR_OUTFITS[id];
    if (!outfit) return;
    setSelectedOutfit({ id, ...outfit });
  }, []);

  // ===== POSE RESULTS CALLBACK =====
  const onPoseResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const outfit = selectedOutfitRef.current;
    if (!outfit || !results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    const W = canvas.width;
    const H = canvas.height;

    // Key landmarks
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftShoulder || !rightShoulder) return;

    // Calculate body measurements in canvas coords
    const lsX = leftShoulder.x * W, lsY = leftShoulder.y * H;
    const rsX = rightShoulder.x * W, rsY = rightShoulder.y * H;
    const lhX = leftHip ? leftHip.x * W : lsX;
    const rhX = rightHip ? rightHip.x * W : rsX;
    const lhY = leftHip ? leftHip.y * H : lsY + H * 0.3;
    const rhY = rightHip ? rightHip.y * H : rsY + H * 0.3;

    const shoulderW = Math.abs(lsX - rsX);
    const hipW = Math.max(Math.abs(lhX - rhX), shoulderW * 0.9);
    const bodyH = Math.abs((lhY + rhY) / 2 - (lsY + rsY) / 2);
    const centerX = (lsX + rsX) / 2;
    const shoulderY = (lsY + rsY) / 2;
    const hipY = (lhY + rhY) / 2;

    drawOutfitOverlay(ctx, outfit, { centerX, shoulderY, hipY, shoulderW, hipW, bodyH, W, H });
  }, []);

  // ===== FALLBACK RENDER (no MediaPipe) =====
  const startFallbackRender = useCallback(() => {
    setStatus("demo");

    let frame = 0;
    const render = () => {
      if (!activeRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const outfit = selectedOutfitRef.current;
      if (outfit) {
        const W = canvas.width, H = canvas.height;
        // Demo overlay — centered on screen
        const cx = W / 2;
        const topY = H * 0.15;
        const shoulderW = W * 0.35;
        const bodyH = H * 0.35;

        // Subtle breathing animation
        const breathe = 1 + Math.sin(frame * 0.03) * 0.005;
        ctx.save();
        ctx.translate(cx, topY + bodyH / 2);
        ctx.scale(breathe, breathe);
        ctx.translate(-cx, -(topY + bodyH / 2));

        const demoHipW = shoulderW * 1.15;
        if (outfit.type === "abaya") {
          drawAbaya(ctx, outfit, cx, topY, shoulderW * 2.3, H, shoulderW, demoHipW, bodyH);
        } else {
          drawFullDress(ctx, outfit, cx, topY, shoulderW * 2, H, shoulderW, demoHipW, bodyH);
        }

        if (outfit.type === "sequin") {
          drawSparkles(ctx, cx, topY, shoulderW * 2, H - topY);
        }

        ctx.restore();
        frame++;

        // Instructional overlay
        ctx.fillStyle = "rgba(201, 169, 110, 0.8)";
        ctx.font = "14px DM Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("📷 Position yourself in frame", W / 2, H - 30);
      }

      requestAnimationFrame(render);
    };

    render();
  }, []);

  // ===== MEDIAPIPE POSE DETECTION =====
  const startPoseDetection = useCallback(() => {
    activeRef.current = true;

    // Check if MediaPipe is available
    if (typeof window.Pose === "undefined") {
      console.warn("MediaPipe Pose not loaded, using fallback rendering");
      startFallbackRender();
      return;
    }

    try {
      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onPoseResults);
      poseRef.current = pose;

      const video = videoRef.current!;

      if (typeof window.Camera !== "undefined") {
        const camera = new window.Camera(video, {
          onFrame: async () => {
            if (poseRef.current && activeRef.current) {
              await poseRef.current.send({ image: video });
            }
          },
          width: 1280,
          height: 720,
        });
        camera.start();
        cameraRef.current = camera;
      } else {
        // Manual frame loop
        const runLoop = async () => {
          if (!activeRef.current) return;
          if (poseRef.current) await poseRef.current.send({ image: video });
          requestAnimationFrame(runLoop);
        };
        video.addEventListener("loadeddata", runLoop);
      }

      setStatus("pose");
    } catch (err) {
      console.warn("MediaPipe init failed:", err);
      startFallbackRender();
    }
  }, [onPoseResults, startFallbackRender]);

  // ===== CANVAS SETUP =====
  const setupCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
    };

    video.addEventListener("loadedmetadata", resizeCanvas);
    resizeCanvas();
    setTimeout(resizeCanvas, 1000);
  }, []);

  // ===== CAMERA =====
  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingModeRef.current,
        },
        audio: false,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      setNoCam(false);
      setStatus("active");

      setupCanvas();
      startPoseDetection();
    } catch (err) {
      console.error("Camera error:", err);
      setNoCam(true);
      setStatus("error");
    }
  }, [setupCanvas, startPoseDetection]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop?.();
      cameraRef.current = null;
    }
  }, []);

  // ===== OPEN/CLOSE LIFECYCLE =====
  useEffect(() => {
    if (open) {
      startCamera();
      if (preSelectOutfit) {
        const id = preSelectOutfit;
        const timer = setTimeout(() => selectAROutfit(id), 500);
        return () => clearTimeout(timer);
      }
    } else {
      activeRef.current = false;
      stopCamera();
      setSelectedOutfit(null);
      clearCanvas();
      setStatus("loading");
      setNoCam(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Preselect outfit changes while open
  useEffect(() => {
    if (open && preSelectOutfit) {
      selectAROutfit(preSelectOutfit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectOutfit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  // ===== CONTROLS =====
  const handleFlip = () => {
    facingModeRef.current = facingModeRef.current === "user" ? "environment" : "user";
    stopCamera();
    startCamera();
  };

  const handleRemoveOutfit = () => {
    setSelectedOutfit(null);
    clearCanvas();
  };

  // ===== SCREENSHOT =====
  const takeScreenshot = () => {
    const video = videoRef.current;
    const arCanvas = canvasRef.current;
    if (!video || !arCanvas) return;

    const screenshotCanvas = document.createElement("canvas");
    screenshotCanvas.width = video.videoWidth || 640;
    screenshotCanvas.height = video.videoHeight || 480;
    const ctx = screenshotCanvas.getContext("2d");
    if (!ctx) return;

    // Draw video (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -screenshotCanvas.width, 0, screenshotCanvas.width, screenshotCanvas.height);
    ctx.restore();

    // Draw AR overlay (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(arCanvas, -screenshotCanvas.width, 0, screenshotCanvas.width, screenshotCanvas.height);
    ctx.restore();

    // Download
    const link = document.createElement("a");
    link.download = `MetaDress-AR-${Date.now()}.jpg`;
    link.href = screenshotCanvas.toDataURL("image/jpeg", 0.9);
    link.click();

    showToast("Screenshot saved! 📸");
  };

  const statusContent = () => {
    switch (status) {
      case "loading":
        return <><i className="fas fa-circle-notch fa-spin"></i> Loading camera...</>;
      case "starting":
        return <><i className="fas fa-circle-notch fa-spin"></i> Starting camera...</>;
      case "active":
        return <><i className="fas fa-circle" style={{ color: "#5cb85c", fontSize: "0.5rem" }}></i> Camera active</>;
      case "pose":
        return <><i className="fas fa-circle" style={{ color: "#5cb85c", fontSize: "0.5rem" }}></i> Pose detected</>;
      case "demo":
        return <><i className="fas fa-magic" style={{ color: "var(--gold)" }}></i> Demo AR mode</>;
      case "error":
        return <><i className="fas fa-exclamation-triangle"></i> Camera unavailable</>;
    }
  };

  return (
    <div className={`ar-modal ${open ? "open" : ""}`} id="arModal">
      <div className="ar-modal-inner">
        <div className="ar-modal-header">
          <h2><i className="fas fa-camera-retro"></i> AR Try-On Mirror</h2>
          <button className="ar-close-btn" id="arCloseBtn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="ar-body">
          <div className="ar-viewport">
            <video id="arVideo" ref={videoRef} autoPlay playsInline muted></video>
            <canvas id="arCanvas" ref={canvasRef}></canvas>
            <div className="ar-overlay-ui">
              <div className="ar-status" id="arStatus">{statusContent()}</div>
              <div className="ar-outfit-label" id="arOutfitLabel">
                {selectedOutfit ? `${selectedOutfit.emoji} ${selectedOutfit.name}` : ""}
              </div>
            </div>
            <div className="ar-no-cam" id="arNoCam" style={{ display: noCam ? "flex" : "none" }}>
              <i className="fas fa-video-slash"></i>
              <p>Camera access required</p>
              <button className="btn-primary" id="retryCam" onClick={() => startCamera()}>
                Allow Camera
              </button>
            </div>
          </div>

          <div className="ar-sidebar">
            <h3>Choose Outfit</h3>
            <div className="ar-outfit-list" id="arOutfitList">
              {Object.entries(AR_OUTFITS).map(([id, o]) => (
                <div
                  key={id}
                  className={`ar-outfit-option ${selectedOutfit?.id === id ? "active" : ""}`}
                  data-id={id}
                  onClick={() => selectAROutfit(id)}
                >
                  <div
                    className="ar-outfit-swatch"
                    style={{ background: `linear-gradient(135deg,${o.gradient[0]},${o.gradient[1]})` }}
                  >
                    {o.emoji}
                  </div>
                  <span className="ar-outfit-option-name">{o.name}</span>
                </div>
              ))}
            </div>
            <div className="ar-controls">
              <button className="ar-ctrl-btn" id="arScreenshot" title="Take Screenshot" onClick={takeScreenshot}>
                <i className="fas fa-camera"></i> Snap
              </button>
              <button className="ar-ctrl-btn" id="arFlipBtn" title="Flip Camera" onClick={handleFlip}>
                <i className="fas fa-sync-alt"></i> Flip
              </button>
              <button className="ar-ctrl-btn" id="arRemoveBtn" title="Remove Outfit" onClick={handleRemoveOutfit}>
                <i className="fas fa-ban"></i> None
              </button>
            </div>
            <p className="ar-tip">
              <i className="fas fa-info-circle"></i> Stand 1–2m from camera for best results. Pose
              detection uses AI to overlay outfits in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
