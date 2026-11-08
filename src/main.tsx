import React from "react";
import ReactDOM from "react-dom/client";
const App = React.lazy(() => import("./App"));
const SampleRequestPage = React.lazy(() => import("./SampleRequestPage"));
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<p style={{ padding: "2rem" }}>Loading HLN…</p>}>
      {window.location.pathname.replace(/\/$/, "") === "/request-sample" ? <SampleRequestPage /> : <App />}
    </React.Suspense>
  </React.StrictMode>,
);
