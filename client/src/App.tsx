import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Create } from "./pages/create";
import { NavBar } from "./components/navBar";
import { Group } from "./pages/group";
import { Report } from "./pages/report";
import { Test } from "./pages/test";

export const BASE_URL_API = "http://localhost:7000";
export const BASE_URL_CLIENT = "http://localhost:3000";

export const App = () => {
  return (
    <>
      <NavBar />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/group/:groupid" element={<Group />} />
          <Route path="/report" element={<Report />} />
          <Route path="/test" element={<Test />} />
          {/* <Route path="*" element={<Error />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
};
