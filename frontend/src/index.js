import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { CounterProvider } from "./providers/counter";
// import ErrorBoundary from "./components/ErrorBoundary";
// import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <CounterProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </CounterProvider>
);
// reportWebVitals();
