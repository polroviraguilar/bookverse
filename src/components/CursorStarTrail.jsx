import { useEffect, useRef } from "react";
import Konva from "konva";
import { Layer } from "react-konva";

export default function CursorStarTrail({ stageRef }) {
  const layerRef = useRef(null);
  const lastSpawn = useRef(0);
  const lastPos = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const spawnStar = () => {
      const now = performance.now();
      if (now - lastSpawn.current < 12) return;
      lastSpawn.current = now;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const tr = stage.getAbsoluteTransform().copy();
      tr.invert();
      const pos = tr.point(pointer);

      // velocitat del cursor
      let speed = 0;
      if (lastPos.current) {
        const dx = pos.x - lastPos.current.x;
        const dy = pos.y - lastPos.current.y;
        speed = Math.sqrt(dx * dx + dy * dy);
      }
      lastPos.current = pos;

      // spawn density segons velocitat
      const spawnCount = speed > 20 ? 2 : 1;

      for (let i = 0; i < spawnCount; i++) {
        const typeRand = Math.random();

        // Tipus de partícula
        const cfg =
          typeRand < 0.15
            ? { r: 2.2, blur: 12, life: 0.9, op: 0.9 } // glow fort
            : typeRand < 0.5
            ? { r: 1.4, blur: 6, life: 0.6, op: 0.7 } // estrella normal
            : { r: 0.8, blur: 0, life: 0.35, op: 0.6 }; // micro

        const angle = Math.random() * Math.PI * 2;
        const drift = Math.random() * 10 + 4;

        const star = new Konva.Circle({
          x: pos.x + (Math.random() - 0.5) * 2,
          y: pos.y + (Math.random() - 0.5) * 2,
          radius: cfg.r,
          fill: "white",
          opacity: cfg.op,
          shadowColor: "white",
          shadowBlur: cfg.blur,
          listening: false,
          perfectDrawEnabled: false,
        });

        layer.add(star);

        // animació principal (fade + drift)
        star.to({
          x: star.x() + Math.cos(angle) * drift,
          y: star.y() + Math.sin(angle) * drift,
          opacity: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: cfg.life,
          easing: Konva.Easings.EaseOut,
          onFinish: () => star.destroy(),
        });

        // petit twinkle (només per les grosses)
        if (cfg.blur > 0) {
          star.to({
            opacity: cfg.op * 0.6,
            duration: cfg.life * 0.4,
            yoyo: true,
            repeat: 1,
            easing: Konva.Easings.EaseInOut,
          });
        }
      }
    };

    stage.on("mousemove touchmove", spawnStar);
    return () => stage.off("mousemove touchmove", spawnStar);
  }, [stageRef]);

  return <Layer ref={layerRef} listening={false} />;
}
