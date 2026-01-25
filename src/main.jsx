import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./pages/App";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}>
          <Route index element={<App/>}></Route>
          <Route path='profile' element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
