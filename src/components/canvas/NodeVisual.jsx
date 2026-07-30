import { memo, useEffect, useRef } from "react";
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
  if (ratio > 1) return { width: size * ratio, height: size };
  return { width: size, height: size / ratio };
}

function NodeVisual({ node, selected, hovered, stageScale }) {
  const radius = getNodeRadius(node.type);
  const color = getNodeColor(node);
  const detailed = stageScale >= 0.5 || selected || hovered;
  const showLabel = stageScale >= 0.68 || selected || hovered;

  if (!detailed) {
    return (
      <Group listening={false} perfectDrawEnabled={false}>
        {selected ? <Circle radius={radius + 7} fill={color} opacity={0.2} /> : null}
        <Circle
          radius={radius * 0.72}
          fill={color}
          opacity={node.type === "book" ? 0.72 : 0.9}
          stroke="rgba(255,255,255,0.34)"
          strokeWidth={1.2}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
        {node.type === "book" && node.status === "completat" ? (
          <Circle x={radius * 0.48} y={-radius * 0.48} radius={5} fill="#66d59a" perfectDrawEnabled={false} />
        ) : null}
      </Group>
    );
  }

  return (
    <DetailedNode
      node={node}
      selected={selected}
      hovered={hovered}
      showLabel={showLabel}
      radius={radius}
      color={color}
    />
  );
}

function DetailedNode({ node, selected, hovered, showLabel, radius, color }) {
  const [image] = useImage(coverFor(node));
  const glowRef = useRef(null);
  const dimensions = crop(image, radius * 2);

  useEffect(() => {
    if (!selected || !glowRef.current) return undefined;
    const tween = new Konva.Tween({
      node: glowRef.current,
      duration: 1.8,
      opacity: 0.16,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      repeat: Infinity,
      easing: Konva.Easings.EaseInOut,
    });
    tween.play();
    return () => tween.destroy();
  }, [selected]);

  return (
    <Group perfectDrawEnabled={false}>
      {node.type !== "book" ? (
        <Circle
          radius={radius + 13}
          stroke={color}
          strokeWidth={1}
          dash={node.type === "universe" ? [5, 10] : [4, 11]}
          opacity={node.type === "universe" ? 0.34 : 0.24}
          listening={false}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
      ) : null}

      {selected ? (
        <Circle
          ref={glowRef}
          radius={radius + 9}
          fill={color}
          opacity={0.24}
          shadowColor={color}
          shadowBlur={18}
          shadowOpacity={0.55}
          listening={false}
          perfectDrawEnabled={false}
        />
      ) : hovered ? (
        <Circle
          radius={radius + 7}
          fill={color}
          opacity={0.13}
          listening={false}
          perfectDrawEnabled={false}
        />
      ) : null}

      <Circle
        radius={radius + 3}
        fill="#0b0d18"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />
      <Group clipFunc={(context) => context.arc(0, 0, radius, 0, Math.PI * 2)} listening={false}>
        <Circle radius={radius} fill="#111522" perfectDrawEnabled={false} />
        {image && dimensions ? (
          <KonvaImage
            image={image}
            x={-dimensions.width / 2}
            y={-dimensions.height / 2}
            width={dimensions.width}
            height={dimensions.height}
            listening={false}
            perfectDrawEnabled={false}
          />
        ) : null}
        <Rect
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
          fillLinearGradientStartPoint={{ x: 0, y: -radius }}
          fillLinearGradientEndPoint={{ x: 0, y: radius }}
          fillLinearGradientColorStops={[0, "rgba(5,7,17,0.01)", 0.68, "rgba(5,7,17,0.06)", 1, "rgba(5,7,17,0.66)"]}
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
      <Circle
        radius={radius}
        stroke={color}
        strokeWidth={selected ? 3 : 2.2}
        opacity={0.92}
        listening={false}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />

      {node.type === "saga" ? (
        <Arc
          innerRadius={radius + 6}
          outerRadius={radius + 9}
          angle={Math.max(2, (node.progressPercent || 0) * 3.6)}
          rotation={-90}
          fill={node.progressPercent === 100 ? "#66d59a" : color}
          opacity={0.86}
          listening={false}
          perfectDrawEnabled={false}
        />
      ) : null}

      {node.type === "book" && node.status === "completat" ? (
        <Circle
          x={radius * 0.68}
          y={-radius * 0.68}
          radius={7}
          fill="#66d59a"
          stroke="#08150f"
          strokeWidth={2.5}
          listening={false}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
      ) : null}

      {showLabel ? (
        <Group y={radius + 18} listening={false} perfectDrawEnabled={false}>
          <Rect
            x={-88}
            y={0}
            width={176}
            height={node.type === "saga" ? 51 : 45}
            cornerRadius={12}
            fill="rgba(8,10,20,0.9)"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
          <Text
            x={-78}
            y={8}
            width={156}
            text={node.title}
            align="center"
            fontFamily="Inter, Arial, sans-serif"
            fontSize={13}
            fontStyle="bold"
            fill="#f8f6ff"
            ellipsis
            wrap="none"
            perfectDrawEnabled={false}
          />
          <Text
            x={-78}
            y={27}
            width={156}
            text={node.type === "saga"
              ? `${node.readBooks || 0}/${node.totalBooks || 0} · ${node.progressPercent || 0}%`
              : node.type === "universe"
                ? `${node.universeSagaCount || 0} sagues · ${node.universeBookCount || 0} llibres`
                : getStatusLabel(node.status)}
            align="center"
            fontFamily="Inter, Arial, sans-serif"
            fontSize={10.5}
            fill="#9da8bd"
            ellipsis
            wrap="none"
            perfectDrawEnabled={false}
          />
        </Group>
      ) : null}
    </Group>
  );
}

export default memo(NodeVisual);
