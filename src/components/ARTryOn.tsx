import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { OUTFITS, type Outfit } from "@/ar-engine/outfits";
import { Camera, RotateCw, Shirt } from "lucide-react";

type Status = "idle" | "loading" | "ready" | "error";

/**
 * One-Euro filter: adaptive low-pass that cuts jitter at rest
 * and reduces lag during fast motion.
 * Refs: https://gery.casiez.net/1euro/
 */
class OneEuroFilter {
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev = 0;
  constructor(
    private minCutoff = 1.2,
    private beta = 0.02,
    private dCutoff = 1.0,
  ) {}
  private alpha(cutoff: number, dt: number) {
    const r = 2 * Math.PI * cutoff * dt;
    return r / (r + 1);
  }
  filter(x: number, tMs: number) {
    if (this.xPrev === null) {
      this.xPrev = x;
      this.tPrev = tMs;
      return x;
    }
    const dt = Math.max(1e-3, (tMs - this.tPrev) / 1000);
    this.tPrev = tMs;
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    return xHat;
  }
  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
  }
}

// median-of-3 to drop single-frame outliers from MediaPipe
class MedianBuf {
  private buf: number[] = [];
  push(v: number) {
    this.buf.push(v);
    if (this.buf.length > 3) this.buf.shift();
    const s = [...this.buf].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }
}

type ARTryOnProps = {
  open: boolean;
  preSelectOutfit?: string | null;
  onClose: () => void;
  showToast?: (message: string) => void;
};

export function ARTryOn({
  open,
  preSelectOutfit,
  onClose,
  showToast = () => {},
}: ARTryOnProps) {
  if (!open) return null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeId, setActiveId] = useState<string>(OUTFITS[0].id);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const [previewId, setPreviewId] = useState<string>(OUTFITS[0].id);

  useEffect(() => {
    if (preSelectOutfit && OUTFITS.some((o) => o.id === preSelectOutfit)) {
      setActiveId(preSelectOutfit);
      setPreviewId(preSelectOutfit);
    }
  }, [preSelectOutfit]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;

    // Per-signal one-euro filters. Tuned: low minCutoff = strong rest
    // smoothing; beta lifts the cutoff when motion is fast = no lag.
    const fSx = new OneEuroFilter(1.0, 0.05);
    const fSy = new OneEuroFilter(1.0, 0.05);
    const fHx = new OneEuroFilter(1.0, 0.05);
    const fHy = new OneEuroFilter(1.0, 0.05);
    const fShoulderDist = new OneEuroFilter(0.8, 0.02);
    const fAngle = new OneEuroFilter(0.6, 0.04);
    const fVis = new OneEuroFilter(2.0, 0.0);
    // outlier rejection on raw landmark coords
    const mLsx = new MedianBuf(),
      mLsy = new MedianBuf(),
      mRsx = new MedianBuf(),
      mRsy = new MedianBuf(),
      mLhx = new MedianBuf(),
      mLhy = new MedianBuf(),
      mRhx = new MedianBuf(),
      mRhy = new MedianBuf();
    let lostFrames = 0;

    async function init() {
      try {
        setStatus("loading");

        // 1. Camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        // 2. MediaPipe Pose
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
        );
        landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        // 3. Three.js scene
        const canvas = canvasRef.current!;
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 5;

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(2, 3, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xff66cc, 0.6);
        rim.position.set(-3, 1, -2);
        scene.add(rim);

        // Outfit holder. The garment is rendered as a textured plane (the
        // PNG of the clothing) sized to match the user's shoulder span.
        const outfitGroup = new THREE.Group();
        scene.add(outfitGroup);
        // Inner pivot lets us offset the plane so the collar sits at y=0
        // while the plane center is wherever needed.
        const outfitPivot = new THREE.Group();
        outfitGroup.add(outfitPivot);

        const texLoader = new THREE.TextureLoader();
        const textureCache = new Map<string, THREE.Texture>();
        const loadTexture = (url: string) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            const cached = textureCache.get(url);
            if (cached) return resolve(cached);
            texLoader.load(
              url,
              (tex: THREE.Texture) => {
                tex.anisotropy = 8;
                tex.colorSpace = THREE.SRGBColorSpace;
                textureCache.set(url, tex);
                resolve(tex);
              },
              undefined,
              reject,
            );
          });

        // Per-outfit aspect / anchor info, populated as textures load
        let currentDef: Outfit | null = null;
        let outfitMesh: THREE.Mesh | null = null;
        let aspect = 1; // imgH / imgW
        let collarYRatio = 0.2;
        let shoulderRatio = 0.6;
        let hemYRatio = 0.88;

        let currentId = "";
        const swapOutfit = async (id: string) => {
          if (id === currentId) return;
          currentId = id;
          const def = OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
          const tex = await loadTexture(def.image);
          if (currentId !== id) return; // stale
          // Remove previous mesh
          while (outfitPivot.children.length) {
            const c = outfitPivot.children[0] as THREE.Mesh;
            outfitPivot.remove(c);
            (c.material as THREE.Material)?.dispose?.();
            c.geometry?.dispose?.();
          }
          const img = tex.image as { width: number; height: number };
          aspect = img.height / img.width;
          collarYRatio = def.collarYRatio;
          shoulderRatio = def.shoulderRatio;
          hemYRatio = def.hemYRatio;
          // per-outfit scale fine-tune (default 1)
          const scaleAdjust = def.scaleAdjust ?? 1;
          currentDef = def;
          const geo = new THREE.PlaneGeometry(1, aspect);
          const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
          });
          outfitMesh = new THREE.Mesh(geo, mat);
          // Offset so that the collar (collarYRatio from top of image)
          // ends up at outfitGroup origin (which we anchor to the neck/chest).
          // Plane center is at 0; top edge at +aspect/2.
          // Collar y in plane coords = aspect/2 - collarYRatio * aspect.
          // We want that to be 0 -> shift mesh down by that amount.
          const collarY = aspect / 2 - collarYRatio * aspect;
          outfitMesh.position.y = -collarY;
          outfitPivot.add(outfitMesh);
          // store scaleAdjust on the group so the loop can use it
          (outfitGroup.userData as any).scaleAdjust = def.scaleAdjust ?? 1;
          outfitGroup.scale.setScalar(0.01); // entry pop
        };
        void swapOutfit(activeIdRef.current);

        function resize() {
          const c = containerRef.current;
          if (!c || !renderer) return;
          const w = c.clientWidth;
          const h = c.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener("resize", resize);

        setStatus("ready");

        // 4. Animation loop
        let lastTs = -1;
        const loop = () => {
          if (stopped) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2 || !landmarker || !renderer) return;

          const ts = performance.now();
          if (ts === lastTs) return;
          lastTs = ts;

          let result: PoseLandmarkerResult | undefined;
          try {
            result = landmarker.detectForVideo(video, ts);
          } catch {
            return;
          }

          void swapOutfit(activeIdRef.current);

          const lm = result?.landmarks?.[0];
          if (lm && lm.length > 24) {
            lostFrames = 0;
            // mirrored: video is flipped horizontally via CSS, so flip x here
            const mx = (n: { x: number }) => 1 - n.x;
            const lShoulder = lm[11];
            const rShoulder = lm[12];
            const lHip = lm[23];
            const rHip = lm[24];
            const lEar = lm[7];
            const rEar = lm[8];

            // 1. Outlier rejection on each raw landmark coord
            const lsx = mLsx.push(mx(lShoulder));
            const lsy = mLsy.push(lShoulder.y);
            const rsx = mRsx.push(mx(rShoulder));
            const rsy = mRsy.push(rShoulder.y);
            const lhx = mLhx.push(mx(lHip));
            const lhy = mLhy.push(lHip.y);
            const rhx = mRhx.push(mx(rHip));
            const rhy = mRhy.push(rHip.y);

            // 2. Derived signals
            const rawSx = (lsx + rsx) / 2;
            const rawSy = (lsy + rsy) / 2;
            const rawHx = (lhx + rhx) / 2;
            const rawHy = (lhy + rhy) / 2;
            const rawShoulderDist = Math.hypot(rsx - lsx, rsy - lsy);
            const rawAngle = Math.atan2(rsy - lsy, rsx - lsx);
            const rawVis = Math.min(lShoulder.visibility ?? 1, rShoulder.visibility ?? 1);

            // 3. One-Euro per-signal
            const sx = fSx.filter(rawSx, ts);
            const sy = fSy.filter(rawSy, ts);
            const hx = fHx.filter(rawHx, ts);
            const hy = fHy.filter(rawHy, ts);
            const shoulderDist = fShoulderDist.filter(rawShoulderDist, ts);
            const angle = fAngle.filter(rawAngle, ts);
            const visibility = fVis.filter(rawVis, ts);
            const torsoLen = Math.hypot(sx - hx, sy - hy);

            // The <video> uses object-cover, so the visible frame is scaled
            // and cropped relative to the container. MediaPipe landmarks are
            // normalized to the RAW video frame, so we must remap them to
            // CONTAINER-normalized coords before turning them into world
            // coords — otherwise the outfit "floats" away from the body.
            const cw = containerRef.current?.clientWidth ?? 1;
            const ch = containerRef.current?.clientHeight ?? 1;
            const vW = video.videoWidth || cw;
            const vH = video.videoHeight || ch;
            const cover = Math.max(cw / vW, ch / vH);
            const dispW = vW * cover;
            const dispH = vH * cover;
            const offX = (cw - dispW) / 2;
            const offY = (ch - dispH) / 2;
            const remap = (nx: number, ny: number) => ({
              x: (offX + nx * dispW) / cw,
              y: (offY + ny * dispH) / ch,
            });
            const s = remap(sx, sy);
            const h = remap(hx, hy);
            const shoulderDistC = (shoulderDist * dispW) / cw; // container-normalized
            const leftShoulderC = remap(lsx, lsy);
            const rightShoulderC = remap(rsx, rsy);
            const leftHipC = remap(lhx, lhy);
            const rightHipC = remap(rhx, rhy);
            const rawNeckC = remap((mx(lEar) + mx(rEar)) / 2, (lEar.y + rEar.y) / 2);
            const torsoLenC = Math.max(0.01, Math.hypot(s.x - h.x, s.y - h.y));
            const neckC = {
              x: s.x + (rawNeckC.x - s.x) * 0.35,
              y: s.y - torsoLenC * 0.06,
            };

            // viewport at z=0 (camera z=5, fov=45deg)
            const vhW = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
            const vwW = vhW * camera.aspect;
            const tx = (neckC.x - 0.5) * vwW;
            const ty = -(neckC.y - 0.5) * vhW;
            const torsoWorld = torsoLenC * vhW;
            const shoulderWorld = shoulderDistC * vwW;
            const widthScale = (shoulderWorld / shoulderRatio) * 1.18;
            const torsoImageRatio = Math.max(0.25, hemYRatio - collarYRatio);
            const heightScale = torsoWorld / (aspect * torsoImageRatio);
            const baseTarget = Math.min(widthScale * 1.08, heightScale * 1.12);
            const outfitScaleAdjust = (outfitGroup.userData as any).scaleAdjust ?? 1;
            const targetScale = baseTarget * outfitScaleAdjust;

            const leftShoulderWorld = new THREE.Vector3(
              (leftShoulderC.x - 0.5) * vwW,
              -(leftShoulderC.y - 0.5) * vhW,
              0,
            );
            const rightShoulderWorld = new THREE.Vector3(
              (rightShoulderC.x - 0.5) * vwW,
              -(rightShoulderC.y - 0.5) * vhW,
              0,
            );
            const leftHipWorld = new THREE.Vector3(
              (leftHipC.x - 0.5) * vwW,
              -(leftHipC.y - 0.5) * vhW,
              0,
            );
            const rightHipWorld = new THREE.Vector3(
              (rightHipC.x - 0.5) * vwW,
              -(rightHipC.y - 0.5) * vhW,
              0,
            );
            const shoulderTilt = Math.atan2(
              rightShoulderWorld.y - leftShoulderWorld.y,
              rightShoulderWorld.x - leftShoulderWorld.x,
            );
            const hipTilt = Math.atan2(
              rightHipWorld.y - leftHipWorld.y,
              rightHipWorld.x - leftHipWorld.x,
            );
            const bodyAngle = shoulderTilt * 0.72 + hipTilt * 0.28;
            void torsoLen;

            outfitGroup.position.set(tx, ty, 0);
            // entry-pop: ease scale on first frames so it doesn't snap
            const cur = outfitGroup.scale.x;
            const next = cur + (targetScale - cur) * 0.35;
            outfitGroup.scale.setScalar(next);
            outfitGroup.rotation.z = bodyAngle;
            outfitGroup.visible = visibility > 0.4;
          } else {
            // brief gap: keep showing for a few frames to avoid flicker
            lostFrames++;
            if (lostFrames > 8) {
              outfitGroup.visible = false;
              fSx.reset();
              fSy.reset();
              fHx.reset();
              fHy.reset();
              fShoulderDist.reset();
              fAngle.reset();
            }
          }

          renderer.render(scene, camera);
        };
        loop();

        return () => window.removeEventListener("resize", resize);
      } catch (e) {
        console.error(e);
        setErrorMsg(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }

    init();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background">
      <div ref={containerRef} className="absolute inset-0">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      {/* Top bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <div className="pointer-events-auto rounded-full bg-background/40 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md">
          MetaDress <span className="text-primary">3D</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-background/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <span>
            {status === "ready" && "● Live"}
            {status === "loading" && "Loading…"}
            {status === "idle" && "Starting…"}
            {status === "error" && "Error"}
          </span>
          <span className="hidden sm:inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] text-foreground">
            {OUTFITS.find((o) => o.id === activeId)?.name || "Select outfit"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition hover:bg-background/80"
        >
          Close
        </button>
      </div>

      {/* Side action rail */}
      <div className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {[
          { icon: Camera, label: "Snapshot" },
          { icon: RotateCw, label: "Flip camera" },
          { icon: Shirt, label: "Wardrobe" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            aria-label={label}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/50 text-foreground shadow-lg backdrop-blur-md transition hover:bg-background/70"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Bottom panel: thumbnails + actions */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-background/55 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {OUTFITS.map((o) => {
              const isPreview = o.id === previewId;
              return (
                <button
                  key={o.id}
                  onClick={() => setPreviewId(o.id)}
                  aria-label={o.name}
                  className={`relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-3xl border transition-all ${
                    isPreview
                      ? "ring-2 ring-primary border-primary"
                      : "ring-1 ring-white/10 opacity-80 hover:opacity-100 border-white/10"
                  }`}
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-3xl bg-white/10 shadow-inner">
                    <img
                      src={o.image}
                      alt={o.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="mt-2 text-[10px] text-center font-medium text-foreground/90 leading-tight">
                    {o.name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                const idx = OUTFITS.findIndex((o) => o.id === previewId);
                setPreviewId(OUTFITS[(idx + 1) % OUTFITS.length].id);
              }}
              className="flex-1 rounded-full bg-background/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background/90"
            >
              Change Outfit
            </button>
            <button
              onClick={() => setActiveId(previewId)}
              className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
            >
              {activeId === previewId ? "Wearing" : "Try On"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading / error overlays */}
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-xl">
            {status === "error" ? (
              <>
                <h2 className="text-lg font-semibold">Camera unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {errorMsg || "Allow camera access and refresh."}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <h2 className="text-lg font-semibold">Booting AR engine…</h2>
                <p className="mt-1 text-xs text-muted-foreground">Loading pose model & camera</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
