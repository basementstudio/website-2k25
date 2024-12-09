"use client";

import { useAssets } from "../assets-provider";

import { Inspectable } from "./inspectable";

const HARDCODED_INSPECTABLES_POSITIONS = [
  { x: 2, y: 2.82, z: -11.6 },
  { x: 2, y: 4.3, z: -11.6 },
  { x: 2, y: 4, z: -12.3 },
  { x: 2, y: 5.15, z: -13 },
];

export const Inspectables = () => {
  const { inspectables } = useAssets();

  return (
    <>
      {inspectables.map((url, index) => (
        <Inspectable
          key={index}
          inspectable={{
            url,
            position: HARDCODED_INSPECTABLES_POSITIONS[index],
            id: index.toString(),
          }}
        />
      ))}
    </>
  );
};
