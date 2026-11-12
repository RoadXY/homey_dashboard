import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { automaticLanguageLabel, availableLanguages, loadTranslations, resolveLocale, translate } from "./i18n";

type Reading = { capabilityId: string; value: unknown };
type HomeyDevice = { id: string; name?: string; zone?: string; available?: boolean; readings?: Reading[] };
type DeviceReadings = { retrievedAt: string; devices: HomeyDevice[] };
type LogicResponse = { retrievedAt: string; variables: { name: string; value: unknown }[] };
type HomeyStatus = { state: string; checkedAt: string | null; error: string | null; deviceCount?: number; zoneCount?: number };
type DashboardNotification = { id: string; title: string; message: string; severity: "critical" | "warning" | "info"; testOnly: boolean; state: "active" | "inactive" | "unknown"; reason?: string };
type NotificationsResponse = { retrievedAt: string; notifications: DashboardNotification[] };
type WeatherCategory = "sunny" | "mostly_sunny" | "partly_cloudy" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain" | "heavy_rain" | "showers" | "thunderstorm" | "hail" | "snow" | "snow_showers" | "sleet" | "windy" | "unknown";
type WeatherConditionResponse = { retrievedAt: string; category: WeatherCategory; conditionText: string | null; source: "api"; receivedAt?: string; reason?: string };
type GeneralSettings = { language: string; dateFormat: string; timeFormat: "24h" | "12h"; firstDayOfWeek: "monday" | "sunday" };
type WeatherTokenInfo = { id: string; name: string; createdAt: string; lastFour: string };
type QuickAction = { id: string; name: string; icon: string; type: "flow" | "device"; flowId: string; flowType: "standard" | "advanced"; deviceId: string; capabilityId: string; value: boolean | number | string | null };
type QuickActionCapability = { id: string; title: string; type: string; min: number | null; max: number | null; step: number | null; units: string; values: { id: string; title: string }[]; value: unknown };
type QuickActionDevice = { id: string; name: string; zone: string; available: boolean; capabilities: QuickActionCapability[] };
type QuickActionFlow = { id: string; name: string; type: "standard" | "advanced"; enabled: boolean };
type QuickActionCatalog = { devices: QuickActionDevice[]; flows: QuickActionFlow[] };
type SystemStatus = { homey: HomeyStatus; homeyLanguage: string | null; service: string; version: string; updatedAt: string; uptimeSeconds: number; memory: { totalBytes: number; freeBytes: number; usedBytes: number }; storage: { totalBytes: number; freeBytes: number } | null; platform: string };

const actions = [
  { key: "actions.qmusic", icon: "♫" }, { key: "actions.fouteUur", icon: "♫" },
  { key: "actions.blinds", icon: "⌃" }, { key: "actions.birthday", icon: "✦" },
  { key: "actions.livingLights", icon: "◌" }, { key: "actions.moodLights", icon: "✧" },
  { key: "actions.tv", icon: "▣" }, { key: "actions.bedtime", icon: "☾" },
];
function capability(device: HomeyDevice | undefined, id: string): unknown {
  return device?.readings?.find((reading) => reading.capabilityId === id)?.value;
}
function temperature(value: unknown, locale: string = "nl"): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1).replace(".", locale.toLowerCase().startsWith("nl") ? "," : ".")}°` : "—";
}
function App() {
  const [now, setNow] = React.useState(() => new Date());
  const [homey, setHomey] = React.useState<HomeyStatus | null>(null);
  const [dashboardLanguage, setDashboardLanguage] = React.useState("automatic");
  const [homeyLanguage, setHomeyLanguage] = React.useState<string | null>(null);
  const [readings, setReadings] = React.useState<DeviceReadings | null>(null);
  const [logic, setLogic] = React.useState<LogicResponse | null>(null);
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
  const [weatherCondition, setWeatherCondition] = React.useState<WeatherConditionResponse | null>(null);
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [actionError, setActionError] = React.useState("");
  const [executingAction, setExecutingAction] = React.useState("");
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
        if (!response.ok) throw new Error("notifications.loadErrorMessage");
        return await response.json() as NotificationsResponse;
      })
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([{ id: "notifications-load-error", title: translate("en", "notifications.loadErrorTitle"), message: translate("en", "notifications.loadErrorMessage"), severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]));
    void fetch("/api/dashboard/quick-actions").then(r => r.ok ? r.json() : Promise.reject()).then(data => setQuickActions(data.actions as QuickAction[])).catch(() => setQuickActions([]));
    try {
      const [statusResponse, readingsResponse, logicResponse, weatherResponse, languageResponse, systemResponse] = await Promise.all([
        fetch("/api/homey/status"), fetch("/api/homey/readings"), fetch("/api/homey/logic"),
        fetch("/api/weather").catch(() => null), fetch("/api/settings/language").catch(() => null), fetch("/api/system/status").catch(() => null),
      ]);
      if (!statusResponse.ok || !readingsResponse.ok || !logicResponse.ok) throw new Error("Homey-gegevens tijdelijk niet beschikbaar");
      const [statusData, readingsData, logicData] = await Promise.all([
        statusResponse.json() as Promise<HomeyStatus>, readingsResponse.json() as Promise<DeviceReadings>,
        logicResponse.json() as Promise<LogicResponse>,
      ]);
      setHomey(statusData); setReadings(readingsData); setLogic(logicData);
      if (systemResponse?.ok) {
        const system = await systemResponse.json() as { homeyLanguage?: string | null };
        setHomeyLanguage(system.homeyLanguage ?? null);
      }
      if (languageResponse?.ok) {
        const preference = await languageResponse.json() as { language?: string };
        if (typeof preference.language === "string") setDashboardLanguage(preference.language);
      }
      if (weatherResponse?.ok) {
        setWeatherCondition(await weatherResponse.json() as WeatherConditionResponse);
      } else {
        setWeatherCondition({ retrievedAt: new Date().toISOString(), category: "unknown", conditionText: null, source: "api", reason: "source_unavailable" });
      }
      setLoadError("");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "settings.loadDataError"); }
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
  const wind = capability(weather, "measure_wind_combined") ?? capability(weather, "measure_wind_direction_string");
  const homeyOnline = homey?.state === "online";
  const executeAction = async (id: string) => {
    if (executingAction) return;
    setExecutingAction(id); setActionError("");
    try {
      const response = await fetch("/api/homey/quick-actions/" + encodeURIComponent(id) + "/execute", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? t("actions.executeError"));
    } catch (error) { setActionError(error instanceof Error ? error.message : t("actions.executeError")); }
    finally { setExecutingAction(""); }
  };
  const locale = resolveLocale(dashboardLanguage, homeyLanguage);
  const t = (key: string) => translate(locale, key);
  React.useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const timeText = new Intl.DateTimeFormat(locale.toLowerCase().startsWith("nl") ? "nl-NL" : locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(now);
  const dateText = new Intl.DateTimeFormat(locale.toLowerCase().startsWith("nl") ? "nl-NL" : locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(now);
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
    : <SettingsPinGate locale={locale} pin={pin} setPin={setPin} error={pinError} onCancel={() => setSettingsOpen(false)} onUnlock={async () => {
        try {
          const response = await fetch("/api/settings/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
          const data = await response.json() as { error?: string; unlocked?: boolean; sessionToken?: string };
          if (!response.ok) throw new Error(translate(locale, "settings.pinDenied"));
          setSettingsSession(data.sessionToken ?? ""); setSettingsUnlocked(true); setPinError("");
        } catch (error) { setPinError(error instanceof Error ? error.message : translate(locale, "settings.pinError")); }
      }} />;
  return (
    <main className="dashboard">
      <section className="left-column" aria-label={t("dashboard.aria")}>
        <article className="card clock-card" onPointerDown={beginSettingsHold} onPointerUp={cancelSettingsHold} onPointerLeave={cancelSettingsHold} onContextMenu={(event) => event.preventDefault()} title={t("dashboard.holdSettings")}>
          <div className="clock-content">
            <div className="clock">{timeText}</div>
            <div className="date">{dateText}</div>
          </div>
          {(loadError || (homey !== null && !homeyOnline)) && (
            <div className="connection-warning" role="status">
              {loadError ? t("dashboard.serverError") : t("dashboard.homeyError")}
            </div>
          )}
        </article>
        <article className="card weather-card">
          <div className="weather-main">
            <div>
              <div className="eyebrow">OUTSIDE · WEATHER</div>
              <div className="weather-temp">{temperature(capability(weather, "measure_temperature"), locale)}</div>
              <div className="weather-description">{weatherCondition && weatherCondition.category !== "unknown" ? t(`weather.condition.${weatherCondition.category}`) : t("weather.condition.unknown")}</div>
            </div>
            <WeatherIcon category={weatherCondition?.category ?? "unknown"} />
          </div>
          <div className="weather-details">
            <div><span>{t("weather.feelsLike")}</span><strong>{temperature(capability(weather, "measure_temperature_feelslike"), locale)}</strong></div>
            <div><span>{t("weather.wind")}</span><strong>{typeof wind === "string" || typeof wind === "number" ? String(wind) : "—"}</strong></div>
          </div>
        </article>
        <section className="temperature-grid" aria-label="Temperature sensors">
          <TemperatureTile label="Living room" value={temperature(capability(livingRoomSensor, "measure_temperature"), locale)} />
          <TemperatureTile label="Kitchen" value={temperature(logicValue("temperatuur_gemiddeld_keuken"), locale)} />
          <TemperatureTile label="Sem" value={temperature(capability(semSensor, "measure_temperature"), locale)} />
          <TemperatureTile label="Bram" value={temperature(capability(bramSensor, "measure_temperature"), locale)} />
        </section>
      </section>
      <section className="right-column" aria-label={t("notifications.aria")}>
        <div className="actions-grid" aria-label={t("actions.aria")}>
          {actions.map((action, index) => (
            <div className="action-card" key={action.key}>
              <span className="action-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="action-mark" aria-hidden="true">{action.icon}</span>
              <span className="action-label">{t(action.key)}</span>
            </div>
          ))}
        </div>
        {actionError && <div className="action-error" role="alert">{actionError}</div>}
        <section className="notifications-panel" aria-label={t("notifications.aria")}>
          <div className="notifications-heading"><h1>{t("notifications.heading")}</h1></div>
          <div className="notifications-content">
            {notifications.some((item) => item.state === "active") ? (
              <div className="notification-list">
                {notifications.filter((item) => item.state === "active").map((item) => (
                  <article className={`notification-card severity-${item.severity}`} key={item.id}>
                    <div className="notification-heading"><span className="notification-icon" aria-hidden="true">{item.severity === "critical" ? "!" : item.severity === "warning" ? "⚠" : "i"}</span><span className="notification-level">{item.testOnly ? t("notifications.test") : ""}{item.severity === "critical" ? t("notifications.critical") : item.severity === "warning" ? t("notifications.warning") : t("notifications.info")}</span></div>
                    <strong>{translate(locale, `notifications.${item.id}.title`) === `notifications.${item.id}.title` ? item.title : t(`notifications.${item.id}.title`)}</strong>
                    <span>{translate(locale, `notifications.${item.id}.message`) === `notifications.${item.id}.message` ? item.message : t(`notifications.${item.id}.message`)}</span>
                  </article>
                ))}
              </div>
            ) : notifications.some((item) => item.state === "unknown") ? (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">!</span>
                <strong>{t("notifications.unknownTitle")}</strong>
                <span>{t("notifications.unknownMessage")}</span>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">◇</span>
                <strong>{loadError ? t("notifications.unavailableTitle") : t("notifications.noneTitle")}</strong>
                <span>{loadError ? t("notifications.unavailableMessage") : t("notifications.noneMessage")}</span>
              </div>
            )}
          </div>
          <div className="panel-footer">
            <span>HOMEY DASHBOARD</span>
            <span className="panel-meta">
              {homeyOnline ? `${homey?.deviceCount ?? "—"} ${t("footer.devices")} · ${homey?.zoneCount ?? "—"} ${t("footer.rooms")}` : t("footer.homeyOffline")}
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}

function SettingsPinGate({ locale, pin, setPin, error, onCancel, onUnlock }: { locale: string; pin: string; setPin: (value: string) => void; error: string; onCancel: () => void; onUnlock: () => void }) {
  return <main className="settings-gate"><form className="pin-card" onSubmit={(event) => { event.preventDefault(); onUnlock(); }}>
    <div className="settings-brand"><span className="brand-orb" />Homey Dashboard</div>
    <h1>{translate(locale, "settings.lockedTitle")}</h1><p>{translate(locale, "settings.pinPrompt")}</p>
    <input autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} aria-label="PIN" />
    {error && <div className="settings-error" role="alert">{error}</div>}
    <div className="settings-actions"><button type="button" className="secondary-button" onClick={onCancel}>{translate(locale, "settings.back")}</button><button className="primary-button" type="submit">{translate(locale, "settings.unlock")}</button></div>
  </form></main>;
}

const initialSettings: GeneralSettings = { language: "automatic", dateFormat: "short", timeFormat: "24h", firstDayOfWeek: "monday" };
function homeyLanguageName(language: string, locale: string): string { const names: Record<string, [string, string]> = { nl: ["Nederlands", "Dutch"], en: ["Engels", "English"], de: ["Duits", "German"], fr: ["Frans", "French"], it: ["Italiaans", "Italian"], sv: ["Zweeds", "Swedish"], no: ["Noors", "Norwegian"], es: ["Spaans", "Spanish"], da: ["Deens", "Danish"], ru: ["Russisch", "Russian"], pl: ["Pools", "Polish"], ko: ["Koreaans", "Korean"], ar: ["Arabisch", "Arabic"] }; return names[language.toLowerCase().split("-")[0]]?.[locale.toLowerCase().startsWith("nl") ? 0 : 1] ?? language.toUpperCase(); }

const quickActionDefaults: QuickAction[] = [
  { id: "qmusic", name: "", icon: "♫", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "foute-uur", name: "", icon: "♫", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "blinds", name: "", icon: "⌃", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "birthday", name: "", icon: "✦", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "living-lights", name: "", icon: "◌", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "mood-lights", name: "", icon: "✧", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "tv", name: "", icon: "▣", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "bedtime", name: "", icon: "☾", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
];
const quickActionIconChoices = ["♫", "⌃", "✦", "◌", "✧", "▣", "☾", "♧", "⌂", "▤", "⚡", "💡", "🏠", "🚗", "🎬", "🍴", "🛡", "⏻", "•••"];

function QuickActionsSettingsPage({ session, locale, t }: { session: string; locale: string; t: (key: string) => string }) {
  const [items, setItems] = React.useState<QuickAction[]>(quickActionDefaults);
  const [saved, setSaved] = React.useState<QuickAction[]>(quickActionDefaults);
  const [catalog, setCatalog] = React.useState<QuickActionCatalog>({ devices: [], flows: [] });
  const [editingId, setEditingId] = React.useState("qmusic");
  const [editorOpen, setEditorOpen] = React.useState(true);
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const dirty = JSON.stringify(items) !== JSON.stringify(saved);
  const selected = items.find(item => item.id === editingId) ?? items[0];
  const selectedDevice = catalog.devices.find(device => device.id === selected.deviceId);
  const selectedCapability = selectedDevice?.capabilities.find(capability => capability.id === selected.capabilityId);
  const actionName = (item: QuickAction) => item.name.trim() || t(quickActionDefaults.find(entry => entry.id === item.id)?.id === "qmusic" ? "actions.qmusic" : item.id === "foute-uur" ? "actions.fouteUur" : item.id === "blinds" ? "actions.blinds" : item.id === "birthday" ? "actions.birthday" : item.id === "living-lights" ? "actions.livingLights" : item.id === "mood-lights" ? "actions.moodLights" : item.id === "tv" ? "actions.tv" : "actions.bedtime");
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/dashboard-actions", { headers: { "x-settings-session": session } }).then(async response => { if (!response.ok) throw new Error(t("settings.quickActionsLoadError")); return response.json() as Promise<{ actions: QuickAction[] }>; }),
      fetch("/api/settings/quick-action-catalog", { headers: { "x-settings-session": session } }).then(async response => { if (!response.ok) throw new Error(t("settings.quickActionsCatalogError")); return response.json() as Promise<QuickActionCatalog>; }),
    ]).then(([configuration, options]) => {
      if (!active) return;
      setItems(configuration.actions); setSaved(configuration.actions); setCatalog(options);
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : t("settings.quickActionsLoadError")); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const updateSelected = (patch: Partial<QuickAction>) => setItems(current => current.map(item => item.id === selected.id ? { ...item, ...patch } : item));
  const selectDevice = (deviceId: string) => {
    const device = catalog.devices.find(item => item.id === deviceId);
    const capability = device?.capabilities[0];
    const value = capability ? capability.type === "boolean" ? false : capability.type === "number" ? (capability.value as number ?? capability.min ?? 0) : capability.type === "enum" ? capability.values[0]?.id ?? null : "" : null;
    updateSelected({ deviceId, capabilityId: capability?.id ?? "", value });
  };
  const selectCapability = (capabilityId: string) => {
    const capability = selectedDevice?.capabilities.find(item => item.id === capabilityId);
    const value = capability ? capability.type === "boolean" ? false : capability.type === "number" ? (typeof capability.value === "number" ? capability.value : capability.min ?? 0) : capability.type === "enum" ? capability.values[0]?.id ?? null : "" : null;
    updateSelected({ capabilityId, value });
  };
  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/settings/dashboard-actions", { method: "POST", headers: { "Content-Type": "application/json", "x-settings-session": session }, body: JSON.stringify({ actions: items }) });
      const data = await response.json() as { actions?: QuickAction[]; error?: string };
      if (!response.ok || !data.actions) throw new Error(data.error ?? t("settings.saveError"));
      setItems(data.actions); setSaved(data.actions); setMessage(t("settings.quickActionsSaved"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("settings.saveError")); }
    finally { setSaving(false); }
  };
  const formatValue = (value: unknown, units: string) => value === null || value === undefined ? "—" : String(value) + (units ? " " + units : "");
  return <div className="quick-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon">▦</div><div><h1>{t("settings.dashboard")}</h1><p>{t("settings.quickActionsSubtitle")}</p></div></div>
    <div className="quick-tabs"><span>♙ &nbsp;{t("settings.temperatureTiles")}</span><span>☁ &nbsp;{t("settings.weatherTab")}</span><strong>ϟ &nbsp;{t("settings.quickActions")}</strong></div>
    <div className="quick-workspace">
      <section className="settings-card quick-list-card">
        <h2><span>ϟ</span>{t("settings.quickActions")}</h2>
        <p className="quick-card-description">{t("settings.quickActionsDescription")}</p>
        <div className="quick-action-list">
          {items.map((item, index) => <button key={item.id} className={"quick-action-row " + (item.id === editingId ? "selected" : "")} onClick={() => { setEditingId(item.id); setEditorOpen(true); }}>
            <span className="quick-action-number">{index + 1}</span><span className="quick-action-icon">{item.icon}</span><span className="quick-action-name">{actionName(item)}</span><span className="quick-action-edit">✎</span>
          </button>)}
        </div>
        <div className="quick-info">ⓘ <span>{t("settings.quickActionsHint")}</span></div>
      </section>
      <section className="settings-card quick-preview-card">
        <h2><span>◎</span>{t("settings.preview")}</h2>
        <p className="quick-card-description">{t("settings.quickActionsPreviewDescription")}</p>
        <div className="quick-preview-grid">
          {items.map(item => <div className="quick-preview-item" key={item.id}><span>{item.icon}</span><strong>{actionName(item)}</strong></div>)}
        </div>
      </section>
      {editorOpen && <section className="settings-card quick-editor-card">
        <button className="quick-editor-close" onClick={() => setEditorOpen(false)} aria-label={t("settings.close")}>×</button>
        <h2>{t("settings.editQuickAction")}</h2>
        <label>{t("settings.quickActionName")}<input maxLength={40} value={selected.name} onChange={event => updateSelected({ name: event.target.value })} placeholder={actionName({ ...selected, name: "" })} /></label>
        <div className="quick-editor-label">{t("settings.quickActionIcon")}</div>
        <div className="quick-icon-picker">{quickActionIconChoices.map(icon => <button key={icon} className={selected.icon === icon ? "active" : ""} onClick={() => updateSelected({ icon })}>{icon}</button>)}</div>
        <label>{t("settings.actionType")}
          <select value={selected.type} onChange={event => updateSelected({ type: event.target.value as "flow" | "device" })}>
            <option value="flow">{t("settings.flowAction")}</option><option value="device">{t("settings.deviceAction")}</option>
          </select>
        </label>
        {selected.type === "flow" ? <label>{t("settings.homeyFlow")}
          <select value={selected.flowType + ":" + selected.flowId} onChange={event => { const [flowType, ...id] = event.target.value.split(":"); updateSelected({ flowType: flowType as "standard" | "advanced", flowId: id.join(":") }); }}>
            <option value="standard:">{t("settings.selectFlow")}</option>
            {catalog.flows.map(flow => <option key={flow.type + flow.id} value={flow.type + ":" + flow.id}>{flow.name}{flow.type === "advanced" ? " · Advanced" : ""}</option>)}
          </select>
        </label> : <>
          <label>{t("settings.device")}<select value={selected.deviceId} onChange={event => selectDevice(event.target.value)}><option value="">{t("settings.selectDevice")}</option>{catalog.devices.map(device => <option key={device.id} value={device.id}>{device.name}{device.zone ? " · " + device.zone : ""}</option>)}</select></label>
          <label>{t("settings.deviceActionLabel")}<select value={selected.capabilityId} onChange={event => selectCapability(event.target.value)} disabled={!selectedDevice}><option value="">{t("settings.selectDeviceAction")}</option>{selectedDevice?.capabilities.map(capability => <option key={capability.id} value={capability.id}>{capability.title}</option>)}</select></label>
          {selectedCapability?.type === "boolean" && <label>{t("settings.actionValue")}<select value={String(selected.value ?? false)} onChange={event => updateSelected({ value: event.target.value === "true" })}><option value="true">{t("settings.turnOn")}</option><option value="false">{t("settings.turnOff")}</option></select></label>}
          {selectedCapability?.type === "number" && <label>{t("settings.actionValue")}<div className="quick-range-row"><input type="range" min={selectedCapability.min ?? 0} max={selectedCapability.max ?? 100} step={selectedCapability.step ?? 1} value={typeof selected.value === "number" ? selected.value : selectedCapability.min ?? 0} onChange={event => updateSelected({ value: Number(event.target.value) })}/><strong>{formatValue(selected.value, selectedCapability.units)}</strong></div></label>}
          {selectedCapability?.type === "enum" && <label>{t("settings.actionValue")}<select value={String(selected.value ?? "")} onChange={event => updateSelected({ value: event.target.value })}>{selectedCapability.values.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>}
          {selectedCapability?.type === "string" && <label>{t("settings.actionValue")}<input value={String(selected.value ?? "")} onChange={event => updateSelected({ value: event.target.value })}/></label>}
          {selectedDevice && !selectedDevice.available && <p className="quick-warning">{t("settings.deviceUnavailable")}</p>}
        </>}
        <div className="quick-editor-actions"><button className="secondary-button" onClick={() => { const original = saved.find(item => item.id === selected.id); if (original) setItems(current => current.map(item => item.id === selected.id ? original : item)); setEditorOpen(false); }}>{t("settings.cancel")}</button><button className="primary-button" onClick={() => setEditorOpen(false)}>{t("settings.apply")}</button></div>
      </section>}
    </div>
    <div className="settings-bottom"><span className="save-message" role="status">{busy ? t("settings.loading") : message}</span><button className="primary-button" disabled={!dirty || saving || busy} onClick={() => void save()}>▣ &nbsp;{t("settings.save")}</button></div>
  </div>;
}

function GeneralSettingsPage({ onBack, session }: { onBack: () => void; session: string }) {
  const [page, setPage] = React.useState<"general" | "dashboard">("general");
  const [settings, setSettings] = React.useState<GeneralSettings>(initialSettings);
  const [saved, setSaved] = React.useState<GeneralSettings>(initialSettings);
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [busy, setBusy] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [showLeave, setShowLeave] = React.useState(false);
  const [weatherTokens, setWeatherTokens] = React.useState<WeatherTokenInfo[]>([]);
  const [tokenName, setTokenName] = React.useState("");
  const [newToken, setNewToken] = React.useState("");
  const [tokenBusy, setTokenBusy] = React.useState(false);
  const [tokenMessage, setTokenMessage] = React.useState("");
  const [tokenCopyStatus, setTokenCopyStatus] = React.useState<"success" | "error" | "">("");
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const locale = resolveLocale(settings.language, status?.homeyLanguage);
  const t = (key: string) => translate(locale, key);
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/general", { headers: { "x-settings-session": session } }).then(r => { if (!r.ok) throw new Error("settings.loadError"); return r.json() as Promise<GeneralSettings>; }),
      fetch("/api/system/status").then(r => { if (!r.ok) throw new Error("settings.statusError"); return r.json() as Promise<SystemStatus>; })
    ]).then(([prefs, system]) => {
      if (!active) return;
      setSettings(prefs); setSaved(prefs); setStatus(system);
    }).catch(error => { if (active) setMessage(error instanceof Error ? translate(locale, error.message) : translate(locale, "settings.loadDataError")); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const loadWeatherTokens = async () => {
    const response = await fetch("/api/settings/weather-tokens", { headers: { "x-settings-session": session } });
    if (!response.ok) throw new Error(t("settings.tokensLoadError"));
    const data = await response.json() as { tokens: WeatherTokenInfo[] };
    setWeatherTokens(data.tokens);
  };
  React.useEffect(() => { void loadWeatherTokens().catch(error => setTokenMessage(error instanceof Error ? error.message : t("settings.tokensLoadError"))); }, []);
  const createToken = async () => {
    setTokenBusy(true); setTokenMessage(""); setTokenCopyStatus(""); setNewToken("");
    try {
      const response = await fetch("/api/settings/weather-tokens", { method: "POST", headers: { "Content-Type": "application/json", "x-settings-session": session }, body: JSON.stringify({ name: tokenName }) });
      const data = await response.json() as { token?: string; info?: WeatherTokenInfo; error?: string };
      if (!response.ok || !data.token || !data.info) throw new Error(data.error ?? t("settings.tokenCreateError"));
      setNewToken(data.token); setTokenName(""); setWeatherTokens(current => [...current, data.info!]);
      setTokenMessage(t("settings.tokenCreated"));
    } catch (error) { setTokenMessage(error instanceof Error ? error.message : t("settings.tokenCreateError")); }
    finally { setTokenBusy(false); }
  };
  const copyWeatherToken = async () => {
    if (!newToken) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(newToken);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setTokenCopyStatus("success");
    } catch {
      // Clipboard API is unavailable on plain HTTP LAN origins. Use the legacy
      // selection-based copy command as a fallback for trusted local networks.
      try {
        const field = document.createElement("textarea");
        field.value = newToken;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        field.style.pointerEvents = "none";
        document.body.appendChild(field);
        field.focus();
        field.select();
        field.setSelectionRange(0, field.value.length);
        const copied = document.execCommand("copy");
        document.body.removeChild(field);
        if (!copied) throw new Error("Copy command failed");
        setTokenMessage(t("settings.tokenCopySuccess"));
      } catch {
        setTokenCopyStatus("error");
      }
    }
  };
  const revokeToken = async (id: string) => {
    if (!window.confirm(t("settings.tokenRevokeConfirm"))) return;
    setTokenBusy(true); setTokenMessage(""); setNewToken("");
    try {
      const response = await fetch("/api/settings/weather-tokens/" + encodeURIComponent(id), { method: "DELETE", headers: { "x-settings-session": session } });
      if (!response.ok) throw new Error(t("settings.tokenRevokeError"));
      setWeatherTokens(current => current.filter(token => token.id !== id)); setTokenMessage(t("settings.tokenRevoked"));
    } catch (error) { setTokenMessage(error instanceof Error ? error.message : t("settings.tokenRevokeError")); }
    finally { setTokenBusy(false); }
  };
  const update = <K extends keyof GeneralSettings,>(key: K, value: GeneralSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  const save = async () => {
    setMessage("");
    try {
      const response = await fetch("/api/settings/general", { method: "POST", headers: { "Content-Type": "application/json", "x-settings-session": session }, body: JSON.stringify(settings) });
      const result = await response.json() as GeneralSettings & { error?: string };
      if (!response.ok) throw new Error(translate(locale, "settings.saveError"));
      setSettings(result); setSaved(result); setMessage(translate(locale, "settings.saved"));
    } catch (error) { setMessage(error instanceof Error ? error.message : translate(locale, "settings.saveError")); }
  };
  const leave = () => { if (dirty) setShowLeave(true); else onBack(); };
  const uptime = (seconds?: number) => { if (seconds == null) return "—"; const d=Math.floor(seconds/86400), h=Math.floor(seconds%86400/3600), m=Math.floor(seconds%3600/60); return [d ? d+"d" : "", String(h).padStart(2,"0")+(locale.toLowerCase().startsWith("nl") ? "u" : "h"), String(m).padStart(2,"0")+"m"].filter(Boolean).join(" "); };
  const datePreview = settings.dateFormat === "iso" ? "2025-01-27" : settings.dateFormat === "long" ? (locale === "en" ? "Monday 27 January 2025" : "maandag 27 januari 2025") : "27-01-2025";
  const homeyConnected = status?.homey.state === "online";
  const languageName = (code: string) => availableLanguages.find(language => language.homeyCodes.some(homeyCode => homeyCode.toLowerCase() === code.toLowerCase()))?.label ?? homeyLanguageName(code, locale);
  return <main className="settings-shell">
    <header className="settings-topbar">
      <div className="settings-brand"><span className="brand-orb" />Homey Dashboard</div><div className="topbar-spacer" /><button className="crumb-button" onClick={leave}>⌂ <span> {t("settings.dashboard")}</span></button>
    </header>
    <aside className="settings-sidebar">
      <h2>{t("settings.navTitle")}</h2>
      {[t("settings.general"),t("settings.dashboard"),t("settings.devices"),t("settings.homey"),t("settings.system")].map((name,index)=><button key={name} className={"settings-nav "+((page==="general"&&index===0)||(page==="dashboard"&&index===1)?"active":"")} disabled={index>1} onClick={()=>setPage(index===1?"dashboard":"general")}><span>{["⚙","▦","♧","◉","▤"][index]}</span>{name}</button>)}
      <div className="sidebar-product">ⓘ<span>Homey Dashboard<br/>v{status?.version ?? "0.1.0"}</span></div>
    </aside>
    <section className="settings-content">
      {page === "general" ? <>
      <div className="settings-title"><p>{t("settings.subtitle")}</p></div>
      <div className="settings-top-cards">
        <section className="settings-card language-card"><h2><span>◎</span>{t("settings.language")}</h2>
          <label className="setting-row"><span>{t("settings.dashboardLanguage")}</span><select value={settings.language} onChange={e=>update("language",e.target.value)}><option value="automatic">{automaticLanguageLabel}</option>{availableLanguages.map(language => <option key={language.id} value={language.id}>{language.label}</option>)}</select></label>
          <div className="language-info"><div>ℹ <span><strong>{t("settings.automatic")}</strong><br/>{t("settings.autoDescription")}</span></div><div>● <span>{t("settings.detectedHomey")} <strong>{status?.homeyLanguage ? `${status.homeyLanguage.toUpperCase()} (${languageName(status.homeyLanguage)})` : t("settings.notAvailable")}</strong></span><em>{status?.homeyLanguage ? t("settings.detected") : t("settings.fallback")}</em></div></div>
        </section>
        <section className="settings-card date-card"><h2><span>◷</span>{t("settings.dateTime")}</h2>
          <label className="setting-row"><span>{t("settings.dateFormat")}</span><select value={settings.dateFormat} onChange={e=>update("dateFormat",e.target.value)}><option value="short">{t("settings.shortDate")} ({datePreview})</option><option value="iso">{t("settings.isoDate")} ({datePreview})</option><option value="long">{t("settings.longDate")} ({datePreview})</option></select></label>
          <label className="setting-row"><span>{t("settings.timeFormat")}</span><select value={settings.timeFormat} onChange={e=>update("timeFormat",e.target.value)}><option value="24h">{t("settings.24hour")}</option><option value="12h">{t("settings.12hour")}</option></select></label>
          <label className="setting-row"><span>{t("settings.firstDay")}</span><select value={settings.firstDayOfWeek} onChange={e=>update("firstDayOfWeek",e.target.value)}><option value="monday">{t("settings.monday")}</option><option value="sunday">{t("settings.sunday")}</option></select></label>
        </section>
      </div>
      <section className="settings-card system-card weather-token-card">
        <h2><span>⌑</span>{t("settings.weatherTokens")}</h2>
        <p>{t("settings.weatherTokensDescription")}</p>
        <div className="setting-row token-create-row">
          <label htmlFor="weather-token-name">{t("settings.tokenName")}</label>
          <input id="weather-token-name" value={tokenName} maxLength={60} onChange={event => setTokenName(event.target.value)} placeholder={t("settings.tokenNamePlaceholder")} />
          <button className="primary-button" disabled={tokenBusy || !tokenName.trim()} onClick={() => void createToken()}>{t("settings.tokenCreate")}</button>
        </div>
        {newToken && <div className="token-secret-panel"><strong>{t("settings.tokenShowOnce")}</strong><p>{t("settings.tokenCopyWarning")}</p><code>{newToken}</code><div className="token-copy-actions"><button className="secondary-button" onClick={() => void copyWeatherToken()}>{t("settings.tokenCopy")}</button>{tokenCopyStatus && <span className={"token-copy-feedback " + tokenCopyStatus} role="status" aria-live="polite">{tokenCopyStatus === "success" ? t("settings.tokenCopySuccess") : t("settings.tokenCopyError")}</span>}</div></div>}
        <div className="token-list">
          {weatherTokens.length === 0 ? <p>{t("settings.tokensEmpty")}</p> : weatherTokens.map(token => <div className="token-list-row" key={token.id}><div><strong>{token.name}</strong><small>•••• {token.lastFour} · {new Date(token.createdAt).toLocaleString(locale)}</small></div><button className="secondary-button" disabled={tokenBusy} onClick={() => void revokeToken(token.id)}>{t("settings.tokenRevoke")}</button></div>)}
        </div>
        <p className="save-message" role="status">{tokenMessage}</p>
      </section>
      <section className="settings-card system-card"><h2><span>▤</span>{t("settings.systemStatus")}</h2>
        <div className="status-table">
          <div className="status-row"><span className={"status-check "+(homeyConnected?"ok":"bad")}>{homeyConnected?"✓":"!"}</span><span>{t("settings.homeyConnection")}</span><strong className={"status-pill "+(homeyConnected?"ok":"bad")}>{homeyConnected?t("settings.connected"):status?.homey.state === "offline" ? t("homey.offline") : status?.homey.state === "connecting" ? t("homey.connecting") : status?.homey.state === "not-connected" ? t("homey.notConnected") : t("homey.unknown")}</strong><span className="status-detail">{status?.platform ?? "Homey Pro 2023"}</span></div>
          <div className="status-row"><span className="status-check ok">✓</span><span>{t("settings.dashboardService")}</span><strong className="status-pill ok">{t("settings.running")}</strong><span className="status-detail">v{status?.version ?? "—"} (Docker)</span></div>
          <div className="status-row"><span className="status-check ok">✓</span><span>{t("settings.system")}</span><strong className="status-pill ok">{t("settings.healthy")}</strong><span className="status-detail">{t("settings.uptime")} {uptime(status?.uptimeSeconds)}</span></div>
        </div>
      </section>
      <div className="settings-bottom"><span className="save-message" role="status">{busy?t("settings.loading"):message}</span><button className="primary-button" disabled={!dirty || busy} onClick={()=>void save()}>▣ &nbsp;{t("settings.save")}</button></div>
      </> : <QuickActionsSettingsPage session={session} locale={locale} t={t} />}
    </section>
    {showLeave && <div className="modal-backdrop"><section className="leave-modal"><h2>{t("settings.unsavedTitle")}</h2><p>{t("settings.unsavedPrompt")}</p><div><button className="secondary-button" onClick={()=>setShowLeave(false)}>{t("settings.stay")}</button><button className="secondary-button" onClick={onBack}>{t("settings.discard")}</button><button className="primary-button" onClick={async()=>{await save();setShowLeave(false);onBack();}}>{t("settings.save")}</button></div></section></div>}
  </main>;
}

function WeatherIcon({ category }: { category: WeatherCategory }) {
  return (
    <div className={`weather-symbol weather-${category}`} role="img" aria-label={category.replaceAll("_", " ")}>
      {(["sunny", "mostly_sunny", "partly_cloudy"].includes(category)) && <svg className="weather-sun" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="11" />
        <path d="M32 4v8 M32 52v8 M4 32h8 M52 32h8 M12.2 12.2l5.7 5.7 M46.1 46.1l5.7 5.7 M51.8 12.2l-5.7 5.7 M17.9 46.1l-5.7 5.7" />
      </svg>}
      {(["mostly_sunny", "partly_cloudy", "cloudy", "overcast", "drizzle", "rain", "heavy_rain", "showers", "thunderstorm", "hail", "snow", "snow_showers", "sleet", "fog", "windy"].includes(category)) && <svg className="weather-cloud" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M22 49h51a15 15 0 0 0 0-30 22 22 0 0 0-42-3A17 17 0 0 0 22 49Z" />
      </svg>}
      {(["drizzle", "rain", "heavy_rain", "showers"].includes(category)) && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="m30 39-5 12 M49 39l-5 12 M68 39l-5 12" />
      </svg>}
      {category === "thunderstorm" && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="m52 38-12 15h10l-5 10 17-19H52l7-6" />
      </svg>}
      {(["snow", "snow_showers", "sleet", "hail"].includes(category)) && <svg className="weather-precipitation snowflakes" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M29 42v13m-5-9 10 5m0-10-10 10 M49 42v13m-5-9 10 5m0-10-10 10 M69 42v13m-5-9 10 5m0-10-10 10" />
      </svg>}
      {category === "fog" && <svg className="weather-precipitation" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M17 48h62 M25 56h48" />
      </svg>}
      {category === "windy" && <svg className="weather-cloud" viewBox="0 0 96 64" aria-hidden="true">
        <path d="M12 24h57c12 0 12-15 2-15-5 0-7 3-7 6 M5 37h73c13 0 13 16 2 16-5 0-7-3-7-6" />
      </svg>}
      {category === "unknown" && <span className="weather-unknown-mark">?</span>}
    </div>
  );
}
function TemperatureTile({ label, value }: { label: string; value: string }) {
  return <article className="card temperature-tile"><span className="temperature-label">{label}</span><strong>{value}</strong></article>;
}
void loadTranslations().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
});
