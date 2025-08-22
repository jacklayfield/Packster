import { CollapsibleDisplay } from "../components/collapsibleDisplay";

export const Report = () => {
  return (
    <div className="flex flex-col items-center min-h-screen pt-48 bg-main bg-gray-200">
      <span className="text-7xl font-medium mb-4">Who owes who what?</span>
      <span className=" font-medium mb-4">(Click to expand)</span>
      <CollapsibleDisplay contents={["Shashank"]} />
      <CollapsibleDisplay contents={["Jack"]} />
      <CollapsibleDisplay contents={["Simon"]} />
      <CollapsibleDisplay contents={["Bob"]} />
    </div>
  );
};
