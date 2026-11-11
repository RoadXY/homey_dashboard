import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

type Reading = { capabilityId: string; value: unknown };
type HomeyDevice = { id: string; name?: string; zone?: string; available?: boolean; readings?: Reading[] };
type DeviceReadings = { retrievedAt: string; devices: HomeyDevice[] };
type LogicResponse = { retrievedAt: string; variables: { name: string; value: unknown }[] };
type HomeyStatus = { state: string; checkedAt: string | null; error: string | null; deviceCount?: number; zoneCount?: number };
type DashboardNotification = { id: string; title: string; message: string; severity: "critical" | "warning" | "info"; testOnly: boolean; state: "active" | "inactive" | "unknown"; reason?: string };
type NotificationsResponse = { retrievedAt: string; notifications: DashboardNotification[] };

const actions = [
  { name: "Q-Music", icon: "♫" }, { name: "Q-Music Foute Uur", icon: "♫" },
  { name: "Rolluiken openen", icon: "⌃" }, { name: "Verjaardagmodus", icon: "✦" },
  { name: "Woonkamerverlichting uit", icon: "◌" }, { name: "Sfeerverlichting", icon: "✧" },
  { name: "TV-modus", icon: "▣" }, { name: "Bedtijd", icon: "☾" },
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
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [loadError, setLoadError] = React.useState("");
  const refresh = React.useCallback(async () => {
    void fetch("/api/notifications")
      .then(async (response) => {
        if (!response.ok) throw new Error("Meldingen ophalen mislukt");
        return await response.json() as NotificationsResponse;
      })
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([{ id: "notifications-load-error", title: "Meldingen niet beschikbaar", message: "De meldingsconfiguratie kon niet worden ingelezen.", severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]));
    try {
      const [statusResponse, readingsResponse, logicResponse] = await Promise.all([
        fetch("/api/homey/status"), fetch("/api/homey/readings"), fetch("/api/homey/logic"),
      ]);
      if (!statusResponse.ok || !readingsResponse.ok || !logicResponse.ok) throw new Error("Homey-gegevens tijdelijk niet beschikbaar");
      const [statusData, readingsData, logicData] = await Promise.all([
        statusResponse.json() as Promise<HomeyStatus>, readingsResponse.json() as Promise<DeviceReadings>,
        logicResponse.json() as Promise<LogicResponse>,
      ]);
      setHomey(statusData); setReadings(readingsData); setLogic(logicData);
      setLastUpdated(new Date()); setLoadError("");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Gegevens ophalen mislukt"); }
  }, []);
  React.useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    void refresh();
    const dataRefresh = window.setInterval(() => void refresh(), 30_000);
    return () => { window.clearInterval(clock); window.clearInterval(dataRefresh); };
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
  const timeText = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(now);
  const dateText = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(now);
  const updateText = lastUpdated ? new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastUpdated) : "—";
  const homeyOnline = homey?.state === "online";
  return (
    <main className="dashboard">
      <section className="left-column" aria-label="Tijd, weer en temperaturen">
        <article className="card clock-card">
          <div className="clock-content">
            <div className="clock">{timeText}</div>
            <div className="date">{dateText}</div>
          </div>
          {(loadError || (homey !== null && !homeyOnline)) && (
            <div className="connection-warning" role="status">
              {loadError ? "Verbinding met de dashboardserver mislukt" : "Verbinding met Homey Pro mislukt"}
            </div>
          )}
        </article>
        <article className="card weather-card">
          <div className="weather-main">
            <div>
              <div className="eyebrow">BUITEN · WEER</div>
              <div className="weather-temp">{temperature(capability(weather, "measure_temperature"))}</div>
              <div className="weather-description">{typeof weatherText === "string" ? weatherText : "Weergegevens laden…"}</div>
            </div>
            <div className="weather-symbol" aria-hidden="true">☁</div>
          </div>
          <div className="weather-details">
            <div><span>Gevoel</span><strong>{temperature(capability(weather, "measure_temperature_feelslike"))}</strong></div>
            <div><span>Wind</span><strong>{typeof wind === "string" || typeof wind === "number" ? String(wind) : "—"}</strong></div>
          </div>
        </article>
        <section className="temperature-grid" aria-label="Temperaturen in huis">
          <TemperatureTile label="Woonkamer" value={temperature(capability(livingRoomSensor, "measure_temperature"))} />
          <TemperatureTile label="Keuken" value={temperature(logicValue("temperatuur_gemiddeld_keuken"))} />
          <TemperatureTile label="Sem" value={temperature(capability(semSensor, "measure_temperature"))} />
          <TemperatureTile label="Bram" value={temperature(capability(bramSensor, "measure_temperature"))} />
        </section>
      </section>
      <section className="right-column" aria-label="Acties en meldingen">
        <div className="actions-grid" aria-label="Snelle acties">
          {actions.map((action, index) => (
            <div className="action-card" key={action.name}>
              <span className="action-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="action-mark" aria-hidden="true">{action.icon}</span>
              <span className="action-label">{action.name}</span>
            </div>
          ))}
        </div>
        <section className="notifications-panel" aria-label="Meldingen">
          <div className="notifications-heading"><h1>Meldingen</h1></div>
          <div className="notifications-content">
            {notifications.some((item) => item.state === "active") ? (
              <div className="notification-list">
                {notifications.filter((item) => item.state === "active").map((item) => (
                  <article className={`notification-card severity-${item.severity}`} key={item.id}>
                    <span className="notification-level">{item.testOnly ? "TEST · " : ""}{item.severity === "critical" ? "KRITIEK" : item.severity === "warning" ? "WAARSCHUWING" : "INFO"}</span>
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </article>
                ))}
              </div>
            ) : notifications.some((item) => item.state === "unknown") ? (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">!</span>
                <strong>Bron niet beschikbaar</strong>
                <span>De testvariabele ontbreekt of kan niet betrouwbaar worden uitgelezen. De meldingstatus is onbekend.</span>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">◇</span>
                <strong>{loadError ? "Gegevens tijdelijk niet beschikbaar" : "Geen actieve meldingen"}</strong>
                <span>{loadError || "Alle dashboardmeldingen zijn momenteel inactief."}</span>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <span>HOMEY DASHBOARD</span>
            <span className="panel-meta">
              {homeyOnline ? `${homey?.deviceCount ?? "—"} apparaten · ${homey?.zoneCount ?? "—"} ruimtes` : "Homey niet verbonden"}
              <span className="meta-separator"> · </span>Update {updateText} · elke 30 sec.
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}
function TemperatureTile({ label, value }: { label: string; value: string }) {
  return <article className="card temperature-tile"><span className="temperature-label">{label}</span><strong>{value}</strong></article>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
