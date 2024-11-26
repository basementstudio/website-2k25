import { Demo } from "@/components/demo";
import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";

const Homepage = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-8 bg-black p-12 text-white">
    <Demo />
  </div>
);

export default Homepage;
