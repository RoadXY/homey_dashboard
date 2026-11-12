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
type WeatherCategory = "clear" | "partly_cloudy" | "cloudy" | "rain" | "thunderstorm" | "snow" | "fog" | "wind" | "unknown";
type WeatherConditionResponse = { retrievedAt: string; category: WeatherCategory; conditionText: string | null; sourceCapability: string | null; reason?: string };
type GeneralSettings = { language: string; dateFormat: string; timeFormat: "24h" | "12h"; firstDayOfWeek: "monday" | "sunday" };
type SystemStatus = { homey: HomeyStatus; homeyLanguage: string | null; service: string; version: string; updatedAt: string; uptimeSeconds: number; memory: { totalBytes: number; freeBytes: number; usedBytes: number }; storage: { totalBytes: number; freeBytes: number } | null; platform: string };

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
  const [weatherCondition, setWeatherCondition] = React.useState<WeatherConditionResponse | null>(null);
  const [loadError, setLoadError] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsUnlocked, setSettingsUnlocked] = React.useState(false);
  const [settingsSession, setSettingsSession] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pinError, setPinError] = React.useState("");
  const holdTimer = React.useRef<number | null>(null);
  const refresh = React.useCallback(async () => {
    void fetch("/api/notifications")
      .then(async (response) => {
        if (!response.ok) throw new Error("Meldingen ophalen mislukt");
        return await response.json() as NotificationsResponse;
      })
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([{ id: "notifications-load-error", title: "Meldingen niet beschikbaar", message: "De meldingsconfiguratie kon niet worden ingelezen.", severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]));
    try {
      const [statusResponse, readingsResponse, logicResponse, weatherResponse] = await Promise.all([
        fetch("/api/homey/status"), fetch("/api/homey/readings"), fetch("/api/homey/logic"),
        fetch("/api/weather").catch(() => null),
      ]);
      if (!statusResponse.ok || !readingsResponse.ok || !logicResponse.ok) throw new Error("Homey-gegevens tijdelijk niet beschikbaar");
      const [statusData, readingsData, logicData] = await Promise.all([
        statusResponse.json() as Promise<HomeyStatus>, readingsResponse.json() as Promise<DeviceReadings>,
        logicResponse.json() as Promise<LogicResponse>,
      ]);
      setHomey(statusData); setReadings(readingsData); setLogic(logicData);
      if (weatherResponse?.ok) {
        setWeatherCondition(await weatherResponse.json() as WeatherConditionResponse);
      } else {
        setWeatherCondition({ retrievedAt: new Date().toISOString(), category: "unknown", conditionText: null, sourceCapability: null, reason: "source_unavailable" });
      }
      setLoadError("");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Gegevens ophalen mislukt"); }
  }, []);
  React.useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void refresh(), 150);
    };

    void refresh();
    const stream = new EventSource("/api/events");
    stream.addEventListener("ready", scheduleRefresh);
    stream.addEventListener("homey-update", scheduleRefresh);
    stream.addEventListener("homey-connected", scheduleRefresh);
    stream.addEventListener("homey-disconnected", scheduleRefresh);

    return () => {
      window.clearInterval(clock);
      window.clearTimeout(refreshTimer);
      stream.removeEventListener("ready", scheduleRefresh);
      stream.removeEventListener("homey-update", scheduleRefresh);
      stream.removeEventListener("homey-connected", scheduleRefresh);
      stream.removeEventListener("homey-disconnected", scheduleRefresh);
      stream.close();
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
  const timeText = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(now);
  const dateText = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(now);
  const homeyOnline = homey?.state === "online";
  const beginSettingsHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => { setSettingsOpen(true); setSettingsUnlocked(false); setPin(""); setPinError(""); }, 850);
  };
  const cancelSettingsHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  if (settingsOpen) return settingsUnlocked
    ? <GeneralSettingsPage session={settingsSession} onBack={() => { setSettingsOpen(false); setSettingsUnlocked(false); setSettingsSession(""); void refresh(); }} />
    : <SettingsPinGate pin={pin} setPin={setPin} error={pinError} onCancel={() => setSettingsOpen(false)} onUnlock={async () => {
        try {
          const response = await fetch("/api/settings/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
          const data = await response.json() as { error?: string; unlocked?: boolean; sessionToken?: string };
          if (!response.ok) throw new Error(data.error || "Toegang geweigerd.");
          setSettingsSession(data.sessionToken ?? ""); setSettingsUnlocked(true); setPinError("");
        } catch (error) { setPinError(error instanceof Error ? error.message : "PIN-controle mislukt."); }
      }} />;
  return (
    <main className="dashboard">
      <section className="left-column" aria-label="Tijd, weer en temperaturen">
        <article className="card clock-card" onPointerDown={beginSettingsHold} onPointerUp={cancelSettingsHold} onPointerLeave={cancelSettingsHold} onContextMenu={(event) => event.preventDefault()} title="Houd ingedrukt voor instellingen">
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
            <WeatherIcon category={weatherCondition?.category ?? "unknown"} />
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
                    <div className="notification-heading"><span className="notification-icon" aria-hidden="true">{item.severity === "critical" ? "!" : item.severity === "warning" ? "⚠" : "i"}</span><span className="notification-level">{item.testOnly ? "TEST · " : ""}{item.severity === "critical" ? "KRITIEK" : item.severity === "warning" ? "WAARSCHUWING" : "INFO"}</span></div>
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </article>
                ))}
              </div>
            ) : notifications.some((item) => item.state === "unknown") ? (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">!</span>
                <strong>Bron niet beschikbaar</strong>
                <span>Een of meer Homey-bronnen ontbreken of kunnen niet betrouwbaar worden uitgelezen. De meldingstatus is onbekend.</span>
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
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}

function SettingsPinGate({ pin, setPin, error, onCancel, onUnlock }: { pin: string; setPin: (value: string) => void; error: string; onCancel: () => void; onUnlock: () => void }) {
  return <main className="settings-gate"><form className="pin-card" onSubmit={(event) => { event.preventDefault(); onUnlock(); }}>
    <div className="settings-brand"><span className="brand-orb" />Homey Dashboard</div>
    <h1>Instellingen beveiligd</h1><p>Voer de instellingen-PIN in om verder te gaan.</p>
    <input autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} aria-label="PIN" />
    {error && <div className="settings-error" role="alert">{error}</div>}
    <div className="settings-actions"><button type="button" className="secondary-button" onClick={onCancel}>Terug naar dashboard</button><button className="primary-button" type="submit">Ontgrendelen</button></div>
  </form></main>;
}

const initialSettings: GeneralSettings = { language: "automatic", dateFormat: "short", timeFormat: "24h", firstDayOfWeek: "monday" };
function homeyLanguageName(language: string): string { const names: Record<string, string> = { nl: "Dutch", en: "English", de: "German", fr: "French", it: "Italian", sv: "Swedish", no: "Norwegian", es: "Spanish", da: "Danish", ru: "Russian", pl: "Polish", ko: "Korean", ar: "Arabic" }; return names[language.toLowerCase().split("-")[0]] ?? "Unsupported language"; }
function GeneralSettingsPage({ onBack, session }: { onBack: () => void; session: string }) {
  const [settings, setSettings] = React.useState<GeneralSettings>(initialSettings);
  const [saved, setSaved] = React.useState<GeneralSettings>(initialSettings);
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [busy, setBusy] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [showLeave, setShowLeave] = React.useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/general", { headers: { "x-settings-session": session } }).then(r => { if (!r.ok) throw new Error("Instellingen laden mislukt"); return r.json() as Promise<GeneralSettings>; }),
      fetch("/api/system/status").then(r => { if (!r.ok) throw new Error("Systeemstatus laden mislukt"); return r.json() as Promise<SystemStatus>; })
    ]).then(([prefs, system]) => {
      if (!active) return;
      setSettings(prefs); setSaved(prefs); setStatus(system);
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Gegevens laden mislukt"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const update = <K extends keyof GeneralSettings,>(key: K, value: GeneralSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  const save = async () => {
    setMessage("");
    try {
      const response = await fetch("/api/settings/general", { method: "POST", headers: { "Content-Type": "application/json", "x-settings-session": session }, body: JSON.stringify(settings) });
      const result = await response.json() as GeneralSettings & { error?: string };
      if (!response.ok) throw new Error(result.error || "Opslaan mislukt.");
      setSettings(result); setSaved(result); setMessage("Instellingen opgeslagen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt."); }
  };
  const leave = () => { if (dirty) setShowLeave(true); else onBack(); };
  const restore = () => { setSettings({ ...initialSettings }); setMessage("Standaardwaarden hersteld. Klik op Save om ze toe te passen."); };
  const uptime = (seconds?: number) => { if (seconds == null) return "—"; const d=Math.floor(seconds/86400), h=Math.floor(seconds%86400/3600), m=Math.floor(seconds%3600/60); return [d ? d+"d" : "", String(h).padStart(2,"0")+"u", String(m).padStart(2,"0")+"m"].filter(Boolean).join(" "); };
  const datePreview = settings.dateFormat === "iso" ? "2025-01-27" : settings.dateFormat === "long" ? "maandag 27 januari 2025" : "27-01-2025";
  const homeyConnected = status?.homey.state === "online";
  return <main className="settings-shell">
    <header className="settings-topbar">
      <div className="settings-brand"><span className="brand-orb" />Homey Dashboard</div><div className="topbar-spacer" /><button className="crumb-button" onClick={leave}>⌂ <span>Dashboard</span></button>
    </header>
    <aside className="settings-sidebar">
      <h2>Settings</h2>
      {["General","Dashboard","Devices","Homey","System"].map((name,index)=><button key={name} className={"settings-nav "+(index===0?"active":"")} disabled={index!==0}><span>{["⚙","▦","♧","◉","▤"][index]}</span>{name}</button>)}
      <div className="sidebar-product">ⓘ<span>Homey Dashboard<br/>v{status?.version ?? "0.1.0"}</span></div>
    </aside>
    <section className="settings-content">
      <div className="settings-title"><p>Basic settings for language, date, time and system information.</p></div>
      <div className="settings-top-cards">
        <section className="settings-card language-card"><h2><span>◎</span>Language</h2>
          <label className="setting-row"><span>Dashboard language</span><select value={settings.language} onChange={e=>update("language",e.target.value)}><option value="automatic">Automatic (Homey language)</option><option value="nl-NL">Dutch</option><option value="en">English</option></select></label>
          <div className="language-info"><div>ℹ <span><strong>Automatic</strong><br/>Uses the Homey language when detection is supported. Otherwise the dashboard falls back to English.</span></div><div>● <span>Detected Homey language: <strong>{status?.homeyLanguage ? `${status.homeyLanguage.toUpperCase()} (${homeyLanguageName(status.homeyLanguage)})` : "Not available — check Homey API permissions"}</strong></span><em>{status?.homeyLanguage ? "Detected" : "Fallback"}</em></div></div>
        </section>
        <section className="settings-card date-card"><h2><span>▢</span>Date and time</h2>
          <label className="setting-row"><span>Date format</span><select value={settings.dateFormat} onChange={e=>update("dateFormat",e.target.value)}><option value="short">DD-MM-YYYY ({datePreview})</option><option value="iso">YYYY-MM-DD ({datePreview})</option><option value="long">Long ({datePreview})</option></select></label>
          <label className="setting-row"><span>Time format</span><select value={settings.timeFormat} onChange={e=>update("timeFormat",e.target.value)}><option value="24h">24-hour (10:24)</option><option value="12h">12-hour (10:24 AM)</option></select></label>
          <label className="setting-row"><span>First day of the week</span><select value={settings.firstDayOfWeek} onChange={e=>update("firstDayOfWeek",e.target.value)}><option value="monday">Monday</option><option value="sunday">Sunday</option></select></label>
        </section>
      </div>
      <section className="settings-card system-card"><h2><span>▤</span>System status</h2>
        <div className="status-table">
          <div className="status-row"><span className={"status-check "+(homeyConnected?"ok":"bad")}>{homeyConnected?"✓":"!"}</span><span>Homey connection</span><strong className={"status-pill "+(homeyConnected?"ok":"bad")}>{homeyConnected?"Connected":status?.homey.state ?? "Unknown"}</strong><span className="status-detail">{status?.platform ?? "Homey Pro 2023"}</span></div>
          <div className="status-row"><span className="status-check ok">✓</span><span>Dashboard service</span><strong className="status-pill ok">Running</strong><span className="status-detail">v{status?.version ?? "—"} (Docker)</span></div>
          <div className="status-row"><span className="status-check ok">✓</span><span>System</span><strong className="status-pill ok">Healthy</strong><span className="status-detail">Uptime: {uptime(status?.uptimeSeconds)}</span></div>
        </div>
      </section>
      <div className="settings-bottom"><span className="save-message" role="status">{busy?"Loading…":message}</span><button className="secondary-button" onClick={restore}>⟳ &nbsp;Restore defaults</button><button className="primary-button" disabled={!dirty || busy} onClick={()=>void save()}>▣ &nbsp;Save</button></div>
    </section>
    {showLeave && <div className="modal-backdrop"><section className="leave-modal"><h2>Unsaved changes</h2><p>Do you want to save your changes before leaving?</p><div><button className="secondary-button" onClick={()=>setShowLeave(false)}>Stay</button><button className="secondary-button" onClick={onBack}>Discard</button><button className="primary-button" onClick={async()=>{await save();setShowLeave(false);onBack();}}>Save</button></div></section></div>}
  </main>;
}

function WeatherIcon({ category }: { category: WeatherCategory }) {
  return (
    <div className={`weather-symbol weather-${category}`} role="img" aria-label={category.replaceAll("_", " ")}>
      {(category === "clear" || category === "partly_cloudy") && <svg className="weather-sun" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="11" />
        <path d="M32 4v8 M32 52v8 M4 32h8 M52 32h8 M12.2 12.2l5.7 5.7 M46.1 46.1l5.7 5.7 M51.8 12.2l-5.7 5.7 M17.9 46.1l-5.7 5.7" />
      </svg>}
      {(category === "cloudy" || category === "partly_cloudy" || category === "rain" || category === "thunderstorm" || category === "snow" || category === "fog") && <svg className="weather-cloud" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M22 49h51a15 15 0 0 0 0-30 22 22 0 0 0-42-3A17 17 0 0 0 22 49Z" />
      </svg>}
      {category === "rain" && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="m30 39-5 12 M49 39l-5 12 M68 39l-5 12" />
      </svg>}
      {category === "thunderstorm" && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="m52 38-12 15h10l-5 10 17-19H52l7-6" />
      </svg>}
      {category === "snow" && <svg className="weather-precipitation snowflakes" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M29 42v13m-5-9 10 5m0-10-10 10 M49 42v13m-5-9 10 5m0-10-10 10 M69 42v13m-5-9 10 5m0-10-10 10" />
      </svg>}
      {category === "fog" && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M17 48h62 M25 56h48" />
      </svg>}
      {category === "wind" && <svg className="weather-cloud" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M12 24h57c12 0 12-15 2-15-5 0-7 3-7 6 M5 37h73c13 0 13 16 2 16-5 0-7-3-7-6" />
      </svg>}
      {category === "unknown" && <span className="weather-unknown-mark">?</span>}
    </div>
  );
}
function TemperatureTile({ label, value }: { label: string; value: string }) {
  return <article className="card temperature-tile"><span className="temperature-label">{label}</span><strong>{value}</strong></article>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
