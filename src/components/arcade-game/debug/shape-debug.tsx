import { LineSegmentsProps } from "@react-three/fiber";
import { forwardRef } from "react";
import { BoxGeometry, EdgesGeometry, LineSegments } from "three";

const linegeo = new EdgesGeometry(new BoxGeometry(), 15);

export const BoxDebug = forwardRef<LineSegments, LineSegmentsProps>(
  (props, ref) => {
    return (
      <lineSegments geometry={linegeo} ref={ref} {...props}>
        <lineBasicMaterial color="yellow" linewidth={2} />
      </lineSegments>
    );
  }
);
