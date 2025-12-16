import { Group, Rect, Text } from "react-konva";

function NodeTooltip({ node, offsetY = -80 }) {
  let subtitle = "";

  if (node.type === "universe") {
    subtitle = "Univers narratiu";
  } else if (node.type === "saga") {
    subtitle = `${node.readBooks || 0}/${node.totalBooks || 0} llibres · ${node.progressPercent || 0}%`;
  } else {
    subtitle = `Vol. ${node.volume || "—"} · ${node.status}`;
  }

  return (
    <Group y={offsetY}>
      <Rect
        x={-90}
        y={-40}
        width={180}
        height={50}
        cornerRadius={10}
        fill="rgba(15,23,42,0.95)"
        shadowBlur={12}
      />
      <Text
        text={node.title}
        x={-80}
        y={-34}
        width={160}
        fontSize={14}
        fill="#f8fafc"
        fontStyle="bold"
        align="center"
      />
      <Text
        text={subtitle}
        x={-80}
        y={-16}
        width={160}
        fontSize={11}
        fill="#cbd5e1"
        align="center"
      />
    </Group>
  );
}

export default NodeTooltip;
