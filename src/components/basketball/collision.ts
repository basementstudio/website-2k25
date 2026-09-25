import { interactionGroups } from "@react-three/rapier"

// Membership bits: 0 = ball, 1 = net nodes, 2 = static world (hoop, walls,
// sensors). Net nodes only ever touch the ball; statics ignore the net so the
// resting lattice can't trip the score sensor or grind against the hoop
// trimesh. The lamp rope (shared physics world) keeps default groups — the
// net's ball-only filter excludes it.
export const BALL_GROUP = interactionGroups(0)
export const NET_NODE_GROUP = interactionGroups(1, [0])
export const STATIC_GROUP = interactionGroups(2, [0])
