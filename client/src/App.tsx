import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Create } from "./pages/create";
import { NavBar } from "./components/navBar";
import { Group } from "./pages/group/group";
import { Report } from "./pages/report";
import { Test } from "./pages/test";

function App() {
  return (
    <>
      <NavBar />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/group" element={<Group />} />
          <Route path="/report" element={<Report />} />
          <Route path="/test" element={<Test />} />
          {/* <Route path="*" element={<Error />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
