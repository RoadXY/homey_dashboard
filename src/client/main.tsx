import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  const [apiStatus, setApiStatus] = React.useState("Controleren…");

  React.useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("API niet bereikbaar");
        return response.json();
      })
      .then((data: { status: string }) => setApiStatus(data.status === "ok" ? "Backend online" : "Onbekend"))
      .catch(() => setApiStatus("Backend niet bereikbaar"));
  }, []);

  return (
    <main className="shell">
      <header className="topline">
        <span className="eyebrow">HOMEY DASHBOARD</span>
        <span className="status"><i /> {apiStatus}</span>
      </header>
      <section className="welcome">
        <p className="eyebrow">FASE 1A · BASIS</p>
        <h1>De basis staat.</h1>
        <p className="intro">De dashboardomgeving is gestart. De volgende stap is de verbinding met Homey Pro 2023 en daarna de eerste echte dashboardcomponenten.</p>
      </section>
      <footer>Homey Pro 2023 · Verbinding nog niet geconfigureerd</footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
