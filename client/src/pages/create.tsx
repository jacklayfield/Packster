import tree from "../images/palm_tree.png";
import mountains from "../images/mountains4.png";
export const Create = () => {
  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen create-page">
        <h1 className="text-7xl -mt-48 text-white pb-6 drop-shadow-lg">
          What we doin?
        </h1>
        <input
          className="h-20 w-96 pr-6 pl-6 mb-6 bg-gray-200 drop-shadow-lg text-2xl rounded-3xl z-0 focus:shadow focus:outline-none"
          type="text"
          placeholder="Enter event/trip name"
        />
        <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-4 rounded">
          Create Group
        </button>
        <div className="flex justify-center position-absolute bottom-2">
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            About us
          </a>
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            Contact
          </a>
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            Privacy
          </a>
        </div>
      </div>
      <img
        className="h-4/6 z-0 position-absolute bottom-0 right-12"
        src={tree}
        alt="palm"
      />
      <img
        className="h-3/6 z-0 position-absolute bottom-0"
        src={mountains}
        alt="mtn"
      />
    </>
  );
};
