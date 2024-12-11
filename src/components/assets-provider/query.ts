import { fragmentOn } from "basehub";

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: {
    file: {
      url: true,
    },
  },
  inspectables: {
    inspectableList: {
      items: {
        _id: true,
        model: {
          file: {
            url: true,
          },
        },
      },
    },
  },
});

interface Query {
  threeDInteractions: typeof assetsFragment;
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment,
};
