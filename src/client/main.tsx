import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import * as BlocklyLibrary from "blockly/core";
import "blockly/blocks";
import "@mdi/font/css/materialdesignicons.css";
import mdiMeta from "@mdi/svg/meta.json";
import { automaticLanguageLabel, availableLanguages, loadTranslations, resolveLocale, translate } from "./i18n";
import { combineRootConditions, comparisonValueFromBlockly, durationNodeFromBlockly, durationNodeToBlockly, sourceFromKey as resolveNotificationSourceFromKey, sourceKeyFromNode } from "./notification-condition-blockly";

type Reading = { capabilityId: string; value: unknown };
type HomeyDevice = { id: string; name?: string; zone?: string; available?: boolean; readings?: Reading[] };
type DeviceReadings = { retrievedAt: string; devices: HomeyDevice[] };
type LogicResponse = { retrievedAt: string; variables: { name: string; value: unknown }[] };
type HomeyStatus = { state: string; checkedAt: string | null; error: string | null; deviceCount?: number; zoneCount?: number };
type DashboardNotification = { id: string; title: string; message: string; severity: "critical" | "warning" | "info"; testOnly: boolean; state: "active" | "inactive" | "unknown"; reason?: string };
type NotificationsResponse = { retrievedAt: string; notifications: DashboardNotification[]; nextEvaluationAt?: number };
type WeatherCategory = "sunny" | "mostly_sunny" | "partly_cloudy" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain" | "heavy_rain" | "showers" | "thunderstorm" | "hail" | "snow" | "snow_showers" | "sleet" | "windy" | "unknown";
type WeatherConditionResponse = { retrievedAt: string; category: WeatherCategory; conditionText: string | null; source: "api"; receivedAt?: string; reason?: string };
type GeneralSettings = { language: string; dateFormat: string; timeFormat: "24h" | "12h"; firstDayOfWeek: "monday" | "sunday" };
type NotificationConfigEditor = { schemaVersion: 1; id: string; title: string; message: string; severity: "critical" | "warning" | "info"; enabled: boolean; testOnly?: boolean; condition: any };
type ScheduleEditorValue = { type: "schedule"; configured: false; weekdays: [] } | { type: "schedule"; weekdays: number[]; startTime: string; endTime: string; timeZone?: string };
type NotificationSourceCatalog = { retrievedAt: string; zones: { id: string; name: string; parent: string | null }[]; devices: { id: string; name: string; zone: string | null; available: boolean; capabilities: { id: string; title: string; type: "number" | "boolean"; units: string }[] }[]; variables: { id: string; name: string; type: "number" | "boolean" }[] };
type WeatherTokenInfo = { id: string; name: string; createdAt: string; lastFour: string };
type MeasurementTileSource = { type: "device"; deviceId: string; capabilityId: string } | { type: "logic"; variableId: string } | null;
type MeasurementTile = { id: string; name: string; icon: string; source: MeasurementTileSource };
type MeasurementSourceCatalog = { zones: { id: string; name: string; parent: string | null }[]; devices: { id: string; name: string; zone: string | null; available: boolean; capabilities: { id: string; title: string; units: string; decimals: number | null }[] }[]; variables: { id: string; name: string; type: "number" }[] };
type MeasurementTileValue = { id: string; value: number | null; units: string; decimals: number | null; available: boolean };
type MeasurementTileResponse = { tiles: MeasurementTile[]; values: MeasurementTileValue[] };
function formatMeasurementValue(reading: MeasurementTileValue | undefined, locale: string = "nl"): string {
  if (!reading?.available || typeof reading.value !== "number" || !Number.isFinite(reading.value)) return "—";
  const number = reading.value.toFixed(reading.decimals ?? 1);
  const localized = locale.toLowerCase().startsWith("nl") ? number.replace(".", ",") : number;
  return localized + (reading.units ? " " + reading.units : "");
}
type QuickAction = { id: string; name: string; icon: string; type: "flow" | "device"; flowId: string; flowType: "standard" | "advanced"; deviceId: string; capabilityId: string; value: boolean | number | string | null; booleanMode: "on" | "off" | "toggle" };
type QuickActionCapability = { id: string; title: string; type: string; min: number | null; max: number | null; step: number | null; units: string; values: { id: string; title: string }[]; value: unknown };
type QuickActionDevice = { id: string; name: string; zone: string; available: boolean; capabilities: QuickActionCapability[] };
type QuickActionFlow = { id: string; name: string; type: "standard" | "advanced"; enabled: boolean; icon?: string };
type QuickActionCatalog = { devices: QuickActionDevice[]; flows: QuickActionFlow[]; warnings?: string[] };
type SystemStatus = { homey: HomeyStatus; homeyLanguage: string | null; service: string; version: string; updatedAt: string; uptimeSeconds: number; memory: { totalBytes: number; freeBytes: number; usedBytes: number }; storage: { totalBytes: number; freeBytes: number } | null; platform: string };

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
  const [measurementTileData, setMeasurementTileData] = React.useState<MeasurementTileResponse | null>(null);
  const [quickActionStatuses, setQuickActionStatuses] = React.useState<Record<string, boolean | null>>({});
  const [actionError, setActionError] = React.useState("");
  const [executingAction, setExecutingAction] = React.useState("");
  const [loadError, setLoadError] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(() => window.location.pathname.startsWith("/settings"));
  const [settingsPath, setSettingsPath] = React.useState(() => window.location.pathname);
  const [settingsUnlocked, setSettingsUnlocked] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [pinError, setPinError] = React.useState("");
  const settingsIdleTimer = React.useRef<number | null>(null);
  const lastSessionRefresh = React.useRef(0);
  const holdTimer = React.useRef<number | null>(null);
  const notificationRefreshTimer = React.useRef<number | null>(null);
  const scheduleNotificationRefreshRef = React.useRef<(data: NotificationsResponse) => void>(() => {});
  const scheduleNotificationRefresh = React.useCallback((data: NotificationsResponse) => {
    if (notificationRefreshTimer.current !== null) window.clearTimeout(notificationRefreshTimer.current);
    notificationRefreshTimer.current = null;
    if (typeof data.nextEvaluationAt !== "number" || !Number.isFinite(data.nextEvaluationAt)) return;
    const delay = Math.min(2_147_483_647, Math.max(0, data.nextEvaluationAt - Date.now() + 25));
    notificationRefreshTimer.current = window.setTimeout(() => {
      void fetch("/api/notifications")
        .then(async (response) => {
          if (!response.ok) throw new Error("notifications.loadErrorMessage");
          return await response.json() as NotificationsResponse;
        })
        .then((nextData) => {
          setNotifications(nextData.notifications);
          scheduleNotificationRefreshRef.current(nextData);
        })
        .catch(() => {
          setNotifications([{ id: "notifications-load-error", title: translate("en", "notifications.loadErrorTitle"), message: translate("en", "notifications.loadErrorMessage"), severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]);
        });
    }, delay);
  }, []);
  scheduleNotificationRefreshRef.current = scheduleNotificationRefresh;
  const refresh = React.useCallback(async () => {
    void fetch("/api/notifications")
      .then(async (response) => {
        if (!response.ok) throw new Error("notifications.loadErrorMessage");
        return await response.json() as NotificationsResponse;
      })
      .then((data) => {
        setNotifications(data.notifications);
        scheduleNotificationRefresh(data);
      })
      .catch(() => {
        if (notificationRefreshTimer.current !== null) window.clearTimeout(notificationRefreshTimer.current);
        notificationRefreshTimer.current = null;
        setNotifications([{ id: "notifications-load-error", title: translate("en", "notifications.loadErrorTitle"), message: translate("en", "notifications.loadErrorMessage"), severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]);
      });
    void fetch("/api/dashboard/quick-actions").then(r => r.ok ? r.json() : Promise.reject()).then(data => setQuickActions((data.actions as QuickAction[]).map(action => ({ ...action, icon: normalizeQuickActionIcon(action.icon) })))).catch(() => setQuickActions([]));
    void fetch("/api/dashboard/quick-action-status").then(r => r.ok ? r.json() : Promise.reject()).then(data => setQuickActionStatuses(data.statuses as Record<string, boolean | null> )).catch(() => undefined);
    void fetch("/api/dashboard/measurement-tiles").then(r => r.ok ? r.json() as Promise<MeasurementTileResponse> : Promise.reject()).then(setMeasurementTileData).catch(() => undefined);
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
  }, [scheduleNotificationRefresh]);
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
    stream.addEventListener("settings-updated", scheduleRefresh);

    return () => {
      window.clearInterval(clock);
      window.clearTimeout(refreshTimer);
      if (notificationRefreshTimer.current !== null) window.clearTimeout(notificationRefreshTimer.current);
      notificationRefreshTimer.current = null;
      stream.removeEventListener("ready", scheduleRefresh);
      stream.removeEventListener("homey-update", scheduleRefresh);
      stream.removeEventListener("homey-connected", scheduleRefresh);
      stream.removeEventListener("homey-disconnected", scheduleRefresh);
      stream.removeEventListener("settings-updated", scheduleRefresh);
      stream.close();
    };
  }, [refresh]);
  const devices = readings?.devices ?? [];
  const findDevice = (part: string) => devices.find((device) => device.name?.toLowerCase().includes(part.toLowerCase()));
  const weather = findDevice("weer");
  const logicValue = (name: string) => logic?.variables.find((item) => item.name === name)?.value;
  const wind = capability(weather, "measure_wind_combined") ?? capability(weather, "measure_wind_direction_string");
  const homeyOnline = homey?.state === "online";
  const refreshQuickActionStatuses = async () => {
    try { const response = await fetch("/api/dashboard/quick-action-status"); if (!response.ok) throw new Error("Status ophalen mislukt"); const data = await response.json() as { statuses: Record<string, boolean | null> }; setQuickActionStatuses(data.statuses); } catch { /* Keep the last known Homey state when a poll temporarily fails. */ }
  };
  const executeAction = async (id: string) => {
    if (executingAction) return;
    setExecutingAction(id); setActionError("");
    try {
      const response = await fetch("/api/homey/quick-actions/" + encodeURIComponent(id) + "/execute", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? t("actions.executeError"));
      await refreshQuickActionStatuses();
    } catch (error) { setActionError(error instanceof Error ? error.message : t("actions.executeError")); }
    finally { setExecutingAction(""); }
  };
  React.useEffect(() => {
    if (settingsOpen) return;
    const poll = () => { void fetch("/api/dashboard/measurement-tiles").then(r => r.ok ? r.json() as Promise<MeasurementTileResponse> : Promise.reject()).then(setMeasurementTileData).catch(() => undefined); };
    const timer = window.setInterval(poll, 5000);
    return () => window.clearInterval(timer);
  }, [settingsOpen]);
  React.useEffect(() => {
    if (settingsOpen || !quickActions.some(action => action.type === "device" && action.capabilityId)) return;
    const timer = window.setInterval(() => void refreshQuickActionStatuses(), 5000);
    return () => window.clearInterval(timer);
  }, [settingsOpen, quickActions]);
  const locale = resolveLocale(dashboardLanguage, homeyLanguage);
  const t = (key: string) => translate(locale, key);
  React.useEffect(() => {
    const syncRoute = () => {
      const legacyRoutes: Record<string, string> = {
        "/settings/dashboard": "/settings/quick-actions",
        "/settings/dashboard/quick-actions": "/settings/quick-actions",
        "/settings/dashboard/measurement-tiles": "/settings/measurement-tiles",
        "/settings/devices": "/settings/general",
        "/settings/homey": "/settings/general",
        "/settings/system": "/settings/general",
      };
      const currentPath = window.location.pathname;
      const canonicalPath = legacyRoutes[currentPath] ?? currentPath;
      if (canonicalPath !== currentPath) window.history.replaceState({}, "", canonicalPath);
      const isSettingsRoute = canonicalPath.startsWith("/settings");
      setSettingsOpen(isSettingsRoute);
      setSettingsPath(canonicalPath);
      if (!isSettingsRoute) { void fetch("/api/settings/logout", { method: "POST" }); setSettingsUnlocked(false); return; }
      void fetch("/api/settings/session").then(response => {
        if (response.ok) { setSettingsUnlocked(true); setPin(""); setPinError(""); lastSessionRefresh.current = 0; }
        else { setSettingsUnlocked(false);  }
      }).catch(() => { setSettingsUnlocked(false); });
    };
    window.addEventListener("popstate", syncRoute);
    if (settingsOpen) syncRoute();
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);
  React.useEffect(() => {
    if (!settingsOpen || !settingsUnlocked) return;
    const expireSettings = () => {
      if (settingsIdleTimer.current !== null) window.clearTimeout(settingsIdleTimer.current);
      settingsIdleTimer.current = null;
      void fetch("/api/settings/logout", { method: "POST" });
      window.history.replaceState({}, "", "/");
      setSettingsPath("/"); setSettingsOpen(false); setSettingsUnlocked(false);
      void refresh();
    };
    const scheduleExpiry = () => {
      if (settingsIdleTimer.current !== null) window.clearTimeout(settingsIdleTimer.current);
      settingsIdleTimer.current = window.setTimeout(expireSettings, 30 * 60 * 1000);
    };
    const onActivity = () => {
      scheduleExpiry();
      const now = Date.now();
      if (now - lastSessionRefresh.current >= 60 * 1000) {
        lastSessionRefresh.current = now;
        void fetch("/api/settings/session/refresh", { method: "POST", headers: { "x-settings-activity": "1" } }).then(response => {
          if (response.status === 401) expireSettings();
        }).catch(() => undefined);
      }
    };
    const events: Array<keyof DocumentEventMap> = ["pointerdown", "touchstart", "keydown", "scroll", "wheel"];
    events.forEach(event => document.addEventListener(event, onActivity, { passive: true }));
    scheduleExpiry();
    return () => {
      events.forEach(event => document.removeEventListener(event, onActivity));
      if (settingsIdleTimer.current !== null) window.clearTimeout(settingsIdleTimer.current);
      settingsIdleTimer.current = null;
    };
  }, [settingsOpen, settingsUnlocked, refresh]);
  React.useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const timeText = new Intl.DateTimeFormat(locale.toLowerCase().startsWith("nl") ? "nl-NL" : locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(now);
  const dateText = new Intl.DateTimeFormat(locale.toLowerCase().startsWith("nl") ? "nl-NL" : locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(now);
  const beginSettingsHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => { window.history.pushState({}, "", "/settings/general"); setSettingsPath("/settings/general"); setSettingsOpen(true); setSettingsUnlocked(false); setPin(""); setPinError(""); }, 850);
  };
  const cancelSettingsHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  if (settingsOpen) return settingsUnlocked
    ? <GeneralSettingsPage onNavigate={path => { window.history.pushState({}, "", path); setSettingsPath(path); }} onBack={() => { void fetch("/api/settings/logout", { method: "POST" }); window.history.pushState({}, "", "/"); setSettingsPath("/"); setSettingsOpen(false); setSettingsUnlocked(false); void refresh(); }} initialPage={settingsPath === "/settings/quick-actions" ? "quick-actions" : settingsPath === "/settings/measurement-tiles" ? "measurement-tiles" : settingsPath.startsWith("/settings/notifications") ? "notifications" : settingsPath.startsWith("/settings/weather") ? "weather" : "general"} />
    : <SettingsPinGate locale={locale} pin={pin} setPin={setPin} error={pinError} onCancel={() => { window.history.replaceState({}, "", "/"); setSettingsPath("/"); setSettingsOpen(false); }} onUnlock={async () => {
        try {
          const response = await fetch("/api/settings/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
          if (!response.ok) throw new Error(translate(locale, "settings.pinDenied"));
          setSettingsUnlocked(true); setPinError("");
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
          {(measurementTileData?.tiles ?? []).map(tile => {
            const reading = measurementTileData?.values.find(value => value.id === tile.id);
            return <TemperatureTile key={tile.id} label={tile.name} icon={tile.icon || "thermometer"} value={formatMeasurementValue(reading, locale)} />;
          })}
        </section>
      </section>
      <section className="right-column" aria-label={t("notifications.aria")}>
        <div className="actions-grid" aria-label={t("actions.aria")}>
          {quickActions.map((action) => {
            const label = action.name.trim();
            return (
              <button className={"action-card" + (action.type === "device" && quickActionStatuses[action.id] === true ? " is-active" : "")} key={action.id} type="button"
                onClick={() => void executeAction(action.id)} disabled={Boolean(executingAction)}
                aria-label={label} title={label}>
                <MdiIcon name={action.icon} className="action-mark" />
                <span className="action-label">{label}</span>
              </button>
            );
          })}
        </div>
        {actionError && <div className="action-error" role="alert">{actionError}</div>}
        <section className="notifications-panel" aria-label={t("notifications.aria")}>
          <div className="notifications-heading"><h1>{t("notifications.heading")}</h1>{(notifications.some((item) => item.state === "active") || notifications.some((item) => item.state === "unknown") || Boolean(loadError)) && <span className={"notification-status-indicator" + (notifications.some((item) => item.state === "unknown") || Boolean(loadError) ? " is-unknown" : "")} role="img" aria-label={notifications.some((item) => item.state === "active") ? t("notifications.activeIndicator") : t("notifications.unknownIndicator")} title={notifications.some((item) => item.state === "active") ? t("notifications.activeIndicator") : t("notifications.unknownIndicator")}>!</span>}</div>
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
        </section>
      </section>
    </main>
  );
}

function SettingsPinGate({ locale, pin, setPin, error, onCancel, onUnlock }: { locale: string; pin: string; setPin: (value: string) => void; error: string; onCancel: () => void; onUnlock: () => void }) {
  return <main className="settings-gate"><form className="pin-card" onSubmit={(event) => { event.preventDefault(); onUnlock(); }}>
    <div className="settings-brand"><span className="brand-orb" /><span>Homey Dashboard</span></div>
    <h1>{translate(locale, "settings.lockedTitle")}</h1><p>{translate(locale, "settings.pinPrompt")}</p>
    <input autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} aria-label="PIN" />
    {error && <div className="settings-error" role="alert">{error}</div>}
    <div className="settings-actions"><button type="button" className="secondary-button" onClick={onCancel}>{translate(locale, "settings.back")}</button><button className="primary-button" type="submit">{translate(locale, "settings.unlock")}</button></div>
  </form></main>;
}

const initialSettings: GeneralSettings = { language: "automatic", dateFormat: "short", timeFormat: "24h", firstDayOfWeek: "monday" };
function homeyLanguageName(language: string, locale: string): string { const names: Record<string, [string, string]> = { nl: ["Nederlands", "Dutch"], en: ["Engels", "English"], de: ["Duits", "German"], fr: ["Frans", "French"], it: ["Italiaans", "Italian"], sv: ["Zweeds", "Swedish"], no: ["Noors", "Norwegian"], es: ["Spaans", "Spanish"], da: ["Deens", "Danish"], ru: ["Russisch", "Russian"], pl: ["Pools", "Polish"], ko: ["Koreaans", "Korean"], ar: ["Arabisch", "Arabic"] }; return names[language.toLowerCase().split("-")[0]]?.[locale.toLowerCase().startsWith("nl") ? 0 : 1] ?? language.toUpperCase(); }

const quickActionDefaults: QuickAction[] = [
  { id: "qmusic", name: "", icon: "music-note", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "foute-uur", name: "", icon: "music-note", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "blinds", name: "", icon: "blinds", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "birthday", name: "", icon: "party-popper", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "living-lights", name: "", icon: "lightbulb", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "mood-lights", name: "", icon: "star-four-points", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "tv", name: "", icon: "television", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
  { id: "bedtime", name: "", icon: "moon-waning-crescent", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null, booleanMode: "off" },
];
type MdiIconMeta = { name: string; aliases?: string[] };
type MdiIconChoice = { name: string; keywords: string[] };
const dutchMdiSearchTerms: Record<string, string[]> = {
  music: ["muziek", "audio", "song", "foute uur"],
  blinds: ["jaloezie", "rolluik", "zonwering", "raam"],
  "window-shutter": ["rolluik", "zonwering", "raam"],
  "party-popper": ["feest", "verjaardag", "party"],
  lightbulb: ["lamp", "licht", "verlichting"],
  "lightbulb-on": ["lamp aan", "licht aan"],
  "lightbulb-group": ["lampen", "groep", "verlichting"],
  "led-strip": ["led", "sfeer", "strip"],
  "star-four-points": ["ster", "sfeer", "glitter"],
  television: ["tv", "televisie", "media"],
  "moon-waning-crescent": ["maan", "nacht", "bedtijd", "slapen"],
  "weather-sunny": ["zon", "zonnig", "weer"],
  "weather-night": ["nacht", "avond"],
  home: ["huis", "thuis", "woning"],
  car: ["auto", "vervoer", "voertuig"],
  "movie-open": ["film", "bioscoop", "video"],
  "silverware-fork-knife": ["eten", "bestek", "keuken"],
  "shield-outline": ["beveiliging", "alarm", "schild"],
  power: ["aan", "uit", "stroom", "schakelaar"],
  flash: ["bliksem", "energie", "stroom"],
  coffee: ["koffie", "drinken"],
  "robot-vacuum": ["stofzuiger", "schoonmaken"],
  water: ["water", "kraan", "bewateren"],
  flower: ["bloem", "plant", "tuin"],
  sprout: ["plant", "groei", "tuin"],
  tree: ["boom", "tuin", "buiten"],
  lock: ["slot", "deur", "beveiliging"],
  door: ["deur", "toegang"],
  garage: ["garage", "poort"],
  thermometer: ["temperatuur", "warmte", "koud"],
  "air-conditioner": ["airco", "koeling", "klimaat"],
  fan: ["ventilator", "lucht"],
  lamp: ["lamp", "licht"],
  "ceiling-light": ["plafondlamp", "licht"],
  curtains: ["gordijnen", "raam"],
  "window-closed": ["raam dicht", "raam"],
  "window-open": ["raam open", "raam"],
  fire: ["vuur", "haard", "warmte"],
  "smoke-detector": ["rookmelder", "brand", "veiligheid"]
};
const mdiMetadataIcons = mdiMeta as MdiIconMeta[];
const mdiIconByName = new Map(mdiMetadataIcons.map(icon => [icon.name, icon]));
const featuredMdiIconNames = [
  "music-note", "blinds", "window-shutter", "party-popper", "lightbulb", "lightbulb-on",
  "lightbulb-group", "led-strip", "star-four-points", "television", "moon-waning-crescent",
  "weather-sunny", "weather-night", "home", "car", "movie-open", "silverware-fork-knife",
  "shield-outline", "power", "flash", "coffee", "speaker", "volume-high", "bell", "alarm",
  "calendar", "robot", "robot-vacuum", "water", "flower", "sprout", "tree", "lock", "door",
  "garage", "thermometer", "air-conditioner", "fan", "lamp", "ceiling-light", "play", "pause",
  "stop", "skip-next", "volume-mute", "wifi", "curtains", "window-closed", "window-open",
  "fire", "smoke-detector", "dots-horizontal"
];
const quickActionIconChoices: MdiIconChoice[] = [
  ...featuredMdiIconNames,
  ...mdiMetadataIcons.map(icon => icon.name).filter(name => !featuredMdiIconNames.includes(name))
].flatMap(name => {
  const icon = mdiIconByName.get(name);
  return icon ? [{ name, keywords: [name, ...(Array.isArray(icon.aliases) ? icon.aliases : []), ...(dutchMdiSearchTerms[name] ?? [])] }] : [];
});
function MdiIcon({ name, className = "" }: { name: string; className?: string }) {
  const iconName = name.startsWith("mdi:") ? name.slice(4) : name;
  return <span className={`mdi mdi-${iconName} ${className}`.trim()} aria-hidden="true" />;
}
function normalizeQuickActionIcon(icon: string): string {
  const name = icon.startsWith("mdi:") ? icon.slice(4) : icon;
  return mdiIconByName.has(name) ? name : "lightning-bolt";
}



function MeasurementTilesSettingsPage({ t, onNavigate }: { t: (key: string) => string; onNavigate: (path: string) => void }) {
  const [tiles, setTiles] = React.useState<MeasurementTile[]>([]);
  const [saved, setSaved] = React.useState<MeasurementTile[]>([]);
  const [catalog, setCatalog] = React.useState<MeasurementSourceCatalog>({ zones: [], devices: [], variables: [] });
  const [selectedId, setSelectedId] = React.useState("measurement-1");
  const [zoneId, setZoneId] = React.useState("");
  const [deviceId, setDeviceId] = React.useState("");
  const [sourceType, setSourceType] = React.useState<"device" | "logic">("device");
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isError, setIsError] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<MeasurementTileResponse | null>(null);
  const [iconSearch, setIconSearch] = React.useState("");
  const iconQuery = iconSearch.trim().toLocaleLowerCase();
  const matchingIcons = quickActionIconChoices.filter(icon => !iconQuery || (icon.name + " " + icon.keywords.join(" ")).toLocaleLowerCase().includes(iconQuery));
  const visibleIcons = matchingIcons.slice(0, 120);
  const dirty = JSON.stringify(tiles) !== JSON.stringify(saved);
  const selected = tiles.find(tile => tile.id === selectedId) ?? tiles[0];
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/measurement-tiles").then(async r => { if (!r.ok) throw new Error("Meetwaardetegels konden niet worden geladen."); return r.json() as Promise<{ tiles: MeasurementTile[] }>; }),
      fetch("/api/settings/measurement-sources").then(async r => { if (!r.ok) throw new Error("Meetwaardebronnen konden niet worden geladen."); return r.json() as Promise<MeasurementSourceCatalog>; }),
    ]).then(([config, sources]) => { if (!active) return; setTiles(config.tiles); setSaved(config.tiles); setCatalog(sources); })
      .catch(error => { if (active) { setMessage(error instanceof Error ? error.message : "Laden mislukt."); setIsError(true); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    let active = true;
    const poll = () => fetch("/api/dashboard/measurement-tiles")
      .then(async response => { if (!response.ok) throw new Error("Meetwaarden tijdelijk niet beschikbaar."); return response.json() as Promise<MeasurementTileResponse>; })
      .then(data => { if (active) setPreviewData(data); })
      .catch(() => undefined);
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  React.useEffect(() => {
    if (!selected?.source) return;
    if (selected.source.type === "logic") {
      setSourceType("logic");
    } else {
      setSourceType("device");
      setDeviceId(selected.source.deviceId);
      const sourceDevice = catalog.devices.find(device => device.id === selected.source?.deviceId);
      setZoneId(sourceDevice?.zone ?? "");
    }
  }, [selected?.id, selected?.source, catalog.devices]);
  const zonePath = (id: string | null): string => {
    if (!id) return "";
    const zone = catalog.zones.find(item => item.id === id);
    if (!zone) return "";
    return [zonePath(zone.parent), zone.name].filter(Boolean).join(" / ");
  };
  const update = (patch: Partial<MeasurementTile>) => setTiles(current => current.map(tile => tile.id === selected.id ? { ...tile, ...patch } : tile));
  const devices = catalog.devices.filter(device => device.zone === zoneId);
  const chosenDevice = catalog.devices.find(device => device.id === deviceId);
  const sourceDescription = (tile: MeasurementTile) => {
    if (!tile.source) return "Geen bron geselecteerd";
    if (tile.source.type === "logic") return catalog.variables.find(variable => variable.id === tile.source?.variableId)?.name ?? "Logic-variabele";
    const device = catalog.devices.find(item => item.id === tile.source?.deviceId);
    const capability = device?.capabilities.find(item => item.id === tile.source?.capabilityId);
    return [device?.name, capability?.title].filter(Boolean).join(" · ") || "Apparaatbron";
  };
  const save = async () => {
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch("/api/settings/measurement-tiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tiles }) });
      const result = await response.json() as { tiles?: MeasurementTile[]; error?: string };
      if (!response.ok || !result.tiles) throw new Error(result.error ?? "Opslaan mislukt.");
      setTiles(result.tiles); setSaved(result.tiles); setMessage("Meetwaardetegels opgeslagen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt."); setIsError(true); }
    finally { setSaving(false); }
  };
  return <div className="quick-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon">♙</div><div><h1>{t("settings.temperatureTiles")}</h1><p>Configureer de vier meetwaardetegels op het dashboard.</p></div></div>
    <div className="quick-workspace measurement-workspace">
      <section className="settings-card quick-list-card measurement-list-card">
        <h2><span>♙</span>Meetwaardetegels</h2>
        <p className="quick-card-description">Configureer de vier vaste tegels. Kies per tegel een naam en één numerieke Homey-meetwaarde.</p>
        <div className="quick-action-list measurement-tile-list">
          {tiles.map((tile, index) => <button type="button" key={tile.id} className={"quick-action-row" + (tile.id === selectedId ? " selected" : "")} onClick={() => setSelectedId(tile.id)}>
            <span className="quick-action-number">{index + 1}</span><MdiIcon name={tile.icon || "thermometer"} className="quick-action-icon"/><span className="quick-action-name">{tile.name || "Tegel"}</span><span className="quick-action-edit">✎</span>
          </button>)}
        </div>
        {selected && <div className="measurement-inline-editor">
          <h3>Tegel {tiles.findIndex(tile => tile.id === selected.id) + 1} configureren</h3>
          <label>Naam<input maxLength={32} value={selected.name} onChange={event => update({ name: event.target.value })}/></label>
          <div className="quick-editor-label">Pictogram</div>
          <div className="mdi-picker">
            <div className="mdi-search-wrap"><span className="mdi mdi-magnify" aria-hidden="true" /><input type="search" value={iconSearch} onChange={event => setIconSearch(event.target.value)} placeholder="Zoek MDI-iconen, bijvoorbeeld temperatuur, licht of water…" aria-label="Zoek MDI-iconen" /></div>
            <div className="quick-icon-picker">
              {visibleIcons.map(icon => <button type="button" key={icon.name} title={icon.name} aria-label={icon.name} aria-pressed={(selected.icon || "thermometer") === icon.name} className={(selected.icon || "thermometer") === icon.name ? "active" : ""} onClick={() => update({ icon: icon.name })}><MdiIcon name={icon.name} /></button>)}
              {matchingIcons.length === 0 && <div className="mdi-no-results">Geen MDI-iconen gevonden.</div>}
            </div>
            <div className="mdi-picker-count">{visibleIcons.length} van {matchingIcons.length} iconen{matchingIcons.length > 120 ? " · verfijn je zoekopdracht" : ""}</div>
          </div>
          <div className="measurement-source-types"><button type="button" className={sourceType === "device" ? "active" : ""} onClick={() => setSourceType("device")}>Apparaat</button><button type="button" className={sourceType === "logic" ? "active" : ""} onClick={() => setSourceType("logic")}>Homey Logic</button></div>
          {sourceType === "device" ? <>
            <label>Ruimte<select value={zoneId} onChange={event => { setZoneId(event.target.value); setDeviceId(""); }}><option value="">Selecteer een ruimte</option>{catalog.zones.map(zone => <option key={zone.id} value={zone.id}>{zonePath(zone.id)}</option>)}</select></label>
            <label>Apparaat<select value={deviceId} onChange={event => setDeviceId(event.target.value)}><option value="">Selecteer een apparaat</option>{devices.map(device => <option key={device.id} value={device.id}>{device.name}{device.available ? "" : " (offline)"}</option>)}</select></label>
            <label>Meetwaarde<select disabled={!chosenDevice} value={selected.source?.type === "device" && selected.source.deviceId === deviceId ? selected.source.capabilityId : ""} onChange={event => update({ source: event.target.value ? { type: "device", deviceId, capabilityId: event.target.value } : null })}><option value="">Selecteer een numerieke meetwaarde</option>{chosenDevice?.capabilities.map(cap => <option key={cap.id} value={cap.id}>{cap.title}{cap.units ? " (" + cap.units + ")" : ""}</option>)}</select></label>
          </> : <label>Numerieke Logic-variabele<select value={selected.source?.type === "logic" ? selected.source.variableId : ""} onChange={event => update({ source: event.target.value ? { type: "logic", variableId: event.target.value } : null })}><option value="">Selecteer een Logic-variabele</option>{catalog.variables.map(variable => <option key={variable.id} value={variable.id}>{variable.name}</option>)}</select></label>}
          <p className="measurement-source-note">Eenheid en precisie komen automatisch uit Homey-metadata wanneer beschikbaar. Logic-variabelen tonen geen eenheid.</p>
        </div>}
        <div className="quick-info">ⓘ <span>Selecteer een tegel om de naam en Homey-meetbron aan te passen.</span></div>
      </section>
      <section className="settings-card quick-preview-card">
        <h2><span>◎</span>{t("settings.preview")}</h2>
        <p className="quick-card-description">Zo worden de meetwaardetegels op het dashboard weergegeven.</p>
        <div className="quick-preview-grid measurement-preview-grid">
          {tiles.map(tile => {
            const reading = previewData?.values.find(item => item.id === tile.id);
            return <div className="quick-preview-item measurement-preview-item" key={tile.id}><MdiIcon name={tile.icon || "thermometer"}/><strong>{tile.name || "Tegel"}</strong><span className="measurement-preview-value">{formatMeasurementValue(reading)}</span><small>{sourceDescription(tile)}</small></div>;
          })}
        </div>
      </section>
    </div>
    <div className="settings-bottom"><span className={"save-message" + (isError ? " error" : "")} role={isError ? "alert" : "status"}>{busy ? "Laden…" : message}</span><button className="primary-button" disabled={!dirty || saving || busy || tiles.some(tile => !tile.name.trim())} onClick={() => void save()}>{saving ? "Opslaan…" : "▣  Opslaan"}</button></div>
  </div>;
}


function findComparisonNode(node: any): any | null {
  if (!node || typeof node !== "object") return null;
  if (node.type === "comparison") return node;
  if (Array.isArray(node.conditions)) {
    for (const child of node.conditions) { const found = findComparisonNode(child); if (found) return found; }
  }
  if (node.condition) return findComparisonNode(node.condition);
  return null;
}
function replaceFirstComparison(node: any, comparison: any): any {
  if (!node || typeof node !== "object") return node;
  if (node.type === "comparison") return { ...node, condition: comparison };
  if (Array.isArray(node.conditions)) {
    let replaced = false;
    return { ...node, conditions: node.conditions.map((child: any) => {
      if (replaced || !findComparisonNode(child)) return child;
      replaced = true;
      return replaceFirstComparison(child, comparison);
    }) };
  }
  if (node.condition && findComparisonNode(node.condition)) return { ...node, condition: replaceFirstComparison(node.condition, comparison) };
  return node;
}
function replaceFirstComparisonSource(node: any, source: any): any {
  if (!node || typeof node !== "object") return node;
  if (node.type === "comparison") {
    const comparison = node.condition;
    const validForSource = source.expectedType === "number"
      ? typeof comparison?.value === "number"
      : ["equals", "notEquals"].includes(comparison?.operator) && typeof comparison?.value === "boolean";
    const fallback = source.expectedType === "number"
      ? { operator: "equals", value: 0 }
      : { operator: "equals", value: false };
    return { ...node, source, condition: validForSource ? comparison : fallback };
  }
  if (Array.isArray(node.conditions)) {
    let replaced = false;
    return { ...node, conditions: node.conditions.map((child: any) => {
      if (replaced || !findComparisonNode(child)) return child;
      replaced = true;
      return replaceFirstComparisonSource(child, source);
    }) };
  }
  if (node.condition && findComparisonNode(node.condition)) return { ...node, condition: replaceFirstComparisonSource(node.condition, source) };
  return node;
}
function findScheduleNode(node: any): any | null {
  if (!node || typeof node !== "object") return null;
  if (node.type === "schedule") return node;
  if (Array.isArray(node.conditions)) {
    for (const child of node.conditions) { const found = findScheduleNode(child); if (found) return found; }
  }
  if (node.condition) return findScheduleNode(node.condition);
  return null;
}
function replaceScheduleNode(node: any, schedule: ScheduleEditorValue): any {
  if (!node || typeof node !== "object") return node;
  if (node.type === "schedule") return schedule;
  if (Array.isArray(node.conditions)) return { ...node, conditions: node.conditions.map((child: any) => replaceScheduleNode(child, schedule)) };
  if (node.condition) return { ...node, condition: replaceScheduleNode(node.condition, schedule) };
  return node;
}
function ScheduleBlocklyEditor({ condition, schedule, onChange, onConditionChange, locale, sourceCatalog, sourceKey, onSourceChange, comparison, onComparisonChange }: { condition: any; schedule: any; onChange: (value: ScheduleEditorValue) => void; onConditionChange: (value: any) => void; locale: string; sourceCatalog: NotificationSourceCatalog | null; sourceKey: string; onSourceChange: (key: string) => void; comparison: any; onComparisonChange: (operator: string, value: boolean | number) => void }) {
  const host = React.useRef<HTMLDivElement>(null);
  const [blocklyUnavailable, setBlocklyUnavailable] = React.useState(false);
  const [conditionError, setConditionError] = React.useState("");
  const conditionErrorRef = React.useRef(setConditionError);
  conditionErrorRef.current = setConditionError;
  const changeRef = React.useRef(onChange);
  const sourceChangeRef = React.useRef(onSourceChange);
  const catalogRef = React.useRef(sourceCatalog);
  const sourceKeyRef = React.useRef(sourceKey);
  const comparisonRef = React.useRef(comparison);
  const comparisonChangeRef = React.useRef(onComparisonChange);
  const conditionChangeRef = React.useRef(onConditionChange);
  changeRef.current = onChange;
  sourceChangeRef.current = onSourceChange;
  catalogRef.current = sourceCatalog;
  sourceKeyRef.current = sourceKey;
  comparisonRef.current = comparison;
  comparisonChangeRef.current = onComparisonChange;
  conditionChangeRef.current = onConditionChange;
  React.useEffect(() => {
    const Blockly: any = BlocklyLibrary;
    if (!host.current) { setBlocklyUnavailable(true); return; }
    const days: Array<[number, string]> = [[1,"MON"],[2,"TUE"],[3,"WED"],[4,"THU"],[5,"FRI"],[6,"SAT"],[0,"SUN"]];
    if (!Blockly.Blocks.schedule_active) {
      Blockly.Blocks.schedule_active = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "notifications.blockTitle"));
          const labels = locale.toLowerCase().startsWith("en") ? [["Mon","MON"],["Tue","TUE"],["Wed","WED"],["Thu","THU"],["Fri","FRI"],["Sat","SAT"],["Sun","SUN"]] : [["Ma","MON"],["Di","TUE"],["Wo","WED"],["Do","THU"],["Vr","FRI"],["Za","SAT"],["Zo","SUN"]];
          const row = this.appendDummyInput().appendField(translate(locale, "notifications.days"));
          labels.forEach(([label, key]) => row.appendField(new Blockly.FieldCheckbox("FALSE"), key).appendField(label));
          this.appendDummyInput().appendField(translate(locale, "notifications.from")).appendField(new Blockly.FieldTextInput("07:00"), "START").appendField(translate(locale, "notifications.until")).appendField(new Blockly.FieldTextInput("22:00"), "END");
          this.setOutput(true, "Boolean"); this.setColour(210);
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_source) {
      Blockly.Blocks.homey_notification_source = {
        init() {
          this.appendDummyInput().appendField("Homey-bron").appendField(new Blockly.FieldDropdown(() => {
            const catalog = catalogRef.current;
            const options: Array<[string, string]> = [["— selecteer bron —", ""]];
            (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title + (capability.units ? " (" + capability.units + ")" : ""), "device:" + device.id + ":" + capability.id])));
            (catalog?.variables ?? []).forEach(variable => options.push(["Logic · " + variable.name, "logic:" + variable.id]));
            return options;
          }, (value: string) => { if (value) sourceChangeRef.current(value); return value; }), "SOURCE");
          this.setOutput(true, "HomeySource"); this.setColour(285);
          this.setTooltip("Selecteer een Homey-apparaat/capability of Logic-variabele.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_comparison) {
      Blockly.Blocks.homey_notification_comparison = {
        init() {
          this.appendValueInput("SOURCE").setCheck("HomeySource").appendField("Vergelijking");
          this.appendDummyInput().appendField(new Blockly.FieldDropdown(() => {
            const numeric = comparisonRef.current?.source?.expectedType === "number";
            return numeric
              ? [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"],["is kleiner dan","lessThan"],["is kleiner of gelijk aan","lessThanOrEqual"],["is groter dan","greaterThan"],["is groter of gelijk aan","greaterThanOrEqual"]]
              : [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"]];
          }, (value: string) => { const current = comparisonRef.current; const nextValue = ["lessThan","lessThanOrEqual","greaterThan","greaterThanOrEqual"].includes(value) ? (typeof current?.condition?.value === "number" ? current.condition.value : 0) : (typeof current?.condition?.value === "boolean" ? current.condition.value : false); comparisonChangeRef.current(value, nextValue); return value; }), "OP");
          this.appendDummyInput().appendField("waarde").appendField(new Blockly.FieldTextInput(String(comparisonRef.current?.condition?.value ?? false)), "VALUE");
          this.setOutput(true, "Boolean"); this.setColour(165);
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_duration_active) {
      Blockly.Blocks.homey_notification_duration_active = {
        init() {
          this.appendDummyInput().appendField("Gedurende").appendField(new Blockly.FieldNumber(5, 1, 1440, 1), "MINUTES").appendField("minuten actief");
          this.appendStatementInput("CONDITION").appendField("voorwaarde");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30);
          this.setTooltip("De ingesloten voorwaarde moet onafgebroken waar blijven gedurende het ingestelde aantal minuten.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_duration_inactive) {
      Blockly.Blocks.homey_notification_duration_inactive = {
        init() {
          this.appendDummyInput().appendField("Gedurende").appendField(new Blockly.FieldNumber(5, 1, 1440, 1), "MINUTES").appendField("minuten inactief");
          this.appendStatementInput("CONDITION").appendField("voorwaarde");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30);
          this.setTooltip("De ingesloten voorwaarde moet onafgebroken onwaar blijven gedurende het ingestelde aantal minuten.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_condition_statement) {
      Blockly.Blocks.homey_notification_condition_statement = {
        init() {
          this.appendDummyInput().appendField("Als").appendField(new Blockly.FieldDropdown(() => {
            const catalog = catalogRef.current;
            const options: Array<[string, string]> = [["— selecteer Homey-bron —", ""]];
            (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title, "device:" + device.id + ":" + capability.id])));
            (catalog?.variables ?? []).forEach(variable => options.push(["Logic · " + variable.name, "logic:" + variable.id]));
            return options;
          }, (value: string) => { if (value) sourceChangeRef.current(value); return value; }), "SOURCE");
          this.appendDummyInput().appendField(new Blockly.FieldDropdown(() => {
            const numeric = comparisonRef.current?.source?.expectedType === "number";
            return numeric
              ? [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"],["is kleiner dan","lessThan"],["is kleiner of gelijk aan","lessThanOrEqual"],["is groter dan","greaterThan"],["is groter of gelijk aan","greaterThanOrEqual"]]
              : [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"]];
          }, (value: string) => {
            const current = comparisonRef.current;
            const numeric = ["lessThan","lessThanOrEqual","greaterThan","greaterThanOrEqual"].includes(value) || current?.source?.expectedType === "number";
            comparisonChangeRef.current(value, numeric ? (typeof current?.condition?.value === "number" ? current.condition.value : 0) : (typeof current?.condition?.value === "boolean" ? current.condition.value : false));
            return value;
          }), "OP").appendField(new Blockly.FieldTextInput(String(comparisonRef.current?.condition?.value ?? false), (value: string) => {
            const numeric = comparisonRef.current?.source?.expectedType === "number";
            const parsed = numeric ? Number(value) : value.toLowerCase() === "true";
            if (!numeric || Number.isFinite(parsed as number)) comparisonChangeRef.current(comparisonRef.current?.condition?.operator ?? "equals", parsed as boolean | number);
            return value;
          }), "VALUE");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(165);
          this.setTooltip("Vergelijk een geselecteerde Homey-bron. Dit blok kan in een duurblok worden geplaatst.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_and) {
      Blockly.Blocks.homey_notification_logic_and = {
        init() {
          this.appendValueInput("A").setCheck("Boolean").appendField("EN");
          this.appendValueInput("B").setCheck("Boolean").appendField("en");
          this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip("Alle aangesloten voorwaarden moeten waar zijn.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_or) {
      Blockly.Blocks.homey_notification_logic_or = {
        init() {
          this.appendValueInput("A").setCheck("Boolean").appendField("OF");
          this.appendValueInput("B").setCheck("Boolean").appendField("of");
          this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip("Minimaal één aangesloten voorwaarde moet waar zijn.");
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_not) {
      Blockly.Blocks.homey_notification_logic_not = {
        init() {
          this.appendValueInput("CONDITION").setCheck("Boolean").appendField("NIET");
          this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip("Keert de uitkomst van één aangesloten voorwaarde om.");
        }
      };
    }
    const sourceOptions = (kind: "device" | "logic"): Array<[string,string]> => {
      const catalog = catalogRef.current;
      if (kind === "device") {
        const options: Array<[string,string]> = [];
        (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title + (capability.units ? " (" + capability.units + ")" : ""), "device:" + device.id + ":" + capability.id])));
        return options.length ? options : [["Geen apparaatbronnen beschikbaar", ""]];
      }
      const options: Array<[string,string]> = [];
      (catalog?.variables ?? []).forEach(variable => options.push([variable.name, "logic:" + variable.id]));
      return options.length ? options : [["Geen Logic-variabelen beschikbaar", ""]];
    };
    const comparisonOptions = (block: any): Array<[string, string]> => {
      const source = resolveNotificationSourceFromKey(block.getFieldValue("SOURCE"), catalogRef.current);
      return source?.expectedType === "number"
        ? [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"],["is kleiner dan","lessThan"],["is kleiner of gelijk aan","lessThanOrEqual"],["is groter dan","greaterThan"],["is groter of gelijk aan","greaterThanOrEqual"]]
        : [["is gelijk aan","equals"],["is niet gelijk aan","notEquals"]];
    };
    const defineSourceBlock = (type: "device" | "logic") => ({
      init(this: any) {
        const block = this;
        this.appendDummyInput()
          .appendField(type === "device" ? "Homey-apparaat" : "Homey Logic-variabele")
          .appendField(new Blockly.FieldDropdown(() => sourceOptions(type)), "SOURCE")
          .appendField(new Blockly.FieldDropdown(() => comparisonOptions(block)), "OP")
          .appendField(new Blockly.FieldTextInput(resolveNotificationSourceFromKey(sourceOptions(type)[0]?.[1] ?? "", catalogRef.current)?.expectedType === "boolean" ? "false" : "0"), "VALUE");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(285);
        this.setOnChange((event: any) => {
          if (event.type !== Blockly.Events.BLOCK_FIELD_CHANGED || event.blockId !== block.id || event.name !== "SOURCE") return;
          const source = resolveNotificationSourceFromKey(block.getFieldValue("SOURCE"), catalogRef.current);
          if (!source) return;
          if (!comparisonOptions(block).some(([, operator]) => operator === block.getFieldValue("OP"))) block.setFieldValue("equals", "OP");
          const raw = block.getFieldValue("VALUE");
          if (source.expectedType === "number" && (raw.trim() === "" || !Number.isFinite(Number(raw)))) block.setFieldValue("0", "VALUE");
          if (source.expectedType === "boolean" && raw !== "true" && raw !== "false") block.setFieldValue("false", "VALUE");
        });
        this.setTooltip("Selecteer een Homey-bron en stel direct de vergelijking in.");
      }
    });
    if (!Blockly.Blocks.homey_condition_device_source) Blockly.Blocks.homey_condition_device_source = defineSourceBlock("device");
    if (!Blockly.Blocks.homey_condition_logic_source) Blockly.Blocks.homey_condition_logic_source = defineSourceBlock("logic");
    if (!Blockly.Blocks.homey_condition_comparison) Blockly.Blocks.homey_condition_comparison = {
      init() {
        this.appendDummyInput().appendField("Vergelijking").appendField(new Blockly.FieldDropdown([["is gelijk aan","equals"],["is niet gelijk aan","notEquals"],["is kleiner dan","lessThan"],["is kleiner of gelijk aan","lessThanOrEqual"],["is groter dan","greaterThan"],["is groter of gelijk aan","greaterThanOrEqual"]]), "OP");
        this.appendDummyInput().appendField("waarde").appendField(new Blockly.FieldTextInput("false"), "VALUE");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(165);
      }
    };
    if (!Blockly.Blocks.homey_condition_schedule) Blockly.Blocks.homey_condition_schedule = {
      init() {
        this.appendDummyInput().appendField("Tijdschema actief?");
        const labels = [["Ma","MON"],["Di","TUE"],["Wo","WED"],["Do","THU"],["Vr","FRI"],["Za","SAT"],["Zo","SUN"]];
        const row = this.appendDummyInput().appendField("Dagen:");
        labels.forEach(([label,key]) => row.appendField(new Blockly.FieldCheckbox("FALSE"), key).appendField(label));
        this.appendDummyInput().appendField("Van").appendField(new Blockly.FieldTextInput("07:00"), "START").appendField("tot").appendField(new Blockly.FieldTextInput("22:00"), "END");
        this.appendStatementInput("CONDITIONS").appendField("Alleen wanneer:");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(265);
        this.setTooltip("De voorwaarden binnen dit tijdschema gelden alleen op de geselecteerde dagen en tijden.");
      }
    };
    if (!Blockly.Blocks.homey_condition_weekday) Blockly.Blocks.homey_condition_weekday = {
      init() {
        this.appendDummyInput().appendField("Dag van de week").appendField(new Blockly.FieldDropdown([["maandag","1"],["dinsdag","2"],["woensdag","3"],["donderdag","4"],["vrijdag","5"],["zaterdag","6"],["zondag","0"]]), "DAY");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(210);
      }
    };
    for (const type of ["and","or"]) {
      const blockType = "homey_condition_" + type;
      if (!Blockly.Blocks[blockType]) Blockly.Blocks[blockType] = {
        init() {
          this.appendDummyInput().appendField(type === "and" ? "EN" : "OF");
          this.appendStatementInput("CONDITIONS");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(120);
          this.setTooltip(type === "and" ? "Alle ingesloten voorwaarden moeten waar zijn." : "Minimaal één ingesloten voorwaarde moet waar zijn.");
        }
      };
    }
    if (!Blockly.Blocks.homey_condition_not) Blockly.Blocks.homey_condition_not = {
      init() { this.appendDummyInput().appendField("NIET"); this.appendStatementInput("CONDITION"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(120); }
    };
    if (!Blockly.Blocks.homey_condition_unsupported) Blockly.Blocks.homey_condition_unsupported = {
      init() {
        this.appendDummyInput().appendField("Niet-ondersteunde voorwaarde");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(0);
        this.setTooltip("Dit conditietype wordt nog niet visueel bewerkt. De oorspronkelijke JSON blijft ongewijzigd zolang je niet opslaat vanuit een volledige editor.");
      }
    };
    if (!Blockly.Blocks.homey_condition_duration_inactive) Blockly.Blocks.homey_condition_duration_inactive = {
      init() { this.appendDummyInput().appendField("Gedurende").appendField(new Blockly.FieldNumber(5,1,1440,1),"MINUTES").appendField("minuten inactief"); this.appendStatementInput("CONDITION").appendField("voorwaarde"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30); }
    };
    if (!Blockly.Blocks.homey_condition_duration) Blockly.Blocks.homey_condition_duration = {
      init() { this.appendDummyInput().appendField("Gedurende").appendField(new Blockly.FieldNumber(5,1,1440,1),"MINUTES").appendField("minuten actief"); this.appendStatementInput("CONDITION").appendField("voorwaarde"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30); }
    };
    if (!Blockly.Blocks.homey_notification_root) Blockly.Blocks.homey_notification_root = {
      init() {
        this.appendStatementInput("CONDITIONS");
        this.appendDummyInput("FOOTER").appendField("🔔 Genereer melding");
        this.setColour(285);
        this.setTooltip("De vaste hoofdconstructie van deze melding. Plaats hier voorwaarden en EN/OF-containers in.");
        this.setMovable(false);
        this.setDeletable(false);
      }
    };
    const toolbox = {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: "Voorwaarden",
          categorystyle: "logic_category",
          contents: [
            { kind: "block", type: "homey_condition_device_source" },
            { kind: "block", type: "homey_condition_logic_source" },
          ]
        },
        {
          kind: "category",
          name: "Containers",
          categorystyle: "logic_category",
          contents: [
            { kind: "block", type: "homey_condition_and" },
            { kind: "block", type: "homey_condition_or" },
            { kind: "block", type: "homey_condition_not" }
          ]
        },
        {
          kind: "category",
          name: "Tijd",
          categorystyle: "logic_category",
          contents: [
            { kind: "block", type: "homey_condition_schedule" },
            { kind: "block", type: "homey_condition_weekday" },
            { kind: "block", type: "homey_condition_duration" },
            { kind: "block", type: "homey_condition_duration_inactive" }
          ]
        }
      ]
    };
    const homeyDarkTheme = Blockly.Theme.defineTheme("homeyDark", {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: "#171b22",
        toolboxBackgroundColour: "#202630",
        toolboxForegroundColour: "#dce3ec",
        flyoutBackgroundColour: "#242c37",
        flyoutForegroundColour: "#dce3ec",
        flyoutOpacity: 1,
        scrollbarColour: "#657386",
        insertionMarkerColour: "#f4f6f9",
        insertionMarkerOpacity: 0.3,
        cursorColour: "#f4f6f9"
      }
    });
    const ws = Blockly.inject(host.current, {
      toolbox,
      theme: homeyDarkTheme,
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.4, minScale: 0.55 },
      grid: { spacing: 20, length: 3, colour: "#46505d", snap: true }
    });
    const buildCondition = (node: any): any => {
      if (!node || typeof node !== "object") return null;
      let block: any = null;
      if (node.type === "comparison") {
        const sourceKey = sourceKeyFromNode(node.source);
        const resolvedSource = resolveNotificationSourceFromKey(sourceKey, catalogRef.current);
        if (!resolvedSource) {
          block = ws.newBlock("homey_condition_unsupported");
          block.data = JSON.stringify(node);
        } else {
          const sourceType = node.source?.type === "device-capability" ? "homey_condition_device_source" : "homey_condition_logic_source";
          const candidate = ws.newBlock(sourceType);
          candidate.setFieldValue(sourceKey, "SOURCE");
          const operator = node.condition?.operator ?? "equals";
          if (!comparisonOptions(candidate).some(([, option]) => option === operator)) {
            candidate.dispose();
            block = ws.newBlock("homey_condition_unsupported");
            block.data = JSON.stringify(node);
          } else {
            candidate.setFieldValue(operator, "OP");
            candidate.setFieldValue(String(node.condition?.value ?? false), "VALUE");
            block = candidate;
          }
        }
      } else if (node.type === "schedule") {
        block = ws.newBlock("homey_condition_schedule");
        days.forEach(([day, field]) => block.setFieldValue(node.weekdays?.includes(day) ? "TRUE" : "FALSE", field));
        if (node.startTime) block.setFieldValue(node.startTime, "START");
        if (node.endTime) block.setFieldValue(node.endTime, "END");
      } else if (node.type === "weekday") {
        block = ws.newBlock("homey_condition_weekday");
        if (node.weekdays?.length === 1) block.setFieldValue(String(node.weekdays[0]), "DAY");
      } else if (node.type === "not") {
        block = ws.newBlock("homey_condition_not");
        const child = buildCondition(node.condition);
        if (child) block.getInput("CONDITION")?.connection?.connect(child.previousConnection);
      } else if (node.type === "duration") {
        const durationModel = durationNodeToBlockly(node);
        block = ws.newBlock(durationModel.blockType);
        block.data = durationModel.id ?? null;
        block.setFieldValue(String(durationModel.minutes), "MINUTES");
        const child = buildCondition(durationModel.child);
        if (child) block.getInput("CONDITION")?.connection?.connect(child.previousConnection);
      } else if (node.operator === "and" || node.operator === "or") {
        const conditionNodes = node.conditions ?? [];
        const scheduleIndex = node.operator === "and" ? conditionNodes.findIndex((child: any) => child?.type === "schedule") : -1;
        if (scheduleIndex >= 0) {
          const scheduleNode = conditionNodes[scheduleIndex];
          block = buildCondition(scheduleNode);
          let previous: any = null;
          conditionNodes.filter((_: any, index: number) => index !== scheduleIndex).forEach((childNode: any) => {
            const child = buildCondition(childNode);
            if (!child) return;
            if (!previous) block.getInput("CONDITIONS")?.connection?.connect(child.previousConnection);
            else previous.nextConnection?.connect(child.previousConnection);
            previous = child;
            while (previous?.getNextBlock?.()) previous = previous.getNextBlock();
          });
        } else {
          block = ws.newBlock("homey_condition_" + node.operator);
          let previous: any = null;
          conditionNodes.forEach((childNode: any) => {
            const child = buildCondition(childNode);
            if (!child) return;
            if (!previous) block.getInput("CONDITIONS")?.connection?.connect(child.previousConnection);
            else previous.nextConnection?.connect(child.previousConnection);
            previous = child;
            while (previous?.getNextBlock?.()) previous = previous.getNextBlock();
          });
        }
      }
      if (!block) { block = ws.newBlock("homey_condition_unsupported"); block.data = JSON.stringify(node); }
      if (block) { block.initSvg(); block.render(); }
      return block;
    };
    const rootBlock = ws.newBlock("homey_notification_root");
    rootBlock.initSvg();
    rootBlock.render();
    const initialCondition = buildCondition(condition);
    if (initialCondition) rootBlock.getInput("CONDITIONS")?.connection?.connect(initialCondition.previousConnection);
    rootBlock.setMovable(false);
    rootBlock.setDeletable(false);
    let hydrating = true;
    const sourceFromKey = (key: string) => resolveNotificationSourceFromKey(key, catalogRef.current);
    const serializeChain = (first: any): any[] => {
      const result: any[] = [];
      let current = first;
      while (current) {
        const node = serializeBlock(current);
        if (node) result.push(node);
        current = current.getNextBlock?.() ?? null;
      }
      return result;
    };
    const serializeBlock = (block: any): any => {
      if (block.type === "homey_condition_device_source" || block.type === "homey_condition_logic_source") {
        const source = sourceFromKey(block.getFieldValue("SOURCE"));
        if (!source) throw new Error("Selecteer een geldige Homey-bron.");
        const operator = block.getFieldValue("OP");
        const value = comparisonValueFromBlockly(source, operator, block.getFieldValue("VALUE"));
        return { type: "comparison", source, condition: { operator, value } };
      }
      if (block.type === "homey_condition_schedule") {
        const weekdays = days.filter(([day, field]) => block.getFieldValue(field) === "TRUE").map(([day]) => day);
        const schedule = weekdays.length
          ? { type: "schedule", weekdays, startTime: block.getFieldValue("START"), endTime: block.getFieldValue("END"), timeZone: "Europe/Amsterdam" }
          : { type: "schedule", configured: false, weekdays: [] };
        const children = serializeChain(block.getInputTargetBlock("CONDITIONS"));
        return children.length ? { operator: "and", conditions: [schedule, ...children] } : schedule;
      }
      if (block.type === "homey_condition_weekday") return { type: "weekday", weekdays: [Number(block.getFieldValue("DAY"))] };
      if (block.type === "homey_condition_not") {
        const children = serializeChain(block.getInputTargetBlock("CONDITION"));
        if (children.length !== 1) throw new Error("NIET vereist precies één voorwaarde.");
        return { type: "not", condition: children[0] };
      }
      if (block.type === "homey_condition_duration" || block.type === "homey_condition_duration_inactive") {
        const children = serializeChain(block.getInputTargetBlock("CONDITION"));
        if (children.length !== 1) throw new Error("Een duurblok vereist precies één voorwaarde.");
        const minutes = Number(block.getFieldValue("MINUTES"));
        return durationNodeFromBlockly(block.id, block.data, minutes, children[0], block.type === "homey_condition_duration_inactive");
      }
      if (block.type === "homey_condition_and" || block.type === "homey_condition_or") {
        const conditions = serializeChain(block.getInputTargetBlock("CONDITIONS"));
        if (conditions.length < 2) throw new Error("EN/OF vereist minimaal twee aangesloten voorwaarden.");
        return { operator: block.type.endsWith("_and") ? "and" : "or", conditions };
      }
      if (block.type === "homey_condition_unsupported") throw new Error("Deze melding bevat een nog niet ondersteunde voorwaarde. Pas die nog niet aan in Blockly.");
      throw new Error("Onbekend Blockly-blok: " + block.type);
    };
    const emitCondition = () => {
      if (hydrating) return;
      try {
        const roots = ws.getTopBlocks(true);
        if (roots.length !== 1 || roots[0] !== rootBlock) throw new Error("Alle voorwaarden moeten binnen Genereer melding staan.");
        const nodes = serializeChain(rootBlock.getInputTargetBlock("CONDITIONS"));
        if (nodes.length === 0) throw new Error("Voeg minimaal één voorwaarde of container toe aan Genereer melding.");
        conditionChangeRef.current(combineRootConditions(nodes));
        conditionErrorRef.current("");
      } catch (error) {
        conditionErrorRef.current(error instanceof Error ? error.message : "De Blockly-voorwaarde is ongeldig en is niet opgeslagen.");
        // Invalid/incomplete workspaces are deliberately not written to configuration.
      }
    };
    ws.addChangeListener((event: any) => {
      if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;
      emitCondition();
    });
    hydrating = false;
    return () => ws.dispose();
  }, []);
  return <div className="schedule-blockly-shell"><div className="schedule-blockly-toolbar"><span><i className="mdi mdi-puzzle-outline"/> {translate(locale, "notifications.editorLabel")}</span></div>{blocklyUnavailable ? <p className="notification-editor-hint">{translate(locale, "notifications.editorUnavailable")}</p> : <><div ref={host} className="schedule-blockly-workspace" />{conditionError && <p className="notification-editor-error" role="alert">{conditionError}</p>}</>}</div>;
}
function NotificationSettingsPage({ locale }: { locale: string }) {
  const [configs, setConfigs] = React.useState<NotificationConfigEditor[]>([]);
  const [sourceCatalog, setSourceCatalog] = React.useState<NotificationSourceCatalog | null>(null);
  const [sourceCatalogError, setSourceCatalogError] = React.useState("");
  const [saved, setSaved] = React.useState<NotificationConfigEditor[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isError, setIsError] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/notifications").then(async response => {
        if (!response.ok) throw new Error((await response.json()).error ?? translate(locale, "notifications.loadError"));
        return response.json() as Promise<{ notifications: NotificationConfigEditor[] }>;
      }),
      fetch("/api/settings/notification-sources").then(async response => {
        if (!response.ok) throw new Error("Broncatalogus kon niet worden geladen.");
        return response.json() as Promise<NotificationSourceCatalog>;
      }).catch(error => {
        if (active) setSourceCatalogError(error instanceof Error ? error.message : "Broncatalogus kon niet worden geladen.");
        return null;
      })
    ]).then(([result, catalog]) => {
      if (!active) return;
      setConfigs(result.notifications); setSaved(result.notifications);
      const first = result.notifications[0];
      setSelectedId(first?.id ?? "");
      setSourceCatalog(catalog);
    }).catch(error => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : translate(locale, "notifications.loadError"));
      setIsError(true);
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const selected = configs.find(item => item.id === selectedId) ?? configs[0];
  const selectedSchedule = selected ? findScheduleNode(selected.condition) : null;
  const selectedComparison = selected ? findComparisonNode(selected.condition) : null;
  const currentSourceKey = selectedComparison?.source?.type === "device-capability" ? "device:" + selectedComparison.source.deviceId + ":" + selectedComparison.source.capabilityId : selectedComparison?.source?.type === "logic-variable" ? "logic:" + selectedComparison.source.variableId : "";
  const dirty = JSON.stringify(configs) !== JSON.stringify(saved);
  const updateSource = (key: string) => {
    if (!selected || !key) return;
    const deviceMatch = key.startsWith("device:") ? key.slice(7).split(":") : null;
    const device = deviceMatch ? sourceCatalog?.devices.find(item => item.id === deviceMatch[0]) : null;
    const capability = device && deviceMatch ? device.capabilities.find(item => item.id === deviceMatch[1]) : null;
    const variable = key.startsWith("logic:") ? sourceCatalog?.variables.find(item => item.id === key.slice(6)) : null;
    const source = capability && deviceMatch ? { type: "device-capability", deviceId: deviceMatch[0], capabilityId: capability.id, expectedType: capability.type } : variable ? { type: "logic-variable", variableId: variable.id, expectedType: variable.type } : null;
    if (!source) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition: replaceFirstComparisonSource(item.condition, source) } : item));
  };
  const updateComparison = (operator: string, value: boolean | number) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition: replaceFirstComparison(item.condition, { operator, value }) } : item));
  };
  const updateCondition = (condition: any) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition } : item));
  };
  const updateSeverity = (severity: "critical" | "warning" | "info") => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, severity } : item));
  };
  const updateSchedule = (value: ScheduleEditorValue) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition: replaceScheduleNode(item.condition, value) } : item));
  };
  const save = async () => {
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch("/api/settings/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifications: configs }) });
      const result = await response.json() as { notifications?: NotificationConfigEditor[]; error?: string };
      if (!response.ok || !result.notifications) throw new Error(result.error ?? translate(locale, "notifications.saveError"));
      setConfigs(result.notifications); setSaved(result.notifications); setMessage(translate(locale, "notifications.saved"));
    } catch (error) { setMessage(error instanceof Error ? error.message : translate(locale, "notifications.saveError")); setIsError(true); }
    finally { setSaving(false); }
  };
  return <div className="quick-settings-page notification-settings-page">
    <div className="settings-title"><p>{t("notifications.subtitle")}</p></div>
    <div className="notification-rule-selector">
      <label htmlFor="notification-rule-select">Meldingen</label>
      <select id="notification-rule-select" value={selected?.id ?? ""} disabled={busy || !configs.length} onChange={event => setSelectedId(event.target.value)}>
        {configs.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      {!busy && !configs.length && <p>Er zijn nog geen meldingen beschikbaar.</p>}
      {!busy && sourceCatalogError && <p className="notification-editor-error" role="alert">Homey-bronnen konden niet worden geladen: {sourceCatalogError}</p>}
    </div>
    <div className="notification-settings-layout">
      <section className="settings-card notification-editor-card">
        {selected ? <><div className="notification-editor-heading"><div><h2>{selected.title}</h2></div><div className="notification-severity-control"><label htmlFor="notification-severity-select">{translate(locale, "notifications.currentLevel")}</label><select id="notification-severity-select" value={selected.severity} disabled={busy || saving} onChange={event => updateSeverity(event.target.value as "critical" | "warning" | "info")}><option value="critical">{translate(locale, "notifications.severity.critical")}</option><option value="warning">{translate(locale, "notifications.severity.warning")}</option><option value="info">{translate(locale, "notifications.severity.info")}</option></select><span className={"notification-severity-pill severity-" + selected.severity}>{translate(locale, "notifications.severity." + selected.severity)}</span></div></div>
          <ScheduleBlocklyEditor key={selected.id + "-" + locale} condition={selected.condition} schedule={selectedSchedule} onChange={updateSchedule} onConditionChange={updateCondition} locale={locale} sourceCatalog={sourceCatalog} sourceKey={currentSourceKey} onSourceChange={updateSource} comparison={selectedComparison} onComparisonChange={updateComparison}/>
        </> : <p>{busy ? translate(locale, "notifications.loading") : "Geen melding beschikbaar."}</p>}
      </section>
    </div>
    <div className="settings-bottom"><span className={"save-message" + (isError ? " error" : "")} role={isError ? "alert" : "status"}>{busy ? translate(locale, "notifications.loading") : message}</span><button className="primary-button" disabled={!dirty || saving || busy} onClick={() => void save()}>{saving ? translate(locale, "notifications.save") : "▣  " + translate(locale, "settings.save")}</button></div>
  </div>;
}

function DashboardSettingsPage({ page, locale, t }: { page: "quick-actions" | "measurement-tiles"; locale: string; t: (key: string) => string }) {
  return page === "measurement-tiles"
    ? <MeasurementTilesSettingsPage t={t} onNavigate={() => {}}/>
    : <QuickActionsSettingsPage locale={locale} t={t} onNavigate={() => {}}/>;
}

function QuickActionsSettingsPage({ locale, t, onNavigate }: { locale: string; t: (key: string) => string; onNavigate: (path: string) => void }) {
  const [items, setItems] = React.useState<QuickAction[]>(quickActionDefaults);
  const [saved, setSaved] = React.useState<QuickAction[]>(quickActionDefaults);
  const [catalog, setCatalog] = React.useState<QuickActionCatalog>({ devices: [], flows: [] });
  const [catalogWarning, setCatalogWarning] = React.useState("");
  const [editingId, setEditingId] = React.useState("qmusic");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messageIsError, setMessageIsError] = React.useState(false);
  const [flowSearch, setFlowSearch] = React.useState("");
  const [flowPickerOpen, setFlowPickerOpen] = React.useState(false);
  const [deviceSearch, setDeviceSearch] = React.useState("");
  const [devicePickerOpen, setDevicePickerOpen] = React.useState(false);
  const [iconSearch, setIconSearch] = React.useState("");
  const iconQuery = iconSearch.trim().toLocaleLowerCase();
  const matchingIcons = quickActionIconChoices.filter(icon => !iconQuery || (icon.name + " " + icon.keywords.join(" ")).toLocaleLowerCase().includes(iconQuery));
  const visibleIcons = matchingIcons.slice(0, 120);
  const dirty = JSON.stringify(items) !== JSON.stringify(saved);
  const selected = items.find(item => item.id === editingId) ?? items[0];
  const selectedDevice = catalog.devices.find(device => device.id === selected.deviceId);
  const selectedCapability = selectedDevice?.capabilities.find(capability => capability.id === selected.capabilityId);
  const selectedFlow = selected.type === "flow"
    ? catalog.flows.find(flow => flow.id === selected.flowId && flow.type === selected.flowType)
    : undefined;
  const flowQuery = flowSearch.trim().toLocaleLowerCase();
  const deviceQuery = deviceSearch.trim().toLocaleLowerCase();
  const displayDeviceZone = (zone: string | undefined) => zone && !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(zone) ? zone : "";
  const deviceDisplayName = (device: QuickActionCatalog["devices"][number]) => device.name + (displayDeviceZone(device.zone) ? " · " + displayDeviceZone(device.zone) : "");
  const selectedDeviceLabel = selectedDevice ? deviceDisplayName(selectedDevice) : t("settings.selectDevice");
  const matchingDevices = catalog.devices.filter(device =>
    (deviceDisplayName(device) + " " + device.id).toLocaleLowerCase().includes(deviceQuery)
  );
  const matchingFlows = catalog.flows.filter(flow => {
    const searchable = (flow.name + " " + (flow.icon ?? "") + " " + flow.type).toLocaleLowerCase();
    return !flowQuery || searchable.includes(flowQuery);
  });
  const selectedActionValid = selected.type === "flow"
    ? Boolean(selectedFlow && (!flowPickerOpen || !flowQuery || matchingFlows.some(flow => flow.id === selected.flowId && flow.type === selected.flowType)))
    : Boolean(selectedDevice?.available && selectedCapability && (!devicePickerOpen || !deviceQuery || matchingDevices.some(device => device.id === selected.deviceId)));
  const actionName = (item: QuickAction) => item.name.trim();
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/dashboard-actions").then(async response => { if (!response.ok) throw new Error(t("settings.quickActionsLoadError")); return response.json() as Promise<{ actions: QuickAction[] }>; }),
      fetch("/api/settings/quick-action-catalog").then(async response => { if (!response.ok) throw new Error(t("settings.quickActionsCatalogError")); return response.json() as Promise<QuickActionCatalog>; }),
    ]).then(([configuration, options]) => {
      if (!active) return;
      const normalizedActions = configuration.actions.map(item => ({ ...item, icon: normalizeQuickActionIcon(item.icon) })); setItems(normalizedActions); setSaved(normalizedActions); setCatalog(options); setCatalogWarning(options.warnings?.join(" · ") ?? "");
    }).catch(error => { if (active) { setMessage(error instanceof Error ? error.message : t("settings.quickActionsLoadError")); setMessageIsError(true); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const updateSelected = (patch: Partial<QuickAction>) => setItems(current => current.map(item => item.id === selected.id ? { ...item, ...patch } : item));
  const selectDevice = (deviceId: string) => {
    const device = catalog.devices.find(item => item.id === deviceId);
    const capability = device?.capabilities[0];
    const value = capability ? capability.type === "boolean" ? false : capability.type === "number" ? (capability.value as number ?? capability.min ?? 0) : capability.type === "enum" ? capability.values[0]?.id ?? null : "" : null;
    updateSelected({ deviceId, capabilityId: capability?.id ?? "", value, booleanMode: capability?.type === "boolean" ? "off" : selected.booleanMode });
  };
  const selectCapability = (capabilityId: string) => {
    const capability = selectedDevice?.capabilities.find(item => item.id === capabilityId);
    const value = capability ? capability.type === "boolean" ? false : capability.type === "number" ? (typeof capability.value === "number" ? capability.value : capability.min ?? 0) : capability.type === "enum" ? capability.values[0]?.id ?? null : "" : null;
    updateSelected({ capabilityId, value, booleanMode: capability?.type === "boolean" ? "off" : selected.booleanMode });
  };
  const save = async () => {
    setSaving(true); setMessage(""); setMessageIsError(false);
    try {
      const response = await fetch("/api/settings/dashboard-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actions: items }) });
      const data = await response.json() as { actions?: QuickAction[]; error?: string };
      if (!response.ok || !data.actions) throw new Error(data.error ?? t("settings.saveError"));
      const normalizedActions = data.actions.map(item => ({ ...item, icon: normalizeQuickActionIcon(item.icon) })); setItems(normalizedActions); setSaved(normalizedActions); setMessage(t("settings.quickActionsSaved")); setMessageIsError(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : t("settings.saveError")); setMessageIsError(true); }
    finally { setSaving(false); }
  };
  const formatValue = (value: unknown, units: string) => value === null || value === undefined ? "—" : String(value) + (units ? " " + units : "");
  return <div className="quick-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon">ϟ</div><div><h1>{t("settings.quickActions")}</h1><p>{t("settings.quickActionsSubtitle")}</p></div></div>
    <div className="quick-workspace">
      <section className="settings-card quick-list-card">
        <h2><span>ϟ</span>{t("settings.quickActions")}</h2>
        <p className="quick-card-description">{t("settings.quickActionsDescription")}</p>
        <div className="quick-action-list">
          {items.map((item, index) => <button key={item.id} className={"quick-action-row " + (item.id === editingId ? "selected" : "")} onClick={() => { setEditingId(item.id); setEditorOpen(true); }}>
            <span className="quick-action-number">{index + 1}</span><MdiIcon name={item.icon} className="quick-action-icon" /><span className="quick-action-name">{actionName(item)}</span><span className="quick-action-edit">✎</span>
          </button>)}
        </div>
        <div className="quick-info">ⓘ <span>{t("settings.quickActionsHint")}</span></div>
      </section>
      <section className="settings-card quick-preview-card">
        <h2><span>◎</span>{t("settings.preview")}</h2>
        <p className="quick-card-description">{t("settings.quickActionsPreviewDescription")}</p>
        <div className="quick-preview-grid">
          {items.map(item => <div className="quick-preview-item" key={item.id}><MdiIcon name={item.icon} /><strong>{actionName(item)}</strong></div>)}
        </div>
      </section>
      {editorOpen && <section className="settings-card quick-editor-card">
        <button className="quick-editor-close" onClick={() => setEditorOpen(false)} aria-label={t("settings.close")}>×</button>
        <h2>{t("settings.editQuickAction")}</h2>
        <label>{t("settings.quickActionName")}<input maxLength={40} value={selected.name || actionName(selected)} onChange={event => updateSelected({ name: event.target.value })} /></label>
        <div className="quick-editor-label">{t("settings.quickActionIcon")}</div>
        <div className="mdi-picker">
          <div className="mdi-search-wrap"><span className="mdi mdi-magnify" aria-hidden="true" /><input type="search" value={iconSearch} onChange={event => setIconSearch(event.target.value)} placeholder="Zoek MDI-iconen, bijvoorbeeld muziek, licht of raam…" aria-label="Zoek MDI-iconen" /></div>
          <div className="quick-icon-picker">
            {visibleIcons.map(icon =>
              <button type="button" key={icon.name} title={icon.name} aria-label={icon.name} aria-pressed={selected.icon === icon.name} className={selected.icon === icon.name ? "active" : ""} onClick={() => updateSelected({ icon: icon.name })}><MdiIcon name={icon.name} /></button>
            )}
            {matchingIcons.length === 0 && <div className="mdi-no-results">Geen MDI-iconen gevonden.</div>}
          </div>
          <div className="mdi-picker-count">{visibleIcons.length} van {matchingIcons.length} iconen{matchingIcons.length > 120 ? " · verfijn je zoekopdracht" : ""}</div>
        </div>
        <label>{t("settings.actionType")}
          <select value={selected.type} onChange={event => updateSelected({ type: event.target.value as "flow" | "device" })}>
            <option value="flow">{t("settings.flowAction")}</option><option value="device">{t("settings.deviceAction")}</option>
          </select>
        </label>
        {catalogWarning && <div className="quick-catalog-warning" role="status">{catalogWarning}</div>}
        {selected.type === "flow" ? <>
          <label>{t("settings.homeyFlow")}</label>
          <div className="quick-flow-picker">
            <button type="button" className="quick-flow-trigger" aria-haspopup="listbox" aria-expanded={flowPickerOpen}
              onClick={() => { setFlowPickerOpen(open => !open); setFlowSearch(""); }}>
              <span className="quick-flow-trigger-icon">{selected.flowId ? (catalog.flows.find(flow => flow.id === selected.flowId && flow.type === selected.flowType)?.icon || (selected.flowType === "advanced" ? "✧" : "ϟ")) : "ϟ"}</span>
              <span className="quick-flow-trigger-name" title={selectedFlow?.name}>{selectedFlow?.name ?? t("settings.selectFlow")}</span>
              <span className="quick-flow-chevron">▾</span>
            </button>
            {flowPickerOpen && <div className="quick-flow-menu" role="listbox" aria-label={t("settings.homeyFlow")}>
              <div className="quick-flow-search-wrap">
                <span aria-hidden="true">⌕</span>
                <input autoFocus type="search" className="quick-flow-search" value={flowSearch}
                  onChange={event => setFlowSearch(event.target.value)}
                  placeholder={t("settings.searchFlows")} aria-label={t("settings.searchFlows")} />
              </div>
              <div className="quick-flow-results">
                {matchingFlows.map(flow => <button type="button" role="option" aria-selected={flow.id === selected.flowId && flow.type === selected.flowType}
                  className={"quick-flow-option" + (flow.id === selected.flowId && flow.type === selected.flowType ? " selected" : "")}
                  key={flow.type + flow.id} onClick={() => { updateSelected({ flowType: flow.type, flowId: flow.id }); setFlowPickerOpen(false); setFlowSearch(""); }}>
                  <span className="quick-flow-option-icon">{flow.icon || (flow.type === "advanced" ? "✧" : "ϟ")}</span>
                  <span className="quick-flow-option-name" title={flow.name}>{flow.name}</span>
                  {flow.type === "advanced" && <span className="quick-flow-type">Advanced</span>}
                </button>)}
                {matchingFlows.length === 0 && <div className="quick-flow-empty">{t("settings.noFlowResults")}</div>}
              </div>
              <div className="quick-flow-footer">{matchingFlows.length} {t("settings.flowResults")}</div>
            </div>}
          </div>
        </> : <>
          <label>{t("settings.device")}</label>
          <div className="quick-device-picker">
            <button type="button" className="quick-flow-trigger" aria-haspopup="listbox" aria-expanded={devicePickerOpen}
              onClick={() => { setDevicePickerOpen(open => !open); setDeviceSearch(""); }}>
              <span className="quick-flow-trigger-icon"><MdiIcon name="devices" /></span>
              <span className="quick-flow-trigger-name">{selectedDeviceLabel}</span>
              <span className="quick-flow-chevron">▾</span>
            </button>
            {devicePickerOpen && <div className="quick-flow-menu quick-device-menu" role="listbox" aria-label={t("settings.device")}>
              <div className="quick-flow-search-wrap">
                <span aria-hidden="true">⌕</span>
                <input autoFocus type="search" className="quick-flow-search" value={deviceSearch}
                  onChange={event => setDeviceSearch(event.target.value)}
                  placeholder="Zoek apparaat op naam of zone…" aria-label="Zoek Homey-apparaat" />
              </div>
              <div className="quick-flow-results">
                {matchingDevices.map(device => <button type="button" role="option" aria-selected={device.id === selected.deviceId}
                  className={"quick-flow-option" + (device.id === selected.deviceId ? " selected" : "")}
                  key={device.id} onClick={() => { selectDevice(device.id); setDevicePickerOpen(false); setDeviceSearch(""); }}>
                  <span className="quick-flow-option-icon"><MdiIcon name="devices" /></span>
                  <span className="quick-flow-option-name">{deviceDisplayName(device)}</span>
                  {!device.available && <span className="quick-flow-type">Offline</span>}
                </button>)}
                {matchingDevices.length === 0 && <div className="quick-flow-empty">Geen apparaten gevonden.</div>}
              </div>
              <div className="quick-flow-footer">{matchingDevices.length} apparaten</div>
            </div>}
          </div>
          <label>{t("settings.deviceActionLabel")}<select value={selected.capabilityId} onChange={event => selectCapability(event.target.value)} disabled={!selectedDevice}><option value="">{t("settings.selectDeviceAction")}</option>{selectedDevice?.capabilities.map(capability => <option key={capability.id} value={capability.id}>{capability.title}</option>)}</select></label>
          {selectedCapability?.type === "boolean" && <label>{t("settings.actionValue")}<select value={selected.booleanMode} onChange={event => { const mode = event.target.value as "on" | "off" | "toggle"; updateSelected({ booleanMode: mode, value: mode === "on" ? true : mode === "off" ? false : selected.value }); }}><option value="on">{t("settings.turnOn")}</option><option value="off">{t("settings.turnOff")}</option><option value="toggle">Wisselen (Toggle)</option></select></label>}
          {selectedCapability?.type === "number" && <label>{t("settings.actionValue")}<div className="quick-range-row"><input type="range" min={selectedCapability.min ?? 0} max={selectedCapability.max ?? 100} step={selectedCapability.step ?? 1} value={typeof selected.value === "number" ? selected.value : selectedCapability.min ?? 0} onChange={event => updateSelected({ value: Number(event.target.value) })}/><strong>{formatValue(selected.value, selectedCapability.units)}</strong></div></label>}
          {selectedCapability?.type === "enum" && <label>{t("settings.actionValue")}<select value={String(selected.value ?? "")} onChange={event => updateSelected({ value: event.target.value })}>{selectedCapability.values.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>}
          {selectedCapability?.type === "string" && <label>{t("settings.actionValue")}<input value={String(selected.value ?? "")} onChange={event => updateSelected({ value: event.target.value })}/></label>}
          {selectedDevice && !selectedDevice.available && <p className="quick-warning">{t("settings.deviceUnavailable")}</p>}
        </>}
        <div className="quick-editor-actions"><button className="secondary-button" onClick={() => { const original = saved.find(item => item.id === selected.id); if (original) setItems(current => current.map(item => item.id === selected.id ? original : item)); setEditorOpen(false); }}>{t("settings.cancel")}</button><button className="primary-button" disabled={!selectedActionValid} aria-disabled={!selectedActionValid} onClick={() => { if (!selectedActionValid) return; setEditorOpen(false); }}>{t("settings.apply")}</button></div>
      </section>}
    </div>
    <div className="settings-bottom"><span className={"save-message" + (messageIsError ? " error" : "")} role={messageIsError ? "alert" : "status"}>{busy ? t("settings.loading") : message}</span><button className="primary-button" disabled={!dirty || saving || busy} onClick={() => void save()}>▣ &nbsp;{t("settings.save")}</button></div>
  </div>;
}

function GeneralSettingsPage({ onBack, initialPage, onNavigate }: { onBack: () => void; initialPage: "general" | "quick-actions" | "notifications" | "measurement-tiles" | "weather"; onNavigate: (path: string) => void }) {
  const [page, setPage] = React.useState<"general" | "quick-actions" | "notifications" | "measurement-tiles" | "weather">(initialPage);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  React.useEffect(() => setPage(initialPage), [initialPage]);
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
      fetch("/api/settings/general").then(r => { if (!r.ok) throw new Error("settings.loadError"); return r.json() as Promise<GeneralSettings>; }),
      fetch("/api/system/status").then(r => { if (!r.ok) throw new Error("settings.statusError"); return r.json() as Promise<SystemStatus>; })
    ]).then(([prefs, system]) => {
      if (!active) return;
      setSettings(prefs); setSaved(prefs); setStatus(system);
    }).catch(error => { if (active) setMessage(error instanceof Error ? translate(locale, error.message) : translate(locale, "settings.loadDataError")); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const loadWeatherTokens = async () => {
    const response = await fetch("/api/settings/weather-tokens");
    if (!response.ok) throw new Error(t("settings.tokensLoadError"));
    const data = await response.json() as { tokens: WeatherTokenInfo[] };
    setWeatherTokens(data.tokens);
  };
  React.useEffect(() => { void loadWeatherTokens().catch(error => setTokenMessage(error instanceof Error ? error.message : t("settings.tokensLoadError"))); }, []);
  const createToken = async () => {
    setTokenBusy(true); setTokenMessage(""); setTokenCopyStatus(""); setNewToken("");
    try {
      const response = await fetch("/api/settings/weather-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: tokenName }) });
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
      const response = await fetch("/api/settings/weather-tokens/" + encodeURIComponent(id), { method: "DELETE" });
      if (!response.ok) throw new Error(t("settings.tokenRevokeError"));
      setWeatherTokens(current => current.filter(token => token.id !== id)); setTokenMessage(t("settings.tokenRevoked"));
    } catch (error) { setTokenMessage(error instanceof Error ? error.message : t("settings.tokenRevokeError")); }
    finally { setTokenBusy(false); }
  };
  const update = <K extends keyof GeneralSettings,>(key: K, value: GeneralSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  const save = async () => {
    setMessage("");
    try {
      const response = await fetch("/api/settings/general", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
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
  return <main className={"settings-shell" + (sidebarCollapsed ? " sidebar-collapsed" : "")}>
    <header className="settings-topbar">
      <button type="button" className="settings-brand" onClick={() => { if (window.matchMedia("(min-width: 701px)").matches) setSidebarCollapsed(value => !value); }} aria-label={sidebarCollapsed ? "Menu uitklappen" : "Menu inklappen"} aria-expanded={!sidebarCollapsed} aria-controls="settings-sidebar"><span className="brand-orb" /><span>Homey Dashboard</span></button><div className="topbar-spacer" /><button className="crumb-button" onClick={leave} aria-label={t("settings.back")}><span className="mdi mdi-view-dashboard-outline" aria-hidden="true" /><span>{t("settings.back")}</span></button>
    </header>
    <aside className="settings-sidebar" id="settings-sidebar">
      <h2>{t("settings.navTitle")}</h2>
      {[t("settings.general"),t("settings.quickActions"),t("settings.notifications"),t("settings.temperatureTiles"),t("settings.weather")].map((name,index)=>{
        const routes = ["/settings/general","/settings/quick-actions","/settings/notifications","/settings/measurement-tiles","/settings/weather"] as const;
        const pages = ["general","quick-actions","notifications","measurement-tiles","weather"] as const;
        const icons = ["mdi-cog-outline","mdi-flash-outline","mdi-bell-outline","mdi-thermometer","mdi-weather-partly-cloudy"];
        return <button key={name} className={"settings-nav "+(page===pages[index]?"active":"")} onClick={()=>{setPage(pages[index]);onNavigate(routes[index]);}} aria-label={name} title={sidebarCollapsed ? name : undefined}><i className={"mdi "+icons[index]} aria-hidden="true" /><span className="settings-nav-label">{name}</span></button>;
      })}
      <div className="sidebar-product"><i className="mdi mdi-information-outline" aria-hidden="true" /><span>Homey Dashboard<br/>v{status?.version ?? "0.1.0"}</span></div>
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
      </> : page === "quick-actions" || page === "measurement-tiles" ? <DashboardSettingsPage page={page} locale={locale} t={t} /> : page === "notifications" ? <NotificationSettingsPage locale={locale} /> : page === "weather" ? <WeatherSettingsPlaceholder t={t} /> : null}
    </section>
    {showLeave && <div className="modal-backdrop"><section className="leave-modal"><h2>{t("settings.unsavedTitle")}</h2><p>{t("settings.unsavedPrompt")}</p><div><button className="secondary-button" onClick={()=>setShowLeave(false)}>{t("settings.stay")}</button><button className="secondary-button" onClick={onBack}>{t("settings.discard")}</button><button className="primary-button" onClick={async()=>{await save();setShowLeave(false);onBack();}}>{t("settings.save")}</button></div></section></div>}
  </main>;
}


function WeatherSettingsPlaceholder({ t }: { t: (key: string) => string }) {
  return <div className="quick-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon">☁</div><div><h1>{t("settings.weather")}</h1><p>{t("settings.weatherPlaceholderDescription")}</p></div></div>
    <section className="settings-card system-card weather-placeholder-card">
      <h2><span className="mdi mdi-weather-partly-cloudy" aria-hidden="true" />{t("settings.weatherPlaceholderTitle")}</h2>
      <p>{t("settings.weatherPlaceholderBody")}</p>
      <ul>
        <li>{t("settings.weatherOutdoorTemperature")}</li>
        <li>{t("settings.weatherFeelsLike")}</li>
        <li>{t("settings.weatherCondition")}</li>
        <li>{t("settings.weatherWind")}</li>
        <li>{t("settings.weatherHumidity")}</li>
        <li>{t("settings.weatherRain")}</li>
        <li>{t("settings.weatherPressure")}</li>
        <li>{t("settings.weatherSunriseSunset")}</li>
      </ul>
    </section>
  </div>;
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
function TemperatureTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <article className="card temperature-tile"><MdiIcon name={icon} className="temperature-tile-icon"/><span className="temperature-label">{label}</span><strong>{value}</strong></article>;
}
void loadTranslations().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
});
