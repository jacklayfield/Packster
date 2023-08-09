import backpack from "../images/backpack.png";
export const NavBar = () => {
  return (
    <>
      <div className="flex top-6 left-6 position-absolute">
        <img className="h-16" src={backpack} alt="logo" />
      </div>
      <div className="flex top-8 text-lg font-medium right-8 position-absolute">
        Create Account
      </div>
    </>
  );
};
