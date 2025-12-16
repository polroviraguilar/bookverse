import React, { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Group, Rect, Circle } from "react-konva";

/**
 * HybridGrid OPTIMITZAT
 * - Fons d’estrelles com bitmap cachejat
 * - Estrelles “vives” (interactives) limitades
 * - Zero re-render per frame
 */
export default function HybridGrid({
  stageRef,
  bounds = 10000,

  // ⭐️ Només aquestes seran “vives”
  liveCounts = { mid: 500, big: 250 },
}) {
  const groupRef = useRef(null);

  // --------------------------------------------------
  // 1️⃣ BACKGROUND BITMAP (moltes estrelles barates)
  // --------------------------------------------------
  const [starPattern, setStarPattern] = useState(null);

  function createStarfieldBitmap(count = 5000, size = 1024) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.1 + 0.4;
      const o = Math.random() * 0.25 + 0.1;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${o})`;
      ctx.fill();
    }

    return canvas;
  }

  useEffect(() => {
    const bmp = createStarfieldBitmap(7000);
    setStarPattern(bmp);
  }, []);

  // --------------------------------------------------
  // 2️⃣ ESTRELLES VIVES (poques però boniques)
  // --------------------------------------------------
  const starsDataRef = useRef([]);
  const starNodesRef = useRef([]);

  const makeLiveStar = (tier) => {
    const cfg =
      tier === "big"
        ? { r: [2.4, 3.4], o: [0.25, 0.6], blur: [6, 14], speed: [0.2, 0.4] }
        : { r: [1.2, 2.0], o: [0.18, 0.45], blur: [2, 6], speed: [0.3, 0.6] };

    const ang = Math.random() * Math.PI * 2;
    const speed = cfg.speed[0] + Math.random() * (cfg.speed[1] - cfg.speed[0]);

    return {
      tier,
      x: (Math.random() - 0.5) * bounds * 2,
      y: (Math.random() - 0.5) * bounds * 2,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      radius: cfg.r[0] + Math.random() * (cfg.r[1] - cfg.r[0]),
      baseOpacity: cfg.o[0] + Math.random() * (cfg.o[1] - cfg.o[0]),
      baseBlur: cfg.blur[0] + Math.random() * (cfg.blur[1] - cfg.blur[0]),
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 0.8,
      hoverBoost: 0,
    };
  };

  const liveStars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < liveCounts.mid; i++) arr.push(makeLiveStar("mid"));
    for (let i = 0; i < liveCounts.big; i++) arr.push(makeLiveStar("big"));
    return arr;
  }, []);

  useEffect(() => {
    starsDataRef.current = liveStars;
    starNodesRef.current.length = liveStars.length;
  }, [liveStars]);

  // --------------------------------------------------
  // 3️⃣ ANIMACIÓ (ultra optimitzada)
  // --------------------------------------------------
  useEffect(() => {
    const layer = groupRef.current?.getLayer();
    if (!layer) return;

    let last = performance.now();

    const influenceRadius = 220;
    const repelStrength = 0.8;
    const boostDecay = 0.92;

    const anim = new Konva.Animation(() => {
      const now = performance.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // Pointer world coords
      let pointerWorld = null;
      const stage = stageRef?.current;
      if (stage) {
        const p = stage.getPointerPosition();
        if (p) {
          const tr = stage.getAbsoluteTransform().copy();
          tr.invert();
          pointerWorld = tr.point(p);
        }
      }

      const stars = starsDataRef.current;

      for (let i = 0; i < stars.length; i++) {
  const s = stars[i];
  const node = starNodesRef.current[i];
  if (!node) continue;

  // Twinkle
  s.twinklePhase += dt * s.twinkleSpeed * 0.6;
  const tw = Math.sin(s.twinklePhase);

  // Hover interaction
  if (pointerWorld) {
    const dx = s.x - pointerWorld.x;
    const dy = s.y - pointerWorld.y;
    const d2 = dx * dx + dy * dy;
    const r2 = influenceRadius * influenceRadius;

    if (d2 < r2) {
      const t = 1 - d2 / r2;
      const inv = 1 / Math.sqrt(d2 + 0.0001);

      s.vx += dx * inv * t * repelStrength * dt * 10;
      s.vy += dy * inv * t * repelStrength * dt * 10;

      s.hoverBoost = Math.min(1, s.hoverBoost + t * 0.15);
    }
  }

  s.hoverBoost *= boostDecay;

  // Move
  s.x += s.vx * dt * 20;
  s.y += s.vy * dt * 20;
  s.vx *= 0.999;
  s.vy *= 0.999;

  // Wrap
  const lim = bounds;
  if (s.x > lim) s.x = -lim;
  if (s.x < -lim) s.x = lim;
  if (s.y > lim) s.y = -lim;
  if (s.y < -lim) s.y = lim;

  const boost = s.hoverBoost;

  node.position({ x: s.x, y: s.y });
  node.opacity(
    Math.min(1, s.baseOpacity + tw * 0.08 + boost * 0.3)
  );
  node.scale({
    x: 1 + boost * 0.25,
    y: 1 + boost * 0.25,
  });
}

    }, layer);

    anim.start();
    return () => anim.stop();
  }, [bounds, stageRef]);

  // --------------------------------------------------
  // 4️⃣ RENDER
  // --------------------------------------------------
  return (
    <Group ref={groupRef} listening={false}>
      {/* ⭐ FONS */}
      {starPattern && (
        <Rect
          x={-bounds}
          y={-bounds}
          width={bounds * 2}
          height={bounds * 2}
          fillPatternImage={starPattern}
          fillPatternRepeat="repeat"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}

      {/* ✨ ESTRELLES VIVES */}
      {liveStars.map((s, i) => (
        <Circle
          key={i}
          ref={(n) => {
            if (n && !n._cachedOnce) {
              n.cache({ pixelRatio: 1 });
              n._cachedOnce = true;
              starNodesRef.current[i] = n;
            }
          }}
          x={s.x}
          y={s.y}
          radius={s.radius}
          fill="white"
          opacity={s.baseOpacity}
          shadowColor="white"
          shadowBlur={s.baseBlur}
          shadowOpacity={0.9}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
}
