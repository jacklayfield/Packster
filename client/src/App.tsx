import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import "./App.css";
import { Create } from "./pages/create";
import { NavBar } from "./components/navBar";

function App() {
  return (
    <>
      <NavBar></NavBar>
      <Create></Create>
    </>
  );
}

export default App;
