import { Demo } from "@/components/demo";
import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";

const Homepage = () => (
  <Pump
    queries={[
      {
        homepage: {
          content: {
            json: {
              content: true,
            },
          },
        },
      },
    ]}
  >
    {async ([data]) => {
      "use server";

      return (
        <div className="flex h-screen flex-col items-center justify-center gap-8 bg-black p-12 text-white">
          <RichText>{data.homepage.content?.json.content}</RichText>
          <Demo />
        </div>
      );
    }}
  </Pump>
);

export default Homepage;
