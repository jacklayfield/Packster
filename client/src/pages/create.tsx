import tree from "../images/palm_tree.png";
import mountains from "../images/mountains4.png";
export const Create = () => {
  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-7xl -mt-48 text-white pb-6">What we doin?</h1>
        <input
          className="h-20 w-96 pr-6 pl-6 bg-gray-200 text-xl rounded-2xl z-0 focus:shadow focus:outline-none"
          type="text"
          placeholder="Enter event name"
        />
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-5 rounded mt-6">
          Create Group
        </button>
        <div className="flex justify-center position-absolute bottom-2">
          <a className="p-3 text-white font-medium no-underline" href="/#">
            About us
          </a>
          <a className="p-3 text-white font-medium no-underline" href="/#">
            Contact
          </a>
          <a className="p-3 text-white font-medium no-underline" href="/#">
            Privacy
          </a>
        </div>
      </div>
      <img
        className="h-4/6 -z-50 position-absolute bottom-0 right-12"
        src={tree}
        alt="palm"
      />
      <img
        className="h-3/6 -z-50 position-absolute bottom-0"
        src={mountains}
        alt="mtn"
      />
    </>
  );
};
