import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import * as BlocklyLibrary from "blockly/core";
import "blockly/blocks";
import * as BlocklyNl from "blockly/msg/nl";
import * as BlocklyEn from "blockly/msg/en";
import "@mdi/font/css/materialdesignicons.css";
import mdiMeta from "@mdi/svg/meta.json";
import { availableLanguages, loadTranslations, resolveLocale, translate } from "./i18n";
import { combineRootConditions, comparisonInputValue, comparisonValueFromBlockly, durationNodeFromBlockly, durationNodeToBlockly, normalizeScheduleTimeInput, sourceFromKey as resolveNotificationSourceFromKey, sourceKeyFromNode } from "./notification-condition-blockly";

type Reading = { capabilityId: string; value: unknown };
type HomeyDevice = { id: string; name?: string; zone?: string; available?: boolean; readings?: Reading[] };
type DeviceReadings = { retrievedAt: string; devices: HomeyDevice[] };
type LogicResponse = { retrievedAt: string; variables: { name: string; value: unknown }[] };
type HomeyStatus = { state: string; checkedAt: string | null; error: string | null; deviceCount?: number; zoneCount?: number };
type DashboardNotification = { id: string; title: string; notificationTitle: string; message: string; severity: "critical" | "warning" | "info"; testOnly: boolean; state: "active" | "inactive" | "unknown"; reason?: string };
type NotificationsResponse = { retrievedAt: string; notifications: DashboardNotification[]; nextEvaluationAt?: number };
type WeatherCategory = "sunny" | "mostly_sunny" | "partly_cloudy" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain" | "heavy_rain" | "showers" | "thunderstorm" | "hail" | "snow" | "snow_showers" | "sleet" | "windy" | "unknown";
type WeatherConditionResponse = { retrievedAt: string; category: WeatherCategory; conditionText: string | null; source: "api"; receivedAt?: string; reason?: string };
type DashboardWeatherValues = { settings: WeatherSettingsModel; values: Record<WeatherSettingId, { value: string | number | boolean | null; units: string; available: boolean }> };
type NotificationTimeout = "never" | "1" | "2" | "5" | "10" | "30" | "60" | "300" | "900" | "1800";
type TransientNotification = { id: string; message: string; source: "quick-action"; status: "active" | "dismissed" | "expired"; createdAt: number };
type GeneralSettings = { language: string; dateFormat: string; timeFormat: "24h" | "12h"; firstDayOfWeek: "monday" | "sunday"; notificationTimeout: NotificationTimeout };
type NotificationConfigEditor = { schemaVersion: 1; id: string; title: string; notificationTitle?: string; message: string; severity: "critical" | "warning" | "info"; enabled: boolean; testOnly?: boolean; condition: any };
type ScheduleEditorValue = { type: "schedule"; configured: false; weekdays: [] } | { type: "schedule"; weekdays: number[]; startTime: string; endTime: string; timeZone?: string };
type NotificationSourceCatalog = { retrievedAt: string; zones: { id: string; name: string; parent: string | null }[]; devices: { id: string; name: string; zone: string | null; available: boolean; capabilities: { id: string; title: string; type: "number" | "boolean" | "string"; units: string }[] }[]; variables: { id: string; name: string; type: "number" | "boolean" | "string" }[] };
type WeatherTokenInfo = { id: string; name: string; createdAt: string; lastFour: string };
type MeasurementTileSource = { type: "device"; deviceId: string; capabilityId: string } | { type: "logic"; variableId: string } | null;
type MeasurementTile = { id: string; name: string; source: MeasurementTileSource };
type MeasurementSourceCatalog = { zones: { id: string; name: string; parent: string | null }[]; devices: { id: string; name: string; zone: string | null; available: boolean; capabilities: { id: string; title: string; units: string; decimals: number | null }[] }[]; variables: { id: string; name: string; type: "number" }[] };
type MeasurementTileValue = { id: string; value: number | null; units: string; decimals: number | null; available: boolean };
type MeasurementTileResponse = { tiles: MeasurementTile[]; values: MeasurementTileValue[] };
function formatMeasurementParts(reading: MeasurementTileValue | undefined, locale: string = "nl"): { value: string; units: string } {
  if (!reading?.available || typeof reading.value !== "number" || !Number.isFinite(reading.value)) return { value: "—", units: "" };
  // Keep readings compact and consistent across dashboard and settings preview.
  const magnitude = Math.abs(reading.value);
  const decimals = magnitude >= 1000 ? 0 : Math.max(0, Math.min(3, reading.decimals ?? 1));
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  // Large readings omit their unit to preserve room for the value on tablet-sized tiles.
  const units = magnitude > 99.99 ? "" : (reading.units ?? "");
  return { value: formatter.format(reading.value), units };
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
  return typeof value === "number" && Number.isFinite(value) ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}°` : "—";
}
function App() {
  const [now, setNow] = React.useState(() => new Date());
  const [homey, setHomey] = React.useState<HomeyStatus | null>(null);
  const [dashboardLanguage, setDashboardLanguage] = React.useState("automatic");
  const [notificationTimeout, setNotificationTimeout] = React.useState<NotificationTimeout>("never");
  const [homeyLanguage, setHomeyLanguage] = React.useState<string | null>(null);
  const [readings, setReadings] = React.useState<DeviceReadings | null>(null);
  const [logic, setLogic] = React.useState<LogicResponse | null>(null);
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
  const [weatherCondition, setWeatherCondition] = React.useState<WeatherConditionResponse | null>(null);
  const [weatherValues, setWeatherValues] = React.useState<DashboardWeatherValues | null>(null);
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [measurementTileData, setMeasurementTileData] = React.useState<MeasurementTileResponse | null>(null);
  const [quickActionStatuses, setQuickActionStatuses] = React.useState<Record<string, boolean | null>>({});
  const [transientNotifications, setTransientNotifications] = React.useState<TransientNotification[]>([]);
  const notificationSequenceRef = React.useRef(0);
  const [executingAction, setExecutingAction] = React.useState("");
  const [loadError, setLoadError] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(() => window.location.pathname.startsWith("/settings"));
  const [settingsPath, setSettingsPath] = React.useState(() => window.location.pathname);
  const notificationDirtyRef = React.useRef(false);
  const currentRouteRef = React.useRef(window.location.pathname);
  const allowNextPopstateRef = React.useRef(false);
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
          setNotifications([{ id: "notifications-load-error", title: translate(resolveLocale(dashboardLanguage, homeyLanguage), "notifications.loadErrorTitle"), message: translate(resolveLocale(dashboardLanguage, homeyLanguage), "notifications.loadErrorMessage"), severity: "warning", testOnly: false, state: "unknown", reason: "source_unavailable" }]);
        });
    }, delay);
  }, [dashboardLanguage, homeyLanguage]);
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
      const [statusResponse, readingsResponse, logicResponse, weatherResponse, weatherValuesResponse, languageResponse, systemResponse] = await Promise.all([
        fetch("/api/homey/status"), fetch("/api/homey/readings"), fetch("/api/homey/logic"),
        fetch("/api/weather").catch(() => null), fetch("/api/dashboard/weather-values").catch(() => null), fetch("/api/settings/language").catch(() => null), fetch("/api/system/status").catch(() => null),
      ]);
      if (!statusResponse.ok || !readingsResponse.ok || !logicResponse.ok) throw new Error(translate(resolveLocale(dashboardLanguage, homeyLanguage), "dashboard.homeyDataUnavailable"));
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
        const preference = await languageResponse.json() as { language?: string; notificationTimeout?: NotificationTimeout };
        if (typeof preference.language === "string") setDashboardLanguage(preference.language);
        if (preference.notificationTimeout && ["never", "1", "2", "5", "10", "30", "60", "300", "900", "1800"].includes(preference.notificationTimeout)) setNotificationTimeout(preference.notificationTimeout);
      }
      if (weatherValuesResponse?.ok) setWeatherValues(await weatherValuesResponse.json() as DashboardWeatherValues);
      if (weatherResponse?.ok) {
        setWeatherCondition(await weatherResponse.json() as WeatherConditionResponse);
      } else {
        setWeatherCondition({ retrievedAt: new Date().toISOString(), category: "unknown", conditionText: null, source: "api", reason: "source_unavailable" });
      }
      setLoadError("");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "settings.loadDataError"); }
  }, [scheduleNotificationRefresh, dashboardLanguage, homeyLanguage]);
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
    try { const response = await fetch("/api/dashboard/quick-action-status"); if (!response.ok) throw new Error(t("quickActions.statusError")); const data = await response.json() as { statuses: Record<string, boolean | null> }; setQuickActionStatuses(data.statuses); } catch { /* Keep the last known Homey state when a poll temporarily fails. */ }
  };
  React.useEffect(() => {
    if (notificationTimeout === "never") return;
    const timeoutMs = Number(notificationTimeout) * 1000;
    const timers = transientNotifications
      .filter(notification => notification.status === "active")
      .map(notification => window.setTimeout(() => {
        setTransientNotifications(current => current.map(item => item.id === notification.id && item.status === "active" ? { ...item, status: "expired" } : item));
      }, Math.max(0, timeoutMs - (Date.now() - notification.createdAt))));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [transientNotifications, notificationTimeout]);
  const dismissTransientNotification = (id: string) => {
    setTransientNotifications(current => current.map(item => item.id === id && item.status === "active" ? { ...item, status: "dismissed" } : item));
  };
  const executeAction = async (id: string) => {
    if (executingAction) return;
    setExecutingAction(id);
    try {
      const response = await fetch("/api/homey/quick-actions/" + encodeURIComponent(id) + "/execute", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? t("actions.executeError"));
      await refreshQuickActionStatuses();
    } catch (error) {
      const notification: TransientNotification = { id: `action-error-${Date.now()}-${++notificationSequenceRef.current}`, message: error instanceof Error ? error.message : t("actions.executeError"), source: "quick-action", status: "active", createdAt: Date.now() };
      setTransientNotifications(current => [...current, notification].slice(-50));
    }
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
      if (allowNextPopstateRef.current) {
        allowNextPopstateRef.current = false;
      } else if (notificationDirtyRef.current) {
        const currentPath = currentRouteRef.current;
        // A popstate cannot be cancelled. Restore the current history entry,
        // ask the user, then replay the Back action only after confirmation.
        window.history.pushState({}, "", currentPath);
        const shouldLeave = window.confirm(t("notifications.discardChanges"));
        if (!shouldLeave) return;
        notificationDirtyRef.current = false;
        allowNextPopstateRef.current = true;
        window.history.back();
        return;
      }
      const currentPath = window.location.pathname;
      const canonicalPath = legacyRoutes[currentPath] ?? currentPath;
      currentRouteRef.current = canonicalPath;
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
    holdTimer.current = window.setTimeout(() => { window.history.pushState({}, "", "/settings/general"); currentRouteRef.current = "/settings/general"; setSettingsPath("/settings/general"); setSettingsOpen(true); setSettingsUnlocked(false); setPin(""); setPinError(""); }, 850);
  };
  const cancelSettingsHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  // The header indicator reflects active alert severity only. Unknown device
  // states and API errors remain visible in the panel body, never as alerts.
  const activeNotifications = notifications.filter(item => item.state === "active");
  const notificationIndicatorSeverity = activeNotifications.some(item => item.severity === "critical")
    ? "critical"
    : activeNotifications.some(item => item.severity === "warning")
      ? "warning"
      : null;
  const notificationHeadingClass = notificationIndicatorSeverity
    ? "notifications-heading has-" + notificationIndicatorSeverity
    : "notifications-heading";
  if (settingsOpen) return settingsUnlocked
    ? <GeneralSettingsPage onDirtyChange={dirty => { notificationDirtyRef.current = dirty; }} onNavigate={path => { window.history.pushState({}, "", path); currentRouteRef.current = path; setSettingsPath(path); }} onBack={() => { void fetch("/api/settings/logout", { method: "POST" }); window.history.pushState({}, "", "/"); currentRouteRef.current = "/"; setSettingsPath("/"); setSettingsOpen(false); setSettingsUnlocked(false); void refresh(); }} initialPage={settingsPath === "/settings/quick-actions" ? "quick-actions" : settingsPath === "/settings/measurement-tiles" ? "measurement-tiles" : settingsPath.startsWith("/settings/notifications") ? "notifications" : settingsPath.startsWith("/settings/weather") ? "weather" : "general"} />
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
              <div className="eyebrow">{t("weatherSettings.dashboardEyebrow")}</div>
              {weatherValues?.values.outdoorTemperature?.available && <div className="weather-temp">{formatWeatherValue(weatherValues.values.outdoorTemperature.value, weatherValues.values.outdoorTemperature.units, locale)}</div>}
              <div className="weather-description">{weatherCondition?.conditionText || (weatherCondition && weatherCondition.category !== "unknown" ? t(`weather.condition.${weatherCondition.category}`) : t("weather.condition.unknown"))}</div>
            </div>
            <WeatherIcon category={weatherCondition?.category ?? "unknown"} pack={weatherValues?.settings.iconPack ?? "animated"} />
          </div>
          <div className="weather-details">
            {(["feelsLike","humidity","pressure","windSpeed","windDirection","precipitation","sunrise","sunset"] as WeatherSettingId[]).map(id => {
              const reading = weatherValues?.values[id];
              if (!reading?.available) return null;
              return <div key={id}><span>{t("weatherSettings.field."+id)}</span><strong>{formatWeatherValue(reading.value,reading.units,locale)}</strong></div>;
            })}
          </div>
        </article>
        <section className="temperature-grid" aria-label="Temperature sensors">
          {(measurementTileData?.tiles ?? []).map(tile => {
            const reading = measurementTileData?.values.find(value => value.id === tile.id);
            const formatted = formatMeasurementParts(reading, locale);
            return <TemperatureTile key={tile.id} label={tile.name} value={formatted.value} units={formatted.units} />;
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
        {transientNotifications.some(notification => notification.status === "active") && <div className="action-error-list">
          {transientNotifications.filter(notification => notification.status === "active").map(notification => (
            <div className="action-error" role="alert" key={notification.id}>
              <span>{notification.message}</span>
              <button type="button" className="action-error-dismiss" aria-label={t("notifications.dismiss")} title={t("notifications.dismiss")} onClick={() => dismissTransientNotification(notification.id)}>×</button>
            </div>
          ))}
        </div>}
        <section className="notifications-panel" aria-label={t("notifications.aria")}>
          <div className={notificationHeadingClass}><h1>{t("notifications.heading")}</h1>{notificationIndicatorSeverity && <span className={"notification-status-indicator is-" + notificationIndicatorSeverity} role="img" aria-label={t("notifications.severity." + notificationIndicatorSeverity) + " — " + t("notifications.activeIndicator")} title={t("notifications.severity." + notificationIndicatorSeverity) + " — " + t("notifications.activeIndicator")}>!</span>}</div>
          <div className="notifications-content">
            {notifications.some((item) => item.state === "active") ? (
              <div className="notification-list">
                {notifications.filter((item) => item.state === "active").map((item) => (
                  <article className={`notification-card severity-${item.severity}`} key={item.id}>
                    <strong>{item.notificationTitle}</strong>
                    <span>{item.message}</span>
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

const initialSettings: GeneralSettings = { language: "automatic", dateFormat: "short", timeFormat: "24h", firstDayOfWeek: "monday", notificationTimeout: "never" };
function homeyLanguageName(language: string, locale: string): string { try { return new Intl.DisplayNames([locale], { type: "language" }).of(language.toLowerCase().split("-")[0]) ?? language.toUpperCase(); } catch { return language.toUpperCase(); } }

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
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [zoneId, setZoneId] = React.useState("");
  const [deviceId, setDeviceId] = React.useState("");
  const [sourceType, setSourceType] = React.useState<"device" | "logic">("device");
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isError, setIsError] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<MeasurementTileResponse | null>(null);
  const dirty = JSON.stringify(tiles) !== JSON.stringify(saved);
  const selected = tiles.find(tile => tile.id === selectedId) ?? tiles[0];
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/measurement-tiles").then(async r => { if (!r.ok) throw new Error(t("measurement.loadTilesError")); return r.json() as Promise<{ tiles: MeasurementTile[] }>; }),
      fetch("/api/settings/measurement-sources").then(async r => { if (!r.ok) throw new Error(t("measurement.loadSourcesError")); return r.json() as Promise<MeasurementSourceCatalog>; }),
    ]).then(([config, sources]) => { if (!active) return; setTiles(config.tiles); setSaved(config.tiles); setCatalog(sources); })
      .catch(error => { if (active) { setMessage(error instanceof Error ? error.message : t("measurement.loadError")); setIsError(true); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    let active = true;
    const poll = () => fetch("/api/dashboard/measurement-tiles")
      .then(async response => { if (!response.ok) throw new Error(t("measurement.unavailable")); return response.json() as Promise<MeasurementTileResponse>; })
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
    if (!tile.source) return t("measurement.noSource");
    if (tile.source.type === "logic") return catalog.variables.find(variable => variable.id === tile.source?.variableId)?.name ?? t("measurement.logicVariable");
    const device = catalog.devices.find(item => item.id === tile.source?.deviceId);
    const capability = device?.capabilities.find(item => item.id === tile.source?.capabilityId);
    return [device?.name, capability?.title].filter(Boolean).join(" · ") || t("measurement.deviceSource");
  };
  const save = async () => {
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch("/api/settings/measurement-tiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tiles }) });
      const result = await response.json() as { tiles?: MeasurementTile[]; error?: string };
      if (!response.ok || !result.tiles) throw new Error(result.error ?? t("settings.saveError"));
      setTiles(result.tiles); setSaved(result.tiles); setMessage(t("measurement.saved"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("settings.saveError")); setIsError(true); }
    finally { setSaving(false); }
  };
  return <div className="quick-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon">♙</div><div><h1>{t("settings.temperatureTiles")}</h1><p>{t("measurement.configureIntro")}</p></div></div>
    <div className="quick-workspace measurement-workspace">
      <section className="settings-card quick-list-card measurement-list-card">
        <h2><span>♙</span>{t("measurement.heading")}</h2>
        <p className="quick-card-description">{t("measurement.configureDescription")}</p>
        <div className="quick-action-list measurement-tile-list">
          {tiles.map((tile, index) => <button type="button" key={tile.id} className={"quick-action-row" + (tile.id === selectedId ? " selected" : "")} onClick={() => { setSelectedId(tile.id); setEditorOpen(true); }}>
            <span className="quick-action-number">{index + 1}</span><span className="quick-action-name">{tile.name || "Tegel"}</span><span className="quick-action-edit">✎</span>
          </button>)}
        </div>
        <div className="quick-info">ⓘ <span>{t("measurement.selectHint")}</span></div>
      </section>
      <section className="settings-card quick-preview-card">
        <h2><span>◎</span>{t("settings.preview")}</h2>
        <p className="quick-card-description">{t("measurement.previewDescription")}</p>
        <div className="quick-preview-grid measurement-preview-grid">
          {tiles.map(tile => {
            const reading = previewData?.values.find(item => item.id === tile.id);
            const formatted = formatMeasurementParts(reading);
            return <div className="quick-preview-item measurement-preview-item" key={tile.id}>
              <TemperatureTile label={tile.name || "Tegel"} value={formatted.value} units={formatted.units} className="measurement-preview-dashboard-tile"/>
              <small>{sourceDescription(tile)}</small>
            </div>;
          })}
        </div>
      </section>
    </div>
    {editorOpen && selected && <section className="settings-card quick-editor-card measurement-editor-card">
        <button className="quick-editor-close" onClick={() => setEditorOpen(false)} aria-label={t("settings.close")}>×</button>
        <h2>{t("measurement.editTitle").replace("{number}", String(tiles.findIndex(tile => tile.id === selected.id) + 1))}</h2>
        <div className="measurement-inline-editor">
          <label>{t("measurement.name")}<input maxLength={32} value={selected.name} onChange={event => update({ name: event.target.value })}/></label>
          <div className="measurement-source-types"><button type="button" className={sourceType === "device" ? "active" : ""} onClick={() => setSourceType("device")}>{t("measurement.device")}</button><button type="button" className={sourceType === "logic" ? "active" : ""} onClick={() => setSourceType("logic")}>{t("measurement.homeyLogic")}</button></div>
          {sourceType === "device" ? <>
            <label>{t("measurement.room")}<select value={zoneId} onChange={event => { setZoneId(event.target.value); setDeviceId(""); }}><option value="">{t("measurement.selectRoom")}</option>{catalog.zones.map(zone => <option key={zone.id} value={zone.id}>{zonePath(zone.id)}</option>)}</select></label>
            <label>{t("measurement.device")}<select value={deviceId} onChange={event => setDeviceId(event.target.value)}><option value="">{t("measurement.selectDevice")}</option>{devices.map(device => <option key={device.id} value={device.id}>{device.name}{device.available ? "" : " (offline)"}</option>)}</select></label>
            <label>{t("measurement.value")}<select disabled={!chosenDevice} value={selected.source?.type === "device" && selected.source.deviceId === deviceId ? selected.source.capabilityId : ""} onChange={event => update({ source: event.target.value ? { type: "device", deviceId, capabilityId: event.target.value } : null })}><option value="">{t("measurement.selectNumericValue")}</option>{chosenDevice?.capabilities.map(cap => <option key={cap.id} value={cap.id}>{cap.title}{cap.units ? " (" + cap.units + ")" : ""}</option>)}</select></label>
          </> : <label>{t("measurement.numericLogicVariable")}<select value={selected.source?.type === "logic" ? selected.source.variableId : ""} onChange={event => update({ source: event.target.value ? { type: "logic", variableId: event.target.value } : null })}><option value="">{t("measurement.selectLogicVariable")}</option>{catalog.variables.map(variable => <option key={variable.id} value={variable.id}>{variable.name}</option>)}</select></label>}
          <p className="measurement-source-note">{t("measurement.sourceNote")}</p>
        </div>
    </section>}
    <div className="settings-bottom"><span className={"save-message" + (isError ? " error" : "")} role={isError ? "alert" : "status"}>{busy ? t("measurement.loading") : message}</span><button className="primary-button" disabled={!dirty || saving || busy || tiles.some(tile => !tile.name.trim())} onClick={() => void save()}>{saving ? t("measurement.saving") : "▣  " + t("measurement.save")}</button></div>
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
      : ["equals", "notEquals"].includes(comparison?.operator) && typeof comparison?.value === source.expectedType;
    const fallback = source.expectedType === "number"
      ? { operator: "equals", value: 0 }
      : source.expectedType === "string" ? { operator: "equals", value: "" } : { operator: "equals", value: false };
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
function findMissingNotificationSources(condition: any, catalog: NotificationSourceCatalog | null, locale: string): string[] {
  if (!catalog || !condition) return [];
  const missing = new Set<string>();
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "comparison") {
      const source = node.source;
      if (source?.type === "device-capability") {
        const device = catalog.devices.find(item => item.id === source.deviceId);
        if (!device) missing.add(translate(locale, "measurement.deviceNotFound").replace("{id}", source.deviceId));
        else {
          const capability = device.capabilities.find(item => item.id === source.capabilityId);
          if (!capability) missing.add(translate(locale, "measurement.capabilityMissing").replace("{capability}", source.capabilityId).replace("{device}", device.name));
          else if (!device.available) missing.add(translate(locale, "measurement.deviceUnavailable").replace("{device}", device.name));
        }
      } else if (source?.type === "logic-variable") {
        if (!catalog.variables.some(item => item.id === source.variableId)) missing.add(translate(locale, "measurement.logicVariableNotFound").replace("{id}", source.variableId));
      } else {
        missing.add(translate(locale, "measurement.incompleteSource"));
      }
    }
    if (Array.isArray(node.conditions)) node.conditions.forEach(visit);
    if (node.condition) visit(node.condition);
  };
  visit(condition);
  return [...missing];
}
function ScheduleBlocklyEditor({ condition, schedule, onChange, onConditionChange, notificationTitle, notificationMessage, onContentChange, locale, sourceCatalog, sourceKey, onSourceChange, comparison, onComparisonChange }: { condition: any; schedule: any; onChange: (value: ScheduleEditorValue) => void; onConditionChange: (value: any) => void; notificationTitle: string; notificationMessage: string; onContentChange: (value: { notificationTitle: string; message: string }) => void; locale: string; sourceCatalog: NotificationSourceCatalog | null; sourceKey: string; onSourceChange: (key: string) => void; comparison: any; onComparisonChange: (operator: string, value: boolean | number | string) => void }) {
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
  const contentChangeRef = React.useRef(onContentChange);
  const notificationTitleRef = React.useRef(notificationTitle);
  const notificationMessageRef = React.useRef(notificationMessage);
  changeRef.current = onChange;
  sourceChangeRef.current = onSourceChange;
  catalogRef.current = sourceCatalog;
  sourceKeyRef.current = sourceKey;
  comparisonRef.current = comparison;
  comparisonChangeRef.current = onComparisonChange;
  conditionChangeRef.current = onConditionChange;
  contentChangeRef.current = onContentChange;
  notificationTitleRef.current = notificationTitle;
  notificationMessageRef.current = notificationMessage;
  React.useEffect(() => {
    const Blockly: any = BlocklyLibrary;
    // Blockly core imports do not automatically populate its message table. Context-menu labels require these translations.
    Blockly.setLocale(locale.toLowerCase().startsWith("nl") ? BlocklyNl : BlocklyEn);
    if (!host.current) { setBlocklyUnavailable(true); return; }
    const days: Array<[number, string]> = [[1,"MON"],[2,"TUE"],[3,"WED"],[4,"THU"],[5,"FRI"],[6,"SAT"],[0,"SUN"]];
    if (!Blockly.Blocks.schedule_active) {
      Blockly.Blocks.schedule_active = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "notifications.blockTitle"));
          const labels = [[translate(locale, "blockly.shortMonday"),"MON"],[translate(locale, "blockly.shortTuesday"),"TUE"],[translate(locale, "blockly.shortWednesday"),"WED"],[translate(locale, "blockly.shortThursday"),"THU"],[translate(locale, "blockly.shortFriday"),"FRI"],[translate(locale, "blockly.shortSaturday"),"SAT"],[translate(locale, "blockly.shortSunday"),"SUN"]];
          const row = this.appendDummyInput().appendField(translate(locale, "notifications.days"));
          labels.forEach(([label, key]) => row.appendField(new Blockly.FieldCheckbox("FALSE"), key).appendField(label));
          this.appendDummyInput().appendField(translate(locale, "notifications.from")).appendField(new Blockly.FieldTextInput("07:00"), "START").appendField(translate(locale, "notifications.until")).appendField(new Blockly.FieldTextInput("22:00"), "END");
          this.setOutput(true, "Boolean"); this.setColour(210);
        }
      };
    }
    class SearchableSourceDropdown extends Blockly.FieldDropdown {
      showEditor_() {
        const dropdown = Blockly.DropDownDiv;
        const content = dropdown.getContentDiv();
        content.replaceChildren();
        const wrapper = document.createElement('div');
        wrapper.className = 'notification-source-dropdown';
        const searchWrap = document.createElement('div');
        searchWrap.className = 'notification-source-dropdown-search';
        const icon = document.createElement('span');
        icon.textContent = '⌕';
        icon.setAttribute('aria-hidden', 'true');
        const search = document.createElement('input');
        search.type = 'search';
        search.autocomplete = 'off';
        search.placeholder = translate(locale, "blockly.searchSourcePlaceholder");
        search.setAttribute('aria-label', translate(locale, "blockly.searchSourceLabel"));
        searchWrap.append(icon, search);
        const results = document.createElement('div');
        results.className = 'notification-source-dropdown-results';
        results.setAttribute('role', 'listbox');
        const footer = document.createElement('div');
        footer.className = 'notification-source-dropdown-footer';
        wrapper.append(searchWrap, results, footer);
        content.appendChild(wrapper);
        dropdown.setColour('#172b40', '#344a60');
        const renderOptions = () => {
          const query = search.value.trim().toLocaleLowerCase();
          const options = this.getOptions(false).filter((option: [string, string]) => !query || (String(option[0]) + ' ' + option[1]).toLocaleLowerCase().includes(query));
          results.replaceChildren();
          options.forEach((option: [string, string]) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'notification-source-dropdown-option' + (option[1] === this.getValue() ? ' selected' : '');
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', option[1] === this.getValue() ? 'true' : 'false');
            item.textContent = option[0];
            item.addEventListener('mousedown', event => event.preventDefault());
            item.addEventListener('click', () => {
              this.setValue(option[1]);
              // A custom FieldDropdown does not reliably produce the same
              // BLOCK_FIELD_CHANGED sequence as Blockly's native dropdown.
              // Synchronize the comparison controls directly on selection so
              // a numeric source can never retain a boolean true/false field.
              const sourceBlock = this.getSourceBlock?.();
              if (sourceBlock?.type === "homey_condition_device_source" || sourceBlock?.type === "homey_condition_logic_source") {
                const selectedSource = resolveNotificationSourceFromKey(option[1], catalogRef.current);
                if (selectedSource) {
                  const allowedOperators = selectedSource.expectedType === "number"
                    ? ["equals", "notEquals", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"]
                    : ["equals", "notEquals"];
                  if (!allowedOperators.includes(sourceBlock.getFieldValue("OP"))) sourceBlock.setFieldValue("equals", "OP");
                  const operatorField = sourceBlock.getField("OP");
                  if (operatorField && typeof operatorField.getOptions === "function") operatorField.getOptions(false);
                  replaceComparisonValueField(sourceBlock, selectedSource.expectedType, String(sourceBlock.getFieldValue("VALUE") ?? ""));
                }
              }
              dropdown.hideIfOwner(this);
            });
            results.appendChild(item);
          });
          // The selected option is scrolled into view after the dropdown has
          // been laid out. Scrolling here is too early: Blockly has not shown
          // its DropDownDiv yet, so the browser can leave the list at scrollTop 0.
          if (!options.length) {
            const empty = document.createElement('div');
            empty.className = 'notification-source-dropdown-empty';
            empty.textContent = translate(locale, "blockly.noHomeySources");
            results.appendChild(empty);
          }
          footer.textContent = options.length + " " + translate(locale, options.length === 1 ? "blockly.result" : "blockly.results");
        };
        const scrollSelectedOptionIntoView = () => {
          window.requestAnimationFrame(() => {
            const selectedItem = results.querySelector('.notification-source-dropdown-option.selected') as HTMLButtonElement | null;
            if (!selectedItem) return;
            const resultsRect = results.getBoundingClientRect();
            const selectedRect = selectedItem.getBoundingClientRect();
            // Adjust only the results pane; never scroll the Blockly workspace
            // or the page surrounding the DropDownDiv.
            if (selectedRect.top < resultsRect.top) {
              results.scrollTop -= resultsRect.top - selectedRect.top;
            } else if (selectedRect.bottom > resultsRect.bottom) {
              results.scrollTop += selectedRect.bottom - resultsRect.bottom;
            }
          });
        };
        search.addEventListener('input', () => {
          renderOptions();
          scrollSelectedOptionIntoView();
        });
        renderOptions();
        dropdown.showPositionedByField(this, () => {});
        search.focus();
        // Wait until Blockly has made the dropdown visible and the results
        // pane has its final dimensions before calculating the scroll offset.
        scrollSelectedOptionIntoView();
      }
    }
    if (!Blockly.Blocks.homey_notification_source) {
      Blockly.Blocks.homey_notification_source = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "blockly.homeySource")).appendField(new SearchableSourceDropdown(() => {
            const catalog = catalogRef.current;
            const options: Array<[string, string]> = [[translate(locale, "blockly.selectSourceOption"), ""]];
            (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title + (capability.units ? " (" + capability.units + ")" : ""), "device:" + device.id + ":" + capability.id])));
            (catalog?.variables ?? []).forEach(variable => options.push(["Logic · " + variable.name, "logic:" + variable.id]));
            return options;
          }, (value: string) => { if (value) sourceChangeRef.current(value); return value; }), "SOURCE");
          this.setOutput(true, "HomeySource"); this.setColour(285);
          this.setTooltip(translate(locale, "blockly.selectSourceTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_comparison) {
      Blockly.Blocks.homey_notification_comparison = {
        init() {
          this.appendValueInput("SOURCE").setCheck("HomeySource").appendField(translate(locale, "blockly.comparison"));
          this.appendDummyInput().appendField(new Blockly.FieldDropdown(() => {
            const numeric = comparisonRef.current?.source?.expectedType === "number";
            return numeric
              ? [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"],[translate(locale, "blockly.lessThan"),"lessThan"],[translate(locale, "blockly.lessThanOrEqual"),"lessThanOrEqual"],[translate(locale, "blockly.greaterThan"),"greaterThan"],[translate(locale, "blockly.greaterThanOrEqual"),"greaterThanOrEqual"]]
              : [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"]];
          }, (value: string) => { const current = comparisonRef.current; const nextValue = ["lessThan","lessThanOrEqual","greaterThan","greaterThanOrEqual"].includes(value) ? (typeof current?.condition?.value === "number" ? current.condition.value : 0) : (typeof current?.condition?.value === "string" ? current.condition.value : typeof current?.condition?.value === "boolean" ? current.condition.value : false); comparisonChangeRef.current(value, nextValue); return value; }), "OP");
          this.appendDummyInput().appendField(translate(locale, "blockly.value")).appendField(new Blockly.FieldTextInput(String(comparisonRef.current?.condition?.value ?? false)), "VALUE");
          this.setOutput(true, "Boolean"); this.setColour(165);
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_duration_active) {
      Blockly.Blocks.homey_notification_duration_active = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "blockly.for")).appendField(new Blockly.FieldNumber(5, 1, 1440, 1), "MINUTES").appendField(translate(locale, "blockly.activeMinutes"));
          this.appendStatementInput("CONDITION").appendField(translate(locale, "blockly.condition"));
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30);
          this.setTooltip(translate(locale, "blockly.activeDurationTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_duration_inactive) {
      Blockly.Blocks.homey_notification_duration_inactive = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "blockly.for")).appendField(new Blockly.FieldNumber(5, 1, 1440, 1), "MINUTES").appendField(translate(locale, "blockly.inactiveMinutes"));
          this.appendStatementInput("CONDITION").appendField(translate(locale, "blockly.condition"));
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30);
          this.setTooltip(translate(locale, "blockly.inactiveDurationTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_condition_statement) {
      Blockly.Blocks.homey_notification_condition_statement = {
        init() {
          this.appendDummyInput().appendField(translate(locale, "blockly.if")).appendField(new SearchableSourceDropdown(() => {
            const catalog = catalogRef.current;
            const options: Array<[string, string]> = [[translate(locale, "blockly.selectHomeySourceOption"), ""]];
            (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title, "device:" + device.id + ":" + capability.id])));
            (catalog?.variables ?? []).forEach(variable => options.push(["Logic · " + variable.name, "logic:" + variable.id]));
            return options;
          }, (value: string) => { if (value) sourceChangeRef.current(value); return value; }), "SOURCE");
          this.appendDummyInput().appendField(new Blockly.FieldDropdown(() => {
            const numeric = comparisonRef.current?.source?.expectedType === "number";
            return numeric
              ? [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"],[translate(locale, "blockly.lessThan"),"lessThan"],[translate(locale, "blockly.lessThanOrEqual"),"lessThanOrEqual"],[translate(locale, "blockly.greaterThan"),"greaterThan"],[translate(locale, "blockly.greaterThanOrEqual"),"greaterThanOrEqual"]]
              : [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"]];
          }, (value: string) => {
            const current = comparisonRef.current;
            const numeric = ["lessThan","lessThanOrEqual","greaterThan","greaterThanOrEqual"].includes(value) || current?.source?.expectedType === "number";
            comparisonChangeRef.current(value, numeric ? (typeof current?.condition?.value === "number" ? current.condition.value : 0) : (typeof current?.condition?.value === "boolean" ? current.condition.value : false));
            return value;
          }), "OP").appendField(new Blockly.FieldTextInput(String(comparisonRef.current?.condition?.value ?? false), (value: string) => {
            const expectedType = comparisonRef.current?.source?.expectedType ?? "boolean";
            const parsed = expectedType === "number" ? Number(value) : expectedType === "boolean" ? value.toLowerCase() === "true" : value;
            if (expectedType !== "number" || Number.isFinite(parsed as number)) comparisonChangeRef.current(comparisonRef.current?.condition?.operator ?? "equals", parsed as boolean | number | string);
            return value;
          }), "VALUE");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(165);
          this.setTooltip(translate(locale, "blockly.compareSourceTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_and) {
      Blockly.Blocks.homey_notification_logic_and = {
        init() {
          this.appendValueInput("A").setCheck("Boolean").appendField(translate(locale, "blockly.andUpper"));
          this.appendValueInput("B").setCheck("Boolean").appendField(translate(locale, "blockly.andLower"));
          this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip(translate(locale, "blockly.andTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_or) {
      Blockly.Blocks.homey_notification_logic_or = {
        init() {
          this.appendValueInput("A").setCheck("Boolean").appendField(translate(locale, "blockly.orUpper"));
          this.appendValueInput("B").setCheck("Boolean").appendField(translate(locale, "blockly.orLower"));
          this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip(translate(locale, "blockly.orTooltip"));
        }
      };
    }
    if (!Blockly.Blocks.homey_notification_logic_not) {
      Blockly.Blocks.homey_notification_logic_not = {
        init() {
          this.appendValueInput("CONDITION").setCheck("Boolean").appendField(translate(locale, "blockly.notUpper"));
          this.setOutput(true, "Boolean"); this.setColour(120);
          this.setTooltip(translate(locale, "blockly.notTooltip"));
        }
      };
    }
    const sourceOptions = (kind: "device" | "logic"): Array<[string,string]> => {
      const catalog = catalogRef.current;
      if (kind === "device") {
        const options: Array<[string,string]> = [];
        (catalog?.devices ?? []).forEach(device => device.capabilities.forEach(capability => options.push([device.name + " · " + capability.title + (capability.units ? " (" + capability.units + ")" : ""), "device:" + device.id + ":" + capability.id])));
        return options.length ? options : [[translate(locale, "blockly.noDeviceSources"), ""]];
      }
      const options: Array<[string,string]> = [];
      (catalog?.variables ?? []).forEach(variable => options.push([variable.name, "logic:" + variable.id]));
      return options.length ? options : [[translate(locale, "blockly.noLogicVariables"), ""]];
    };
    const comparisonOptions = (block: any): Array<[string, string]> => {
      const source = resolveNotificationSourceFromKey(block.getFieldValue("SOURCE"), catalogRef.current);
      return source?.expectedType === "number"
        ? [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"],[translate(locale, "blockly.lessThan"),"lessThan"],[translate(locale, "blockly.lessThanOrEqual"),"lessThanOrEqual"],[translate(locale, "blockly.greaterThan"),"greaterThan"],[translate(locale, "blockly.greaterThanOrEqual"),"greaterThanOrEqual"]]
        : [[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"]];
    };
    const makeComparisonValueField = (expectedType: "number" | "boolean" | "string", rawValue: string) => {
      const normalized = comparisonInputValue(expectedType, rawValue);
      if (expectedType === "string") return new Blockly.FieldTextInput(String(normalized === "true" || normalized === "false" || normalized === "" ? translate(locale, "notifications.textComparisonDefault") : normalized));
      if (expectedType === "boolean") {
        const field = new Blockly.FieldDropdown([["false", "false"], ["true", "true"]]);
        field.setValue(String(normalized));
        return field;
      }
      return new Blockly.FieldNumber(Number(normalized));
    };
    const replaceComparisonValueField = (block: any, expectedType: "number" | "boolean" | "string", rawValue: string) => {
      const input = block.getInput("SOURCE_FIELDS");
      if (!input) return;
      input.removeField("VALUE");
      input.appendField(makeComparisonValueField(expectedType, rawValue), "VALUE");
    };
    const defineSourceBlock = (type: "device" | "logic") => ({
      init(this: any) {
        const block = this;
        const initialSource = resolveNotificationSourceFromKey(sourceOptions(type)[0]?.[1] ?? "", catalogRef.current);
        this.appendDummyInput("SOURCE_FIELDS")
          .appendField(type === "device" ? translate(locale, "blockly.homeyDevice") : translate(locale, "blockly.homeyLogicVariable"))
          .appendField(new SearchableSourceDropdown(() => sourceOptions(type)), "SOURCE")
          .appendField(new Blockly.FieldDropdown(() => comparisonOptions(block)), "OP")
          .appendField(makeComparisonValueField(initialSource?.expectedType ?? "number", initialSource?.expectedType === "boolean" ? "false" : initialSource?.expectedType === "string" ? translate(locale, "notifications.textComparisonDefault") : "0"), "VALUE");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(285);
        this.setOnChange((event: any) => {
          if (event.type !== Blockly.Events.BLOCK_FIELD_CHANGED || event.blockId !== block.id || event.name !== "SOURCE") return;
          const source = resolveNotificationSourceFromKey(block.getFieldValue("SOURCE"), catalogRef.current);
          if (!source) return;
          if (!comparisonOptions(block).some(([, operator]) => operator === block.getFieldValue("OP"))) block.setFieldValue("equals", "OP");
          const previousSource = resolveNotificationSourceFromKey(event.oldValue ?? "", catalogRef.current);
          const currentValue = String(block.getFieldValue("VALUE") ?? "");
          const nextValue = source.expectedType === "string" && previousSource?.expectedType !== "string"
            ? translate(locale, "notifications.textComparisonDefault")
            : currentValue;
          replaceComparisonValueField(block, source.expectedType, nextValue);
        });
        this.setTooltip(translate(locale, "blockly.compareSourceDescription"));
      }
    });
    if (!Blockly.Blocks.homey_condition_device_source) Blockly.Blocks.homey_condition_device_source = defineSourceBlock("device");
    if (!Blockly.Blocks.homey_condition_logic_source) Blockly.Blocks.homey_condition_logic_source = defineSourceBlock("logic");
    if (!Blockly.Blocks.homey_condition_comparison) Blockly.Blocks.homey_condition_comparison = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.comparison")).appendField(new Blockly.FieldDropdown([[translate(locale, "blockly.equals"),"equals"],[translate(locale, "blockly.notEquals"),"notEquals"],[translate(locale, "blockly.lessThan"),"lessThan"],[translate(locale, "blockly.lessThanOrEqual"),"lessThanOrEqual"],[translate(locale, "blockly.greaterThan"),"greaterThan"],[translate(locale, "blockly.greaterThanOrEqual"),"greaterThanOrEqual"]]), "OP");
        this.appendDummyInput().appendField(translate(locale, "blockly.value")).appendField(new Blockly.FieldTextInput("false"), "VALUE");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(165);
      }
    };
    if (!Blockly.Blocks.homey_condition_schedule) Blockly.Blocks.homey_condition_schedule = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.scheduleActive"));
        const labels = [[translate(locale, "blockly.shortMonday"),"MON"],[translate(locale, "blockly.shortTuesday"),"TUE"],[translate(locale, "blockly.shortWednesday"),"WED"],[translate(locale, "blockly.shortThursday"),"THU"],[translate(locale, "blockly.shortFriday"),"FRI"],[translate(locale, "blockly.shortSaturday"),"SAT"],[translate(locale, "blockly.shortSunday"),"SUN"]];
        const row = this.appendDummyInput().appendField(translate(locale, "blockly.days"));
        labels.forEach(([label,key]) => row.appendField(new Blockly.FieldCheckbox("FALSE"), key).appendField(label));
        this.appendDummyInput().appendField(translate(locale, "blockly.from")).appendField(new Blockly.FieldTextInput("07:00", normalizeScheduleTimeInput), "START").appendField(translate(locale, "blockly.until")).appendField(new Blockly.FieldTextInput("22:00", normalizeScheduleTimeInput), "END");
        this.appendStatementInput("CONDITIONS").appendField(translate(locale, "blockly.onlyWhen"));
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(265);
        this.setTooltip(translate(locale, "blockly.scheduleTooltip"));
      }
    };
    if (!Blockly.Blocks.homey_condition_weekday) Blockly.Blocks.homey_condition_weekday = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.weekday")).appendField(new Blockly.FieldDropdown([[translate(locale, "blockly.weekdayMonday"),"1"],[translate(locale, "blockly.weekdayTuesday"),"2"],[translate(locale, "blockly.weekdayWednesday"),"3"],[translate(locale, "blockly.weekdayThursday"),"4"],[translate(locale, "blockly.weekdayFriday"),"5"],[translate(locale, "blockly.weekdaySaturday"),"6"],[translate(locale, "blockly.weekdaySunday"),"0"]]), "DAY");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(210);
      }
    };
    if (!Blockly.Blocks.homey_condition_time_only) Blockly.Blocks.homey_condition_time_only = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.timeBetween"))
          .appendField(new Blockly.FieldTextInput("07:00", normalizeScheduleTimeInput), "START")
          .appendField(translate(locale, "blockly.andLower"))
          .appendField(new Blockly.FieldTextInput("22:00", normalizeScheduleTimeInput), "END");
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(265);
        this.setTooltip(translate(locale, "blockly.timeOnlyTooltip"));
      }
    };
    if (!Blockly.Blocks.homey_condition_weekdays) Blockly.Blocks.homey_condition_weekdays = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.weekdays"));
        const labels = [[translate(locale, "blockly.shortMonday"),"MON"],[translate(locale, "blockly.shortTuesday"),"TUE"],[translate(locale, "blockly.shortWednesday"),"WED"],[translate(locale, "blockly.shortThursday"),"THU"],[translate(locale, "blockly.shortFriday"),"FRI"],[translate(locale, "blockly.shortSaturday"),"SAT"],[translate(locale, "blockly.shortSunday"),"SUN"]];
        const row = this.appendDummyInput();
        labels.forEach(([label, key]) => row.appendField(new Blockly.FieldCheckbox("FALSE"), key).appendField(label));
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(210);
        this.setTooltip(translate(locale, "blockly.weekdaysTooltip"));
      }
    };
    for (const type of ["and","or"]) {
      const blockType = "homey_condition_" + type;
      if (!Blockly.Blocks[blockType]) Blockly.Blocks[blockType] = {
        init() {
          this.appendDummyInput().appendField(type === "and" ? translate(locale, "blockly.andUpper") : translate(locale, "blockly.orUpper"));
          this.appendStatementInput("CONDITIONS");
          this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(120);
          this.setTooltip(type === "and" ? translate(locale, "blockly.allConditions") : translate(locale, "blockly.atLeastOneCondition"));
        }
      };
    }
    if (!Blockly.Blocks.homey_condition_not) Blockly.Blocks.homey_condition_not = {
      init() { this.appendDummyInput().appendField(translate(locale, "blockly.notUpper")); this.appendStatementInput("CONDITION"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(120); }
    };
    if (!Blockly.Blocks.homey_condition_unsupported) Blockly.Blocks.homey_condition_unsupported = {
      init() {
        this.appendDummyInput().appendField(translate(locale, "blockly.unsupported"));
        this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(0);
        this.setTooltip(translate(locale, "blockly.unsupportedTooltip"));
      }
    };
    if (!Blockly.Blocks.homey_condition_duration_inactive) Blockly.Blocks.homey_condition_duration_inactive = {
      init() { this.appendDummyInput().appendField(translate(locale, "blockly.for")).appendField(new Blockly.FieldNumber(5,1,1440,1),"MINUTES").appendField(translate(locale, "blockly.inactiveMinutes")); this.appendStatementInput("CONDITION").appendField(translate(locale, "blockly.condition")); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30); }
    };
    if (!Blockly.Blocks.homey_condition_duration) Blockly.Blocks.homey_condition_duration = {
      init() { this.appendDummyInput().appendField(translate(locale, "blockly.for")).appendField(new Blockly.FieldNumber(5,1,1440,1),"MINUTES").appendField(translate(locale, "blockly.activeMinutes")); this.appendStatementInput("CONDITION").appendField(translate(locale, "blockly.condition")); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(30); }
    };
    // Re-register this fixed root block on editor mount so its labels follow
    // the selected UI language. User-entered title and message remain literal.
    Blockly.Blocks.homey_notification_root = {
      init() {
        this.appendDummyInput("NOTIFICATION_TITLE")
          .appendField(translate(locale, "notifications.blockNotificationTitle"))
          .appendField(new Blockly.FieldTextInput(notificationTitleRef.current), "NOTIFICATION_TITLE");
        this.appendDummyInput("NOTIFICATION_MESSAGE")
          .appendField(translate(locale, "notifications.blockNotificationMessage"))
          .appendField(new Blockly.FieldTextInput(notificationMessageRef.current), "NOTIFICATION_MESSAGE");
        this.appendStatementInput("CONDITIONS");
        this.appendDummyInput("FOOTER").appendField(translate(locale, "blockly.notificationRoot"));
        this.setColour(285);
        this.setTooltip(translate(locale, "notifications.blockHelp"));
        // This is the single fixed root block for the notification workspace.
        this.setMovable(false);
        this.setDeletable(false);
      }
    };
    const toolbox = {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: translate(locale, "blockly.toolboxConditions"),
          categorystyle: "logic_category",
          contents: [
            { kind: "block", type: "homey_condition_device_source" },
            { kind: "block", type: "homey_condition_logic_source" },
          ]
        },
        {
          kind: "category",
          name: translate(locale, "blockly.containers"),
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
            { kind: "block", type: "homey_condition_weekdays" },
            { kind: "block", type: "homey_condition_time_only" },
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
          // Set the value field explicitly from the resolved source datatype.
          // Do not rely on the asynchronous Blockly change event during hydration:
          // it can otherwise leave a boolean dropdown holding an old numeric value.
          replaceComparisonValueField(candidate, resolvedSource.expectedType, String(node.condition?.value ?? ""));
          // Refresh Blockly's cached dynamic dropdown options after SOURCE changes.
          const operatorField = candidate.getField("OP");
          if (operatorField && typeof operatorField.getOptions === "function") operatorField.getOptions(false);
          const operator = node.condition?.operator ?? "equals";
          if (!comparisonOptions(candidate).some(([, option]) => option === operator)) {
            candidate.dispose();
            block = ws.newBlock("homey_condition_unsupported");
            block.data = JSON.stringify(node);
          } else {
            candidate.setFieldValue(operator, "OP");
            block = candidate;
          }
        }
      } else if (node.type === "schedule" && node.mode === "time-only") {
        block = ws.newBlock("homey_condition_time_only");
        block.setFieldValue(normalizeScheduleTimeInput(node.startTime ?? "07:00"), "START");
        block.setFieldValue(normalizeScheduleTimeInput(node.endTime ?? "22:00"), "END");
      } else if (node.type === "schedule") {
        block = ws.newBlock("homey_condition_schedule");
        days.forEach(([day, field]) => block.setFieldValue(node.weekdays?.includes(day) ? "TRUE" : "FALSE", field));
        if (node.startTime) block.setFieldValue(normalizeScheduleTimeInput(node.startTime), "START");
        if (node.endTime) block.setFieldValue(normalizeScheduleTimeInput(node.endTime), "END");
      } else if (node.type === "weekday" && node.weekdays?.length > 1) {
        block = ws.newBlock("homey_condition_weekdays");
        days.forEach(([day, field]) => block.setFieldValue(node.weekdays.includes(day) ? "TRUE" : "FALSE", field));
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
        if (!source) throw new Error(translate(locale, "blockly.selectValidSource"));
        const operator = block.getFieldValue("OP");
        const value = comparisonValueFromBlockly(source, operator, block.getFieldValue("VALUE"));
        return { type: "comparison", source, condition: { operator, value } };
      }
      if (block.type === "homey_condition_schedule") {
        const weekdays = days.filter(([day, field]) => block.getFieldValue(field) === "TRUE").map(([day]) => day);
        const schedule = weekdays.length
          ? { type: "schedule", weekdays, startTime: normalizeScheduleTimeInput(block.getFieldValue("START")), endTime: normalizeScheduleTimeInput(block.getFieldValue("END")), timeZone: "Europe/Amsterdam" }
          : { type: "schedule", configured: false, weekdays: [] };
        const children = serializeChain(block.getInputTargetBlock("CONDITIONS"));
        return children.length ? { operator: "and", conditions: [schedule, ...children] } : schedule;
      }
      if (block.type === "homey_condition_weekday") return { type: "weekday", weekdays: [Number(block.getFieldValue("DAY"))] };
      if (block.type === "homey_condition_weekdays") {
        const weekdays = days.filter(([, field]) => block.getFieldValue(field) === "TRUE").map(([day]) => day);
        if (weekdays.length === 0) throw new Error(translate(locale, "blockly.selectWeekday"));
        return { type: "weekday", weekdays };
      }
      if (block.type === "homey_condition_time_only") {
        const startTime = normalizeScheduleTimeInput(block.getFieldValue("START"));
        const endTime = normalizeScheduleTimeInput(block.getFieldValue("END"));
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime === endTime) {
          throw new Error(translate(locale, "blockly.invalidTimes"));
        }
        return { type: "schedule", mode: "time-only", weekdays: [0,1,2,3,4,5,6], startTime, endTime, timeZone: "Europe/Amsterdam" };
      }
      if (block.type === "homey_condition_not") {
        const children = serializeChain(block.getInputTargetBlock("CONDITION"));
        if (children.length !== 1) throw new Error(translate(locale, "blockly.notExactlyOne"));
        return { type: "not", condition: children[0] };
      }
      if (block.type === "homey_condition_duration" || block.type === "homey_condition_duration_inactive") {
        const children = serializeChain(block.getInputTargetBlock("CONDITION"));
        if (children.length !== 1) throw new Error(translate(locale, "blockly.durationExactlyOne"));
        const minutes = Number(block.getFieldValue("MINUTES"));
        return durationNodeFromBlockly(block.id, block.data, minutes, children[0], block.type === "homey_condition_duration_inactive");
      }
      if (block.type === "homey_condition_and" || block.type === "homey_condition_or") {
        const conditions = serializeChain(block.getInputTargetBlock("CONDITIONS"));
        if (conditions.length < 2) throw new Error(translate(locale, "blockly.andOrAtLeastTwo"));
        return { operator: block.type.endsWith("_and") ? "and" : "or", conditions };
      }
      if (block.type === "homey_condition_unsupported") throw new Error(translate(locale, "blockly.unsupportedCondition"));
      throw new Error(translate(locale, "blockly.unknownBlock").replace("{type}", block.type));
    };
    const emitCondition = () => {
      if (hydrating) return;
      try {
        const roots = ws.getTopBlocks(true);
        if (roots.length !== 1 || roots[0] !== rootBlock) throw new Error(translate(locale, "blockly.rootOnly"));
        const nodes = serializeChain(rootBlock.getInputTargetBlock("CONDITIONS"));
        if (nodes.length === 0) throw new Error(translate(locale, "blockly.addCondition"));
        conditionChangeRef.current(combineRootConditions(nodes));
        conditionErrorRef.current("");
      } catch (error) {
        conditionErrorRef.current(error instanceof Error ? translate(locale, error.message) : translate(locale, "blockly.invalidCondition"));
        // Invalid/incomplete workspaces are deliberately not written to configuration.
      }
    };
    ws.addChangeListener((event: any) => {
      if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;
      if (event.type === Blockly.Events.BLOCK_CHANGE && event.element === "field" && event.blockId === rootBlock.id &&
          (event.name === "NOTIFICATION_TITLE" || event.name === "NOTIFICATION_MESSAGE")) {
        contentChangeRef.current({
          notificationTitle: String(rootBlock.getFieldValue("NOTIFICATION_TITLE") ?? ""),
          message: String(rootBlock.getFieldValue("NOTIFICATION_MESSAGE") ?? "")
        });
        return;
      }
      emitCondition();
    });
    hydrating = false;
    return () => ws.dispose();
  }, []);
  return <><div className="schedule-blockly-shell"><div className="schedule-blockly-toolbar"><span><i className="mdi mdi-puzzle-outline"/> {translate(locale, "notifications.editorLabel")}</span></div>{blocklyUnavailable ? <p className="notification-editor-hint">{translate(locale, "notifications.editorUnavailable")}</p> : <div ref={host} className="schedule-blockly-workspace" />}</div>{conditionError && <p className="notification-editor-error" role="alert">{conditionError}</p>}</>;
}
function NotificationSettingsPage({ locale, onDirtyChange }: { locale: string; onDirtyChange: (dirty: boolean) => void }) {
  const t = (key: string) => translate(locale, key);
  const [configs, setConfigs] = React.useState<NotificationConfigEditor[]>([]);
  const [sourceCatalog, setSourceCatalog] = React.useState<NotificationSourceCatalog | null>(null);
  const [sourceCatalogError, setSourceCatalogError] = React.useState("");
  const [saved, setSaved] = React.useState<NotificationConfigEditor[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [notificationSearch, setNotificationSearch] = React.useState("");
  const [notificationPickerOpen, setNotificationPickerOpen] = React.useState(false);
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
        if (!response.ok) throw new Error(translate(locale, "notifications.sourceCatalogError"));
        return response.json() as Promise<NotificationSourceCatalog>;
      }).catch(error => {
        if (active) setSourceCatalogError(error instanceof Error ? error.message : translate(locale, "notifications.sourceCatalogError"));
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
  const sortedConfigs = [...configs].sort((a, b) =>
    a.title.localeCompare(b.title, locale, { sensitivity: "base", numeric: true })
  );
  const matchingNotifications = sortedConfigs.filter(item =>
    item.title.toLocaleLowerCase(locale).includes(notificationSearch.trim().toLocaleLowerCase(locale))
  );
  const selected = configs.find(item => item.id === selectedId) ?? configs[0];
  const selectedSchedule = selected ? findScheduleNode(selected.condition) : null;
  const selectedComparison = selected ? findComparisonNode(selected.condition) : null;
  const currentSourceKey = selectedComparison?.source?.type === "device-capability" ? "device:" + selectedComparison.source.deviceId + ":" + selectedComparison.source.capabilityId : selectedComparison?.source?.type === "logic-variable" ? "logic:" + selectedComparison.source.variableId : "";
  // Source-health warnings reflect persisted configuration only. Draft edits
  // (including the enabled toggle) become effective after the user presses Save.
  const notificationSourceIssues = sourceCatalog ? saved.filter(item => item.enabled).map(item => ({ title: item.title.trim() || translate(locale, "notifications.unnamed"), sources: findMissingNotificationSources(item.condition, sourceCatalog, locale) })).filter(item => item.sources.length > 0) : [];
  const notificationWarningIds = new Set(notificationSourceIssues.length > 0
    ? saved.filter(item => item.enabled && findMissingNotificationSources(item.condition, sourceCatalog!, locale).length > 0).map(item => item.id)
    : []);
  const dirty = JSON.stringify(configs) !== JSON.stringify(saved);
  React.useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  const confirmDiscardDraft = () => {
    if (!dirty) return true;
    return window.confirm(t("notifications.discardSingle"));
  };
  const switchNotification = (id: string) => {
    if (id === selectedId) { setNotificationPickerOpen(false); return; }
    if (!confirmDiscardDraft()) return;
    if (dirty) setConfigs(saved);
    setSelectedId(id);
    setNotificationPickerOpen(false);
    setNotificationSearch("");
    setMessage("");
    setIsError(false);
  };
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
  const updateComparison = (operator: string, value: boolean | number | string) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition: replaceFirstComparison(item.condition, { operator, value }) } : item));
  };
  const updateCondition = (condition: any) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition } : item));
  };
  const updateEnabled = (enabled: boolean) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, enabled } : item));
  };
  const deleteNotification = () => {
    if (!selected) return;
    const confirmation = t("notifications.deleteConfirm").replace("{name}", selected.title);
    if (!window.confirm(confirmation)) return;
    const remaining = configs.filter(item => item.id !== selected.id);
    setConfigs(remaining);
    setSelectedId(remaining[0]?.id ?? "");
    setNotificationPickerOpen(false);
    setMessage("");
    setIsError(false);
  };
  const updateSeverity = (severity: "critical" | "warning" | "info") => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, severity } : item));
  };
  const updateSchedule = (value: ScheduleEditorValue) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, condition: replaceScheduleNode(item.condition, value) } : item));
  };
  const createNotification = () => {
    const baseTitle = t("notifications.newTitle");
    let suffix = 1;
    let title = baseTitle;
    while (configs.some(item => item.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase())) {
      suffix += 1;
      title = baseTitle + " " + suffix;
    }
    const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "notification-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    const deviceSources = sourceCatalog?.devices
      .map(device => ({ device, capability: device.capabilities[0] }))
      .filter(item => item.capability) ?? [];
    const firstDeviceSource = deviceSources.find(item => item.device.available) ?? deviceSources[0];
    const initialCondition = firstDeviceSource
      ? {
          type: "comparison",
          source: {
            type: "device-capability",
            deviceId: firstDeviceSource.device.id,
            capabilityId: firstDeviceSource.capability.id,
            expectedType: firstDeviceSource.capability.type
          },
          condition: {
            operator: "equals",
            value: firstDeviceSource.capability.type === "boolean" ? true : 0
          }
        }
      : { type: "schedule", configured: false, weekdays: [] };
    const next: NotificationConfigEditor = {
      schemaVersion: 1,
      id,
      title,
      notificationTitle: title,
      message: "",
      severity: "info",
      enabled: true,
      condition: initialCondition
    };
    if (!confirmDiscardDraft()) return;
    if (dirty) setConfigs(saved);
    setConfigs(current => [...current.filter(item => saved.some(existing => existing.id === item.id)), next]);
    setSelectedId(id);
    setMessage("");
    setIsError(false);
  };
  const updateTitle = (title: string) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, title } : item));
  };
  const updateNotificationContent = (value: { notificationTitle: string; message: string }) => {
    if (!selected) return;
    setConfigs(current => current.map(item => item.id === selected.id ? { ...item, notificationTitle: value.notificationTitle, message: value.message } : item));
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
      <label id="notification-rule-label">{t("notifications.ruleLabel")}</label>
      <div className="notification-rule-picker">
        <button type="button" className="notification-rule-trigger" aria-labelledby="notification-rule-label" aria-haspopup="listbox" aria-expanded={notificationPickerOpen} disabled={busy || !configs.length}
          onClick={() => { setNotificationPickerOpen(open => !open); setNotificationSearch(""); }}>
          <span className="notification-rule-trigger-name">{selected?.title ?? t("notifications.selectNotification")}</span>{selected && !selected.enabled && <span className="notification-disabled-badge">{t("notifications.disabled")}</span>}{selected?.enabled && notificationWarningIds.has(selected.id) && <span className="notification-warning-badge">{t("notifications.warning")}</span>}<span aria-hidden="true">▾</span>
        </button>
        {notificationPickerOpen && <div className="notification-rule-menu">
          <div className="notification-rule-search"><span aria-hidden="true">⌕</span><input type="search" autoFocus value={notificationSearch} onChange={event => setNotificationSearch(event.target.value)} placeholder={t("notifications.search")} aria-label={t("notifications.searchLabel")}/></div>
          <div className="notification-rule-options" role="listbox" aria-label={t("notifications.createdList")}>
            {matchingNotifications.map(item =>
              <button type="button" role="option" aria-selected={item.id === selected?.id} key={item.id} className={"notification-rule-option" + (item.id === selected?.id ? " selected" : "")}
                onClick={() => switchNotification(item.id)}><span className="notification-rule-option-name">{item.title}</span>{!item.enabled && <span className="notification-disabled-badge">{t("notifications.disabled")}</span>}{item.enabled && notificationWarningIds.has(item.id) && <span className="notification-warning-badge">{t("notifications.warning")}</span>}</button>
            )}
            {matchingNotifications.length === 0 && <div className="notification-rule-empty">{t("notifications.noneFound")}</div>}
          </div>
          <div className="notification-rule-footer">{matchingNotifications.length} {t("notifications.results")}</div>
        </div>}
      </div>
      <button type="button" className="notification-create-button" disabled={busy || saving} onClick={createNotification}><span aria-hidden="true">＋</span> {t("notifications.create")}</button>
      {!busy && !configs.length && <p>{t("notifications.emptyList")}</p>}
      {!busy && sourceCatalogError && <p className="notification-editor-error" role="alert">{t("notifications.sourceLoadError").replace("{error}", sourceCatalogError)}</p>}
    </div>
    {notificationSourceIssues.length > 0 && <section className="notification-source-issues" aria-label={t("notifications.sourceIssuesLabel")}>
      <h2>{t("notifications.checkSources")}</h2>
      {notificationSourceIssues.map((issue, index) => <div className="notification-source-warning" role="alert" key={index}>
        <strong>{issue.title}</strong>
        <ul>{issue.sources.map((source, sourceIndex) => <li key={sourceIndex}>{source}</li>)}</ul>
        <span>{t("notifications.checkSourceHint")}</span>
      </div>)}
    </section>}
    <div className="notification-settings-layout">
      <section className="settings-card notification-editor-card">
        {selected ? <><div className="notification-editor-heading"><div className="notification-title-wrap"><label className="visually-hidden" htmlFor="notification-title-input">{t("notifications.name")}</label><input id="notification-title-input" className="notification-title-input" value={selected.title} disabled={busy || saving} onChange={event => updateTitle(event.target.value)} /></div><div className="notification-heading-controls"><button type="button" className="notification-delete-button" disabled={busy || saving} onClick={deleteNotification}><span className="mdi mdi-trash-can-outline" aria-hidden="true"/> {t("notifications.delete")}</button><button type="button" className={"notification-enabled-toggle" + (selected.enabled ? " is-enabled" : " is-disabled")} aria-pressed={selected.enabled} disabled={busy || saving} onClick={() => updateEnabled(!selected.enabled)}><span className="notification-toggle-indicator" aria-hidden="true"/>{selected.enabled ? t("notifications.enabled") : t("notifications.disabledState")}</button><div className="notification-severity-control"><label htmlFor="notification-severity-select">{translate(locale, "notifications.currentLevel")}</label><span className={"notification-severity-pill severity-" + selected.severity}>{translate(locale, "notifications.severity." + selected.severity)}</span><select id="notification-severity-select" value={selected.severity} disabled={busy || saving} onChange={event => updateSeverity(event.target.value as "critical" | "warning" | "info")}><option value="critical">{translate(locale, "notifications.severity.critical")}</option><option value="warning">{translate(locale, "notifications.severity.warning")}</option><option value="info">{translate(locale, "notifications.severity.info")}</option></select></div></div></div>
          <ScheduleBlocklyEditor key={selected.id + "-" + locale} condition={selected.condition} schedule={selectedSchedule} onChange={updateSchedule} onConditionChange={updateCondition} notificationTitle={selected.notificationTitle ?? selected.title} notificationMessage={selected.message} onContentChange={updateNotificationContent} locale={locale} sourceCatalog={sourceCatalog} sourceKey={currentSourceKey} onSourceChange={updateSource} comparison={selectedComparison} onComparisonChange={updateComparison}/>
        </> : <p>{busy ? translate(locale, "notifications.loading") : t("notifications.noneAvailable")}</p>}
      </section>
    </div>
    <div className="settings-bottom"><span className={"save-message" + (isError ? " error" : "")} role={isError ? "alert" : "status"}>{busy ? translate(locale, "notifications.loading") : message}</span><button className="primary-button" disabled={!dirty || saving || busy || configs.some(item => !item.title.trim())} onClick={() => void save()}>{saving ? translate(locale, "notifications.save") : "▣  " + translate(locale, "settings.save")}</button></div>
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
          <div className="mdi-search-wrap"><span className="mdi mdi-magnify" aria-hidden="true" /><input type="search" value={iconSearch} onChange={event => setIconSearch(event.target.value)} placeholder={t("quickActions.searchIcons")} aria-label={t("quickActions.searchIconsLabel")} /></div>
          <div className="quick-icon-picker">
            {visibleIcons.map(icon =>
              <button type="button" key={icon.name} title={icon.name} aria-label={icon.name} aria-pressed={selected.icon === icon.name} className={selected.icon === icon.name ? "active" : ""} onClick={() => updateSelected({ icon: icon.name })}><MdiIcon name={icon.name} /></button>
            )}
            {matchingIcons.length === 0 && <div className="mdi-no-results">{t("quickActions.noIcons")}</div>}
          </div>
          <div className="mdi-picker-count">{visibleIcons.length} van {matchingIcons.length} iconen{matchingIcons.length > 120 ? " · " + t("quickActions.refineSearch") : ""}</div>
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
                  placeholder={t("quickActions.searchDevice")} aria-label={t("quickActions.searchHomeyDevice")} />
              </div>
              <div className="quick-flow-results">
                {matchingDevices.map(device => <button type="button" role="option" aria-selected={device.id === selected.deviceId}
                  className={"quick-flow-option" + (device.id === selected.deviceId ? " selected" : "")}
                  key={device.id} onClick={() => { selectDevice(device.id); setDevicePickerOpen(false); setDeviceSearch(""); }}>
                  <span className="quick-flow-option-icon"><MdiIcon name="devices" /></span>
                  <span className="quick-flow-option-name">{deviceDisplayName(device)}</span>
                  {!device.available && <span className="quick-flow-type">{t("homey.offline")}</span>}
                </button>)}
                {matchingDevices.length === 0 && <div className="quick-flow-empty">{t("quickActions.noDevices")}</div>}
              </div>
              <div className="quick-flow-footer">{matchingDevices.length} {t("quickActions.devices")}</div>
            </div>}
          </div>
          <label>{t("settings.deviceActionLabel")}<select value={selected.capabilityId} onChange={event => selectCapability(event.target.value)} disabled={!selectedDevice}><option value="">{t("settings.selectDeviceAction")}</option>{selectedDevice?.capabilities.map(capability => <option key={capability.id} value={capability.id}>{capability.title}</option>)}</select></label>
          {selectedCapability?.type === "boolean" && <label>{t("settings.actionValue")}<select value={selected.booleanMode} onChange={event => { const mode = event.target.value as "on" | "off" | "toggle"; updateSelected({ booleanMode: mode, value: mode === "on" ? true : mode === "off" ? false : selected.value }); }}><option value="on">{t("settings.turnOn")}</option><option value="off">{t("settings.turnOff")}</option><option value="toggle">{t("quickActions.toggle")}</option></select></label>}
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

function GeneralSettingsPage({ onBack, initialPage, onNavigate, onDirtyChange }: { onBack: () => void; initialPage: "general" | "quick-actions" | "notifications" | "measurement-tiles" | "weather"; onNavigate: (path: string) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [page, setPage] = React.useState<"general" | "quick-actions" | "notifications" | "measurement-tiles" | "weather">(initialPage);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [notificationDirty, setNotificationDirty] = React.useState(false);
  React.useEffect(() => { onDirtyChange(notificationDirty); }, [notificationDirty, onDirtyChange]);
  React.useEffect(() => setPage(initialPage), [initialPage]);
  const confirmLeaveNotifications = () => {
    if (page !== "notifications" || !notificationDirty) return true;
    return window.confirm(t("notifications.discardChanges"));
  };
  const navigateSettings = (nextPage: "general" | "quick-actions" | "notifications" | "measurement-tiles" | "weather", path: string) => {
    if (nextPage === page || !confirmLeaveNotifications()) return;
    setPage(nextPage);
    onNavigate(path);
  };
  const leaveSettings = () => { if (confirmLeaveNotifications()) onBack(); };
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
  const leave = () => {
    if (!confirmLeaveNotifications()) return;
    if (dirty) setShowLeave(true);
    else onBack();
  };
  const uptime = (seconds?: number) => { if (seconds == null) return "—"; const d=Math.floor(seconds/86400), h=Math.floor(seconds%86400/3600), m=Math.floor(seconds%3600/60); return [d ? d+"d" : "", String(h).padStart(2,"0")+(locale.toLowerCase().startsWith("nl") ? "u" : "h"), String(m).padStart(2,"0")+"m"].filter(Boolean).join(" "); };
  const datePreview = settings.dateFormat === "iso" ? "2025-01-27" : settings.dateFormat === "long" ? (locale.toLowerCase().startsWith("en") ? "Monday 27 January 2025" : "maandag 27 januari 2025") : "27-01-2025";
  const homeyConnected = status?.homey.state === "online";
  const languageName = (code: string) => availableLanguages.find(language => language.homeyCodes.some(homeyCode => homeyCode.toLowerCase() === code.toLowerCase()))?.label ?? homeyLanguageName(code, locale);
  return <main className={"settings-shell" + (sidebarCollapsed ? " sidebar-collapsed" : "")}>
    <header className="settings-topbar">
      <button type="button" className="settings-brand" onClick={() => { if (window.matchMedia("(min-width: 701px)").matches) setSidebarCollapsed(value => !value); }} aria-label={sidebarCollapsed ? t("settings.expandMenu") : t("settings.collapseMenu")} aria-expanded={!sidebarCollapsed} aria-controls="settings-sidebar"><span className="brand-orb" /><span>Homey Dashboard</span></button><div className="topbar-spacer" /><button className="crumb-button" onClick={leave} aria-label={t("settings.back")}><span className="mdi mdi-view-dashboard-outline" aria-hidden="true" /><span>{t("settings.back")}</span></button>
    </header>
    <aside className="settings-sidebar" id="settings-sidebar">
      <button type="button" className="sidebar-collapse-toggle" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? t("settings.expandMenu") : t("settings.collapseMenu")} aria-expanded={!sidebarCollapsed} aria-controls="settings-sidebar"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M9 4.5v15" /></svg></button>
      <h2>{t("settings.navTitle")}</h2>
      {[t("settings.general"),t("settings.quickActions"),t("settings.notifications"),t("settings.temperatureTiles"),t("settings.weather")].map((name,index)=>{
        const routes = ["/settings/general","/settings/quick-actions","/settings/notifications","/settings/measurement-tiles","/settings/weather"] as const;
        const pages = ["general","quick-actions","notifications","measurement-tiles","weather"] as const;
        const icons = ["mdi-cog-outline","mdi-flash-outline","mdi-bell-outline","mdi-thermometer","mdi-weather-partly-cloudy"];
        return <button key={name} className={"settings-nav "+(page===pages[index]?"active":"")} onClick={()=>navigateSettings(pages[index],routes[index])} aria-label={name} title={sidebarCollapsed ? name : undefined}><i className={"mdi "+icons[index]} aria-hidden="true" /><span className="settings-nav-label">{name}</span></button>;
      })}
      <div className="sidebar-product"><i className="mdi mdi-information-outline" aria-hidden="true" /><span>Homey Dashboard<br/>v{status?.version ?? "0.1.0"}</span></div>
    </aside>
    <section className="settings-content">
      {page === "general" ? <>
      <div className="settings-title"><p>{t("settings.subtitle")}</p></div>
      <div className="settings-top-cards">
        <section className="settings-card language-card"><h2><span>◎</span>{t("settings.language")}</h2>
          <label className="setting-row"><span>{t("settings.dashboardLanguage")}</span><select value={settings.language} onChange={e=>update("language",e.target.value)}><option value="automatic">{t("settings.automaticHomeyLanguage")}</option>{availableLanguages.map(language => <option key={language.id} value={language.id}>{language.label}</option>)}</select></label>
          <div className="language-info"><div>ℹ <span><strong>{t("settings.automatic")}</strong><br/>{t("settings.autoDescription")}</span></div><div>● <span>{t("settings.detectedHomey")} <strong>{status?.homeyLanguage ? `${status.homeyLanguage.toUpperCase()} (${languageName(status.homeyLanguage)})` : t("settings.notAvailable")}</strong></span><em>{status?.homeyLanguage ? t("settings.detected") : t("settings.fallback")}</em></div></div>
        </section>
        <section className="settings-card date-card"><h2><span>◷</span>{t("settings.dateTime")}</h2>
          <label className="setting-row"><span>{t("settings.dateFormat")}</span><select value={settings.dateFormat} onChange={e=>update("dateFormat",e.target.value)}><option value="short">{t("settings.shortDate")} ({datePreview})</option><option value="iso">{t("settings.isoDate")} ({datePreview})</option><option value="long">{t("settings.longDate")} ({datePreview})</option></select></label>
          <label className="setting-row"><span>{t("settings.timeFormat")}</span><select value={settings.timeFormat} onChange={e=>update("timeFormat",e.target.value)}><option value="24h">{t("settings.24hour")}</option><option value="12h">{t("settings.12hour")}</option></select></label>
          <label className="setting-row"><span>{t("settings.firstDay")}</span><select value={settings.firstDayOfWeek} onChange={e=>update("firstDayOfWeek",e.target.value)}><option value="monday">{t("settings.monday")}</option><option value="sunday">{t("settings.sunday")}</option></select></label>
        </section>
      </div>
      <section className="settings-card notification-timeout-card">
        <h2><span>♧</span>{t("settings.notificationBehavior")}</h2>
        <label className="setting-row"><span>{t("settings.notificationTimeout")}</span><select value={settings.notificationTimeout} onChange={e=>update("notificationTimeout",e.target.value as NotificationTimeout)}>
          <option value="never">{t("settings.timeoutNever")}</option>
          <option value="1">1 s</option><option value="2">2 s</option><option value="5">5 s</option><option value="10">10 s</option><option value="30">30 s</option>
          <option value="60">1 min</option><option value="300">5 min</option><option value="900">15 min</option><option value="1800">30 min</option>
        </select></label>
        <p className="setting-description">{t("settings.notificationTimeoutDescription")}</p>
      </section>
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
      </> : page === "quick-actions" || page === "measurement-tiles" ? <DashboardSettingsPage page={page} locale={locale} t={t} /> : page === "notifications" ? <NotificationSettingsPage locale={locale} onDirtyChange={setNotificationDirty} /> : page === "weather" ? <WeatherSettingsPage locale={locale} t={t} onNavigate={() => navigateSettings("general","/settings/general")} /> : null}
    </section>
    {showLeave && <div className="modal-backdrop"><section className="leave-modal"><h2>{t("settings.unsavedTitle")}</h2><p>{t("settings.unsavedPrompt")}</p><div><button className="secondary-button" onClick={()=>setShowLeave(false)}>{t("settings.stay")}</button><button className="secondary-button" onClick={onBack}>{t("settings.discard")}</button><button className="primary-button" onClick={async()=>{await save();setShowLeave(false);onBack();}}>{t("settings.save")}</button></div></section></div>}
  </main>;
}


type WeatherSettingId = "outdoorTemperature" | "feelsLike" | "humidity" | "pressure" | "windSpeed" | "windDirection" | "precipitation" | "sunrise" | "sunset";
type WeatherSource = { type: "device"; deviceId: string; capabilityId: string } | { type: "logic"; variableId: string } | null;
type WeatherSettingsModel = { sources: Record<WeatherSettingId, WeatherSource>; iconPack: "animated" | "color3d" | "outline" | "flat" };
type WeatherSourceCatalog = { devices: { id: string; name: string; zone: string | null; available: boolean; capabilities: { id: string; title: string; type: string; units: string }[] }[]; variables: { id: string; name: string; type: string }[] };
const weatherSettingIds: WeatherSettingId[] = ["outdoorTemperature","feelsLike","humidity","pressure","windSpeed","windDirection","precipitation","sunrise","sunset"];
const emptyWeatherSettings: WeatherSettingsModel = { sources: { outdoorTemperature:null, feelsLike:null, humidity:null, pressure:null, windSpeed:null, windDirection:null, precipitation:null, sunrise:null, sunset:null }, iconPack:"animated" };
const weatherPackIds = ["animated","color3d","outline","flat"] as const;

function WeatherSettingsPage({ locale, t, onNavigate }: { locale: string; t: (key: string) => string; onNavigate: () => void }) {
  const [settings,setSettings] = React.useState<WeatherSettingsModel>(emptyWeatherSettings);
  const [saved,setSaved] = React.useState<WeatherSettingsModel>(emptyWeatherSettings);
  const [catalog,setCatalog] = React.useState<WeatherSourceCatalog>({devices:[],variables:[]});
  const [busy,setBusy] = React.useState(true);
  const [saving,setSaving] = React.useState(false);
  const [message,setMessage] = React.useState("");
  const [searchId,setSearchId] = React.useState<WeatherSettingId|null>(null);
  const [pendingEnabledId,setPendingEnabledId] = React.useState<WeatherSettingId|null>(null);
  const [search,setSearch] = React.useState("");
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/settings/weather").then(async r => { if(!r.ok) throw new Error(t("weatherSettings.loadError")); return await r.json() as WeatherSettingsModel; }),
      fetch("/api/settings/weather-sources").then(async r => { if(!r.ok) throw new Error(t("weatherSettings.sourcesError")); return await r.json() as WeatherSourceCatalog; })
    ]).then(([config,options]) => { if(active) { setSettings(config); setSaved(config); setCatalog(options); } })
      .catch(error => { if(active) setMessage(error instanceof Error ? error.message : t("weatherSettings.loadError")); })
      .finally(() => { if(active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const sourceLabel = (source: WeatherSource) => {
    if(!source) return t("weatherSettings.selectSource");
    if(source.type === "logic") {
      const variable = catalog.variables.find(item => item.id === source.variableId);
      return variable ? t("weatherSettings.logicPrefix") + " · " + variable.name : t("weatherSettings.unknownSource");
    }
    const device = catalog.devices.find(item => item.id === source.deviceId);
    const capability = device?.capabilities.find(item => item.id === source.capabilityId);
    return device && capability ? device.name + " · " + capability.title + (capability.units ? " ("+capability.units+")" : "") : t("weatherSettings.unknownSource");
  };
  const updateSource = (id: WeatherSettingId, source: WeatherSource) => setSettings(current => ({...current,sources:{...current.sources,[id]:source}}));
  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/settings/weather",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(settings)});
      const result = await response.json() as WeatherSettingsModel & {error?:string};
      if(!response.ok) throw new Error(result.error ?? t("weatherSettings.saveError"));
      setSettings(result); setSaved(result); setMessage(t("weatherSettings.saved"));
    } catch(error) { setMessage(error instanceof Error ? error.message : t("weatherSettings.saveError")); }
    finally { setSaving(false); }
  };
  const query = search.trim().toLocaleLowerCase(locale);
  const expectedTypes = id === "sunrise" || id === "sunset" || id === "windDirection" ? ["number","string"] : ["number"];
  const matchingDevices = catalog.devices.flatMap(device => device.capabilities.map(capability => ({device,capability})))
    .filter(({device,capability}) => expectedTypes.includes(capability.type) && (!query || (device.name+" "+(device.zone??"")+" "+capability.title+" "+capability.id+" "+capability.units).toLocaleLowerCase(locale).includes(query)));
  const matchingVariables = catalog.variables.filter(variable => expectedTypes.includes(variable.type) && (!query || (variable.name+" "+variable.type).toLocaleLowerCase(locale).includes(query)));
  const packs = [
    {id:"animated",title:t("weatherSettings.packAnimated"),description:t("weatherSettings.packAnimatedDescription"),glyphs:["☀️","🌤️","☁️","🌧️","⛈️","❄️","🌫️","💨"]},
    {id:"color3d",title:t("weatherSettings.packColor3d"),description:t("weatherSettings.packColor3dDescription"),glyphs:["🌞","🌥️","🌧️","⛈️","🌨️","🌙","🌈","🌪️"]},
    {id:"outline",title:t("weatherSettings.packOutline"),description:t("weatherSettings.packOutlineDescription"),glyphs:["☼","☁","☂","ϟ","❄","☾","≋","↝"]},
    {id:"flat",title:t("weatherSettings.packFlat"),description:t("weatherSettings.packFlatDescription"),glyphs:["🌤","☁","🌦","🌩","❄","🌙","🌫","🌬"]}
  ];
  return <div className="quick-settings-page weather-settings-page">
    <div className="settings-title"><div className="quick-settings-title-icon"><i className="mdi mdi-weather-partly-cloudy" aria-hidden="true"/></div><div><h1>{t("settings.weatherPlaceholderTitle")}</h1><p>{t("weatherSettings.intro")}</p></div></div>
    <div className="weather-settings-layout">
      <section className="settings-card weather-sources-card">
        <h2><i className="mdi mdi-weather-partly-cloudy" aria-hidden="true"/>{t("weatherSettings.sourcesHeading")}</h2>
        <p className="quick-card-description">{t("weatherSettings.sourcesDescription")}</p>
        <div className="weather-source-list">
          {weatherSettingIds.map(id => {
            const enabled = Boolean(settings.sources[id]) || pendingEnabledId === id;
            const isOpen = searchId === id;
            return <div className={"weather-source-row"+(!enabled?" is-disabled":"")} key={id}>
              <div className="weather-source-label"><i className={"mdi "+({outdoorTemperature:"mdi-thermometer",feelsLike:"mdi-thermometer-lines",humidity:"mdi-water-percent",pressure:"mdi-gauge",windSpeed:"mdi-weather-windy",windDirection:"mdi-compass-outline",precipitation:"mdi-weather-rainy",sunrise:"mdi-weather-sunset-up",sunset:"mdi-weather-sunset-down"} as Record<WeatherSettingId,string>)[id]} aria-hidden="true"/><span>{t("weatherSettings.field."+id)}</span></div>
              <button type="button" role="switch" aria-checked={enabled} className={"weather-source-toggle"+(enabled?" active":"")} aria-label={t("weatherSettings.toggleField")} onClick={() => { if(settings.sources[id]) { updateSource(id,null); setPendingEnabledId(null); } else { setPendingEnabledId(id); setSearchId(id); setSearch(""); } }}>
                <span/>
              </button>
              <div className="weather-source-picker">
                <button type="button" className="quick-flow-trigger weather-source-trigger" aria-haspopup="listbox" aria-expanded={isOpen} disabled={!enabled}
                  onClick={() => { setSearchId(isOpen?null:id); setSearch(""); }}>
                  <span className="mdi mdi-database-search-outline" aria-hidden="true"/>
                  <span className="quick-flow-trigger-name">{sourceLabel(settings.sources[id])}</span><span className="quick-flow-chevron">▾</span>
                </button>
                {isOpen && <div className="quick-flow-menu weather-source-menu" role="listbox" aria-label={t("weatherSettings.selectSource")}>
                  <div className="quick-flow-search-wrap"><span className="mdi mdi-magnify" aria-hidden="true"/><input autoFocus type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("weatherSettings.searchSources")} aria-label={t("weatherSettings.searchSources")}/></div>
                  <div className="quick-flow-results">
                    <div className="weather-source-group-label">{t("weatherSettings.devices")}</div>
                    {matchingDevices.map(({device,capability})=><button type="button" role="option" aria-selected={settings.sources[id]?.type==="device" && settings.sources[id]?.deviceId===device.id && settings.sources[id]?.capabilityId===capability.id} className="quick-flow-option" key={device.id+":"+capability.id} onClick={()=>{updateSource(id,{type:"device",deviceId:device.id,capabilityId:capability.id});setPendingEnabledId(null);setSearchId(null);setSearch("");}}><span className="mdi mdi-devices" aria-hidden="true"/><span className="quick-flow-option-name">{device.name} · {capability.title}{capability.units?" ("+capability.units+")":""}</span>{!device.available&&<small>{t("homey.offline")}</small>}</button>)}
                    {matchingDevices.length===0&&<div className="quick-flow-empty">{t("weatherSettings.noDeviceSources")}</div>}
                    <div className="weather-source-group-label">{t("weatherSettings.logicVariables")}</div>
                    {matchingVariables.map(variable=><button type="button" role="option" aria-selected={settings.sources[id]?.type==="logic"&&settings.sources[id]?.variableId===variable.id} className="quick-flow-option" key={variable.id} onClick={()=>{updateSource(id,{type:"logic",variableId:variable.id});setPendingEnabledId(null);setSearchId(null);setSearch("");}}><span className="mdi mdi-variable" aria-hidden="true"/><span className="quick-flow-option-name">{variable.name}</span><small>{variable.type}</small></button>)}
                    {matchingVariables.length===0&&<div className="quick-flow-empty">{t("weatherSettings.noLogicSources")}</div>}
                  </div>
                </div>}
              </div>
              {!enabled&&<span className="weather-source-disabled-label">{t("weatherSettings.disabled")}</span>}
            </div>;
          })}
        </div>
        <div className="quick-info">ⓘ <span>{t("weatherSettings.sourceTip")}</span></div>
      </section>
      <div className="weather-settings-side">
        <section className="settings-card weather-packs-card">
          <h2><i className="mdi mdi-image-multiple-outline" aria-hidden="true"/>{t("weatherSettings.iconHeading")}</h2>
          <p className="quick-card-description">{t("weatherSettings.iconDescription")}</p>
          <div className="weather-pack-grid">
            {packs.map(pack=><button type="button" key={pack.id} className={"weather-pack-option"+(settings.iconPack===pack.id?" selected":"")} aria-pressed={settings.iconPack===pack.id} onClick={()=>setSettings(current=>({...current,iconPack:pack.id as WeatherSettingsModel["iconPack"]}))}>
              <span className="weather-pack-radio" aria-hidden="true"/><span className={"weather-pack-glyphs pack-"+pack.id}>{pack.glyphs.map((glyph,index)=><span key={index}>{glyph}</span>)}</span><strong>{pack.title}</strong><small>{pack.description}</small>
            </button>)}
          </div>
          <div className={"weather-pack-preview pack-"+settings.iconPack}><span>{t("weatherSettings.preview")}</span>{packs.find(pack=>pack.id===settings.iconPack)?.glyphs.map((glyph,index)=><span key={index}>{glyph}</span>)}</div>
        </section>
        <section className="settings-card weather-api-card">
          <h2><i className="mdi mdi-key-outline" aria-hidden="true"/>{t("weatherSettings.apiHeading")}</h2>
          <p>{t("weatherSettings.apiDescription")}</p>
          <p className="weather-api-tip"><strong>{t("weatherSettings.apiTipTitle")}</strong> {t("weatherSettings.apiTip")}</p>
          <p className="weather-api-link">{t("weatherSettings.tokenLocation")} <button type="button" className="text-link" onClick={onNavigate}>{t("settings.general")}</button>.</p>
          <a className="secondary-button weather-doc-link" href={window.location.origin+"/api-docs/#/Weather/getWeather"} target="_blank" rel="noreferrer"><i className="mdi mdi-open-in-new" aria-hidden="true"/>{t("weatherSettings.apiDocs")}</a>
        </section>
      </div>
    </div>
    <div className="settings-bottom"><span className={"save-message"+(message.includes("Error")?" error":"")} role="status">{busy?t("settings.loading"):message}</span><button className="primary-button" disabled={!dirty||saving||busy} onClick={()=>void save()}>{saving?t("settings.saving"):t("settings.save")}</button></div>
  </div>;
}

function formatWeatherValue(value: string | number | boolean | null, units: string, locale: string): string {
  if (value === null || value === undefined) return "—";
  const formatted = typeof value === "number" ? new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(value) : String(value);
  return formatted + (units ? " " + units : "");
}

function WeatherIcon({ category, pack = "animated" }: { category: WeatherCategory; pack?: WeatherSettingsModel["iconPack"] }) {
  const symbols: Record<WeatherCategory,string> = { sunny:"☀️", mostly_sunny:"🌤️", partly_cloudy:"⛅", cloudy:"☁️", overcast:"🌥️", fog:"🌫️", drizzle:"🌦️", rain:"🌧️", heavy_rain:"🌧️", showers:"🌦️", thunderstorm:"⛈️", hail:"🌨️", snow:"❄️", snow_showers:"🌨️", sleet:"🌨️", windy:"💨", unknown:"?" };
  if (pack !== "animated") return <div className={"weather-symbol weather-pack-"+pack+" weather-pack-symbol"} role="img" aria-label={category.replaceAll("_"," ")}><span>{pack === "outline" ? ({sunny:"☼",cloudy:"☁",rain:"☂",snow:"❄",windy:"≋",unknown:"?"} as Record<string,string>)[category] ?? symbols[category] : symbols[category]}</span></div>;
  return (
    <div className={`weather-symbol weather-${category} weather-pack-${pack}`} role="img" aria-label={category.replaceAll("_", " ")}>
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
function TemperatureTile({ label, value, units, className = "" }: { label: string; value: string; units: string; className?: string }) {
  return <article className={("card temperature-tile " + className).trim()}><span className="temperature-label">{label}</span><strong className="temperature-reading"><span className="temperature-reading-value">{value}</span>{units && <small className="temperature-reading-unit">{units}</small>}</strong></article>;
}
void loadTranslations().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
});
