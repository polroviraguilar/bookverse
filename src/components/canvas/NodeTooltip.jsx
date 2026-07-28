import { Group, Rect, Text } from "react-konva";
import { getNodeRadius, getStatusLabel } from "./nodeUtils.js";

export default function NodeTooltip({ node }) {
  const radius = getNodeRadius(node.type);
  const subtitle = node.type === "saga"
    ? `${node.readBooks || 0} de ${node.totalBooks || 0} llibres · ${node.sagaRatingAvg || "—"}/5`
    : node.type === "universe"
      ? `${node.universeSagaCount || 0} sagues · ${node.universeBookCount || 0} llibres`
      : `${node.author || "Autor desconegut"} · ${getStatusLabel(node.status)}`;

  return (
    <Group y={-radius - 82} listening={false}>
      <Rect x={-118} y={0} width={236} height={58} cornerRadius={14} fill="rgba(12,14,26,0.96)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} shadowColor="#000" shadowBlur={22} shadowOpacity={0.55} />
      <Text x={-104} y={11} width={208} text={node.title} align="center" fontFamily="Inter, Arial, sans-serif" fontSize={13} fontStyle="bold" fill="#fff" ellipsis wrap="none" />
      <Text x={-104} y={34} width={208} text={subtitle} align="center" fontFamily="Inter, Arial, sans-serif" fontSize={10.5} fill="#aeb7c9" ellipsis wrap="none" />
    </Group>
  );
}
