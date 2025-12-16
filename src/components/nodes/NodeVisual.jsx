import React, { useRef, useEffect } from "react";
import { Group, Circle, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { getGenreColor, getNodeRadius } from "./nodeUtils";
import Konva from "konva";

import universeCover from "../../assets/covers/universe-default.jpg";
import sagaCover from "../../assets/covers/saga-default.jpg";
import bookCover from "../../assets/covers/book-default.jpg";

function getDefaultCover(node) {
  if (node.type === "universe") return universeCover;
  if (node.type === "saga") return sagaCover;
  return bookCover;
}

function NodeVisual({ node, selected, hovered }) {
  const radius = getNodeRadius(node.type);
  const borderColor = getGenreColor(node.genre);

  const coverSrc = node.cover || getDefaultCover(node);
  const [image] = useImage(coverSrc);

  const glowRef = useRef(null);

  useEffect(() => {
    if (!selected || !glowRef.current) return;

    const glow = glowRef.current;
    glow.cache();

    const tween = new Konva.Tween({
      node: glow,
      duration: 1.8,
      shadowBlur: 30,
      shadowOpacity: 1,
      yoyo: true,
      repeat: Infinity,
      easing: Konva.Easings.EaseInOut,
    });

    tween.play();

    return () => {
      tween.destroy();
      glow.clearCache();
    };
  }, [selected]);

  return (
    <Group>

      {/* 🌫️ HOVER GLOW (subtil) */}
      {hovered && !selected && (
        <Circle
          radius={radius + 6}
          fill={borderColor}
          opacity={0.5}
          shadowColor={borderColor}
          shadowBlur={14}
          shadowOpacity={0.6}
          shadowOffset={{ x: 0, y: 0 }}
          listening={false}
        />
      )}

      {/* ✨ SELECTED GLOW (fort, pulsant) */}
      {selected && (
        <>
          <Circle
            ref={glowRef}
            radius={radius + 8}
            fill={borderColor}
            opacity={0.5}
            shadowColor={borderColor}
            shadowBlur={28}
            shadowOpacity={1}
            shadowOffset={{ x: 0, y: 0 }}
            listening={false}
          />

          <Circle
            radius={radius + 4}
            stroke={borderColor}
            strokeWidth={2}
            opacity={0.45}
            listening={false}
          />
        </>
      )}

      {/* 🟣 BORDE */}
      <Circle
        radius={radius}
        stroke={borderColor}
        strokeWidth={4}
        fill="#020617"
      />

      {/* 🖼️ IMATGE CLIPPED */}
      <Group
        clipFunc={(ctx) => {
          ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        }}
      >
        {image && (() => {
          const imgRatio = image.width / image.height;
          const boxSize = radius * 2;

          let drawWidth, drawHeight;

          if (imgRatio > 1) {
            drawHeight = boxSize;
            drawWidth = boxSize * imgRatio;
          } else {
            drawWidth = boxSize;
            drawHeight = boxSize / imgRatio;
          }

          return (
            <KonvaImage
              image={image}
              x={-drawWidth / 2}
              y={-drawHeight / 2}
              width={drawWidth}
              height={drawHeight}
              listening={false}
            />
          );
        })()}
      </Group>
    </Group>
  );
}

export default NodeVisual;
