import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import "./index.css";

const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const CreateProfile = React.lazy(() => import("./pages/CreateProfile/CreateProfile"));
const Settings = React.lazy(() => import("./pages/Settings/Settings"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Suspense fallback={<div className="loader" />}><Dashboard /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<div className="loader" />}><CreateProfile /></Suspense>} />
          <Route path="setting" element={<Suspense fallback={<div className="loader" />}><Settings /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

