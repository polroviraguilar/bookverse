import { useEffect, useRef } from "react";
import Konva from "konva";
import { Arc, Circle, Group, Image as KonvaImage, Rect, Text } from "react-konva";
import useImage from "use-image";
import universeCover from "../../assets/covers/universe-default.jpg";
import sagaCover from "../../assets/covers/saga-default.jpg";
import bookCover from "../../assets/covers/book-default.jpg";
import { getNodeColor, getNodeRadius, getStatusLabel } from "./nodeUtils.js";

function coverFor(node) {
  if (node.cover) return node.cover;
  if (node.type === "universe") return universeCover;
  if (node.type === "saga") return sagaCover;
  return bookCover;
}

function crop(image, size) {
  if (!image) return null;
  const ratio = image.width / image.height;
  if (ratio > 1) {
    return { width: size * ratio, height: size };
  }
  return { width: size, height: size / ratio };
}

export default function NodeVisual({ node, selected, hovered, stageScale }) {
  const radius = getNodeRadius(node.type);
  const color = getNodeColor(node);
  const [image] = useImage(coverFor(node));
  const glowRef = useRef(null);
  const dimensions = crop(image, radius * 2);
  const labelScale = Math.max(0.78, Math.min(1.05, 1 / Math.max(stageScale, 0.75)));

  useEffect(() => {
    if (!selected || !glowRef.current) return undefined;
    const tween = new Konva.Tween({
      node: glowRef.current,
      duration: 1.6,
      opacity: 0.2,
      scaleX: 1.14,
      scaleY: 1.14,
      yoyo: true,
      repeat: Infinity,
      easing: Konva.Easings.EaseInOut,
    });
    tween.play();
    return () => tween.destroy();
  }, [selected]);

  return (
    <Group>
      {node.type !== "book" ? (
        <Circle
          radius={radius + 15}
          stroke={color}
          strokeWidth={1}
          dash={node.type === "universe" ? [5, 9] : [4, 10]}
          opacity={node.type === "universe" ? 0.42 : 0.28}
          shadowColor={color}
          shadowBlur={8}
          listening={false}
        />
      ) : null}

      {selected ? (
        <Circle
          ref={glowRef}
          radius={radius + 11}
          fill={color}
          opacity={0.32}
          shadowColor={color}
          shadowBlur={30}
          shadowOpacity={0.75}
          listening={false}
        />
      ) : hovered ? (
        <Circle radius={radius + 8} fill={color} opacity={0.16} shadowColor={color} shadowBlur={18} listening={false} />
      ) : null}

      <Circle radius={radius + 3} fill="#0b0d18" stroke="rgba(255,255,255,0.12)" strokeWidth={1} shadowColor="#000" shadowBlur={20} shadowOpacity={0.48} />
      <Group clipFunc={(context) => context.arc(0, 0, radius, 0, Math.PI * 2)}>
        <Circle radius={radius} fill="#111522" />
        {image && dimensions ? (
          <KonvaImage
            image={image}
            x={-dimensions.width / 2}
            y={-dimensions.height / 2}
            width={dimensions.width}
            height={dimensions.height}
            listening={false}
          />
        ) : null}
        <Rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} fillLinearGradientStartPoint={{ x: 0, y: -radius }} fillLinearGradientEndPoint={{ x: 0, y: radius }} fillLinearGradientColorStops={[0, "rgba(5,7,17,0.02)", 0.66, "rgba(5,7,17,0.08)", 1, "rgba(5,7,17,0.72)"]} listening={false} />
      </Group>
      <Circle radius={radius} stroke={color} strokeWidth={selected ? 3.5 : 2.5} opacity={0.95} listening={false} />

      {node.type === "saga" ? (
        <Arc
          innerRadius={radius + 7}
          outerRadius={radius + 10}
          angle={Math.max(2, (node.progressPercent || 0) * 3.6)}
          rotation={-90}
          fill={node.progressPercent === 100 ? "#66d59a" : color}
          opacity={0.9}
          listening={false}
        />
      ) : null}

      {node.type === "book" && node.status === "completat" ? (
        <Circle x={radius * 0.68} y={-radius * 0.68} radius={8} fill="#66d59a" stroke="#08150f" strokeWidth={3} shadowColor="#66d59a" shadowBlur={8} listening={false} />
      ) : null}

      <Group y={radius + 18} scaleX={labelScale} scaleY={labelScale} listening={false}>
        <Rect x={-88} y={0} width={176} height={node.type === "saga" ? 51 : 45} cornerRadius={12} fill="rgba(8,10,20,0.88)" stroke="rgba(255,255,255,0.10)" strokeWidth={1} shadowColor="#000" shadowBlur={12} shadowOpacity={0.42} />
        <Text x={-78} y={8} width={156} text={node.title} align="center" fontFamily="Inter, Arial, sans-serif" fontSize={13} fontStyle="bold" fill="#f8f6ff" ellipsis wrap="none" />
        <Text x={-78} y={27} width={156} text={node.type === "saga" ? `${node.readBooks || 0}/${node.totalBooks || 0} · ${node.progressPercent || 0}%` : node.type === "universe" ? `${node.universeSagaCount || 0} sagues · ${node.universeBookCount || 0} llibres` : getStatusLabel(node.status)} align="center" fontFamily="Inter, Arial, sans-serif" fontSize={10.5} fill="#9da8bd" ellipsis wrap="none" />
      </Group>
    </Group>
  );
}
