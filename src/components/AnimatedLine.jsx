import { Line } from "react-konva";
import { useEffect, useRef } from "react";
import Konva from "konva";

function AnimatedLine({ points, style }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const node = ref.current;

    const anim = new Konva.Animation((frame) => {
      // moviment lent i elegant
      node.dashOffset(-(frame.time * 0.04));
    }, node.getLayer());

    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Line
      ref={ref}
      points={points}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      opacity={style.opacity}
      dash={style.dash}
      shadowColor={style.shadowColor}
      shadowBlur={8}
      shadowOpacity={0.6}
      listening={false}
      lineCap="round"
      lineJoin="round"
    />
  );
}

export default AnimatedLine;
