import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

type Reading = { capabilityId: string; value: unknown };
type HomeyDevice = {
  id: string;
  name?: string;
  zone?: string;
  available?: boolean;
  readings?: Reading[];
};
type DeviceReadings = { retrievedAt: string; devices: HomeyDevice[] };
type LogicResponse = { retrievedAt: string; variables: { name: string; value: unknown }[] };
type HomeyStatus = { state: string; checkedAt: string | null; error: string | null };

const actions = [
  "Q-Music",
  "Q-Music Foute Uur",
  "Rolluiken openen",
  "Verjaardagmodus",
  "Woonkamerverlichting uit",
  "Sfeerverlichting",
  "TV-modus",
  "Bedtijd",
];

function capability(device: HomeyDevice | undefined, id: string): unknown {
  return device?.readings?.find((reading) => reading.capabilityId === id)?.value;
}

function temperature(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1).replace(".", ",")}°` : "—";
}

function App() {
  const [now, setNow] = React.useState(() => new Date());
  const [homey, setHomey] = React.useState<HomeyStatus | null>(null);
  const [readings, setReadings] = React.useState<DeviceReadings | null>(null);
  const [logic, setLogic] = React.useState<LogicResponse | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [loadError, setLoadError] = React.useState("");

  const refresh = React.useCallback(async () => {
    try {
      const [statusResponse, readingsResponse, logicResponse] = await Promise.all([
        fetch("/api/homey/status"),
        fetch("/api/homey/readings"),
        fetch("/api/homey/logic"),
      ]);
      if (!statusResponse.ok || !readingsResponse.ok || !logicResponse.ok) {
        throw new Error("Homey-gegevens tijdelijk niet beschikbaar");
      }
      const [statusData, readingsData, logicData] = await Promise.all([
        statusResponse.json() as Promise<HomeyStatus>,
        readingsResponse.json() as Promise<DeviceReadings>,
        logicResponse.json() as Promise<LogicResponse>,
      ]);
      setHomey(statusData);
      setReadings(readingsData);
      setLogic(logicData);
      setLastUpdated(new Date());
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gegevens ophalen mislukt");
    }
  }, []);

  React.useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    void refresh();
    const dataRefresh = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(dataRefresh);
    };
  }, [refresh]);

  const devices = readings?.devices ?? [];
  const findDevice = (part: string) => devices.find((device) => device.name?.toLowerCase().includes(part.toLowerCase()));
  const livingRoomSensor = findDevice("multisensor woonkamer");
  const semSensor = findDevice("temperatuur sem");
  const bramSensor = findDevice("temperatuur bram");
  const weather = findDevice("weer");
  const logicValue = (name: string) => logic?.variables.find((item) => item.name === name)?.value;
  const weatherText = capability(weather, "conditioncode_text") ?? capability(weather, "description");
  const wind = capability(weather, "measure_wind_combined") ?? capability(weather, "measure_wind_direction_string");
  const outsideTemp = capability(weather, "measure_temperature");
  const feelsLike = capability(weather, "measure_temperature_feelslike");

  const dateText = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam",
  }).format(now);
  const timeText = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
  }).format(now);
  const homeyOnline = homey?.state === "online";

  return (
    <main className="dashboard">
      <section className="left-column">
        <article className="card clock-card">
          <div className="clock-top">
            <span className="eyebrow">HOMEY PRO 2023</span>
            <span className={`connection ${homeyOnline ? "online" : "offline"}`}><i />{homeyOnline ? "Verbonden" : homey?.state === "offline" ? "Niet bereikbaar" : "Verbinden…"}</span>
          </div>
          <div className="clock">{timeText}</div>
          <div className="date">{dateText}</div>
          <div className="clock-bottom"><span>Thuis</span><span className="server-dot" /> Dashboard actief</div>
        </article>

        <article className="card weather-card">
          <div className="weather-main">
            <div>
              <div className="eyebrow">BUITEN · WEER</div>
              <div className="weather-temp">{temperature(outsideTemp)}</div>
              <div className="weather-description">{typeof weatherText === "string" ? weatherText : "Weergegevens laden…"}</div>
            </div>
            <div className="weather-symbol" aria-hidden="true">☁</div>
          </div>
          <div className="weather-details">
            <div><span>Gevoel</span><strong>{temperature(feelsLike)}</strong></div>
            <div><span>Wind</span><strong>{typeof wind === "string" || typeof wind === "number" ? String(wind) : "—"}</strong></div>
          </div>
        </article>

        <section className="temperature-grid" aria-label="Temperaturen in huis">
          <TemperatureTile label="Woonkamer" value={temperature(capability(livingRoomSensor, "measure_temperature"))} />
          <TemperatureTile label="Keuken" value={temperature(logicValue("temperatuur_gemiddeld_keuken"))} />
          <TemperatureTile label="Sem" value={temperature(capability(semSensor, "measure_temperature"))} />
          <TemperatureTile label="Bram" value={temperature(capability(bramSensor, "measure_temperature"))} />
        </section>
        <div className="updated">Laatste update {lastUpdated ? new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastUpdated) : "—"}</div>
      </section>

      <section className="right-column">
        <div className="actions-grid" aria-label="Snelle acties">
          {actions.map((action, index) => (
            <div className="action-card" key={action}>
              <span className="action-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="action-mark" aria-hidden="true">{["♫", "♫", "⌃", "✦", "◌", "✧", "▣", "☾"][index]}</span>
              <span className="action-label">{action}</span>
              <span className="action-state">Binnenkort</span>
            </div>
          ))}
        </div>
        <div className="right-heading">
          <span className="eyebrow">THUISOVERZICHT</span>
          <span className="muted">Homey Pro 2023</span>
        </div>
        <article className="card overview-card">
          <div className="overview-intro">
            <div>
              <h1>Alles in huis.</h1>
              <p>Je woning in één oogopslag.</p>
            </div>
            <div className="homey-orb" aria-hidden="true"><span /></div>
          </div>
          <div className="overview-stats">
            <div><span>Apparaten</span><strong>{homey?.state === "online" ? "128" : "—"}</strong></div>
            <div><span>Ruimtes</span><strong>{homey?.state === "online" ? "22" : "—"}</strong></div>
            <div><span>Gegevens</span><strong>{loadError ? "Onderbroken" : readings ? "Actueel" : "Laden…"}</strong></div>
          </div>
          {loadError && <p className="load-error">{loadError}</p>}
        </article>
        <div className="right-footer">
          <span>HOMEY DASHBOARD</span>
          <span>Automatisch bijgewerkt · elke 30 seconden</span>
        </div>
      </section>
    </main>
  );
}

function TemperatureTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="card temperature-tile">
      <span className="temperature-label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
