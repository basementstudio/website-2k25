import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three/examples/jsm/Addons.js";

export const customKTX2Loader = (url: string) => {
  const gl = useThree((state) => state.gl);
  const model = useGLTF(url, undefined, undefined, (loader) => {
      const ktx2loader = new KTX2Loader();
      ktx2loader.setTranscoderPath(
        "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets/basis/",
      );
      ktx2loader.detectSupport(gl);
      // @ts-ignore
      loader.setKTX2Loader(ktx2loader);
    });
  
  return model;
};
    