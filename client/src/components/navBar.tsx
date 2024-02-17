import backpack from "../images/backpack.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
export const NavBar = () => {
  return (
    <>
      <div className="flex top-6 left-6 position-absolute align-items-center">
        <img className="h-16" src={backpack} alt="logo" />{" "}
        <span className="text-4xl font-bold font-mono">Packster</span>
      </div>
      <div className="flex top-8 text-lg font-medium right-8 position-absolute">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const credentialResponseDecoded = jwtDecode(
              credentialResponse.credential ? credentialResponse.credential : ""
            );
            console.log(credentialResponseDecoded);
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      </div>
    </>
  );
};
