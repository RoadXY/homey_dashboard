import React from "react";

/**
 * Camera popup shown on the dashboard when the backend publishes a `camera-popup`
 * event. The live feed is requested from the backend, which forwards the browser's
 * WebRTC offer to Homey. The browser never talks to the camera directly.
 *
 * The popup is keyed by event id: a new event remounts it and starts a new stream.
 */

export const CAMERA_POPUP_SOUND_FILES = {
  doorbell: "/sounds/doorbell.wav",
  alert: "/sounds/alert.wav",
  chime: "/sounds/chime.wav",
} as const;

export type CameraPopupSound = keyof typeof CAMERA_POPUP_SOUND_FILES;

export type CameraPopupState = {
  id: string;
  title: string;
  deviceId: string;
  cameraName: string;
  sound: CameraPopupSound | null;
  shownAt: string;
  expiresAt: string | null;
};

type StreamStatus = "connecting" | "live" | "reconnecting" | "failed";

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const DISCONNECT_GRACE_MS = 4000;
const KEEP_ALIVE_MS = 5000;
const ICE_GATHERING_TIMEOUT_MS = 2000;
const JSON_HEADERS = { "Content-Type": "application/json" };

type Props = {
  popup: CameraPopupState | null;
  locale: string;
  t: (key: string) => string;
  /** Hides the popup locally. The caller is responsible for the dashboard state. */
  onClose: () => void;
};

export function CameraPopup({ popup, locale, t, onClose }: Props) {
  if (!popup) return null;
  return <ActiveCameraPopup key={popup.id} popup={popup} locale={locale} t={t} onClose={onClose} />;
}

type ActiveProps = { popup: CameraPopupState; locale: string; t: (key: string) => string; onClose: () => void };

function ActiveCameraPopup({ popup, locale, t, onClose }: ActiveProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = React.useState<StreamStatus>("connecting");
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!popup.sound) return;
    const audio = new Audio(CAMERA_POPUP_SOUND_FILES[popup.sound]);
    // Browsers can block autoplay. The popup still works without the sound.
    void audio.play().catch(() => undefined);
    return () => audio.pause();
  }, [popup.sound]);

  React.useEffect(() => {
    let cancelled = false;
    let connection: RTCPeerConnection | null = null;
    let streamId: string | null = null;
    let attempts = 0;
    let keepAliveTimer: number | undefined;
    let retryTimer: number | undefined;
    let disconnectTimer: number | undefined;

    const teardown = () => {
      window.clearInterval(keepAliveTimer);
      window.clearTimeout(retryTimer);
      window.clearTimeout(disconnectTimer);
      streamId = null;
      connection?.close();
      connection = null;
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      teardown();
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        setStatus("failed");
        return;
      }
      attempts += 1;
      setStatus("reconnecting");
      retryTimer = window.setTimeout(() => void start(), RECONNECT_DELAY_MS * attempts);
    };

    const start = async () => {
      if (cancelled) return;
      teardown();
      const pc = new RTCPeerConnection();
      connection = pc;
      const stream = new MediaStream();
      pc.ontrack = (event) => {
        stream.addTrack(event.track);
        const video = videoRef.current;
        if (video && video.srcObject !== stream) video.srcObject = stream;
      };
      pc.onconnectionstatechange = () => {
        if (cancelled || connection !== pc) return;
        if (pc.connectionState === "connected") {
          attempts = 0;
          window.clearTimeout(disconnectTimer);
          setStatus("live");
        } else if (pc.connectionState === "failed") {
          scheduleReconnect();
        } else if (pc.connectionState === "disconnected") {
          window.clearTimeout(disconnectTimer);
          disconnectTimer = window.setTimeout(scheduleReconnect, DISCONNECT_GRACE_MS);
        }
      };
      try {
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
        await pc.setLocalDescription(await pc.createOffer());
        await waitForIceGathering(pc);
        const response = await fetch("/api/camera-popup/offer", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ offer: pc.localDescription?.sdp }),
        });
        if (!response.ok) throw new Error("WebRTC offer failed with HTTP " + response.status);
        const answer = (await response.json()) as { answerSdp: string; streamId: string };
        if (cancelled || connection !== pc) return;
        streamId = answer.streamId;
        await pc.setRemoteDescription({ type: "answer", sdp: answer.answerSdp });
        keepAliveTimer = window.setInterval(() => {
          if (!streamId) return;
          void fetch("/api/camera-popup/keep-alive", {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ streamId }),
          }).catch(() => undefined);
        }, KEEP_ALIVE_MS);
      } catch {
        scheduleReconnect();
      }
    };

    void start();
    return () => {
      cancelled = true;
      teardown();
    };
  }, [popup.id]);

  const dismiss = React.useCallback(() => {
    void fetch("/api/camera-popup/dismiss", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ id: popup.id }),
    }).catch(() => undefined);
    onClose();
  }, [popup.id, onClose]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  const remaining = popup.expiresAt ? Math.max(0, Math.ceil((Date.parse(popup.expiresAt) - now) / 1000)) : null;
  React.useEffect(() => {
    // The backend also closes the popup at expiry; this keeps a missed event from leaving it open.
    if (remaining === 0) onClose();
  }, [remaining, onClose]);

  const clock = new Date(now).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const statusText = status === "failed" ? t("cameraPopup.unavailable")
    : status === "reconnecting" ? t("cameraPopup.reconnecting")
    : t("cameraPopup.connecting");

  return (
    <div className="camera-popup-backdrop">
      <section className="camera-popup" role="dialog" aria-modal="true" aria-label={popup.title}>
        <header className="camera-popup-header">
          <h2>{popup.title}</h2>
          <div className="camera-popup-header-end">
            <time dateTime={new Date(now).toISOString()}>{clock}</time>
            <button type="button" className="camera-popup-close" aria-label={t("cameraPopup.close")} onClick={dismiss}>✕</button>
          </div>
        </header>
        <div className="camera-popup-video">
          <video ref={videoRef} autoPlay muted playsInline />
          {status !== "live" && <p className="camera-popup-status" role="status">{statusText}</p>}
        </div>
        <footer className="camera-popup-footer">
          <span className="camera-popup-live">
            <span className={"camera-popup-dot" + (status === "live" ? " is-live" : "")} role="img" aria-label={status === "live" ? t("cameraPopup.liveAria") : undefined} />
            {popup.cameraName}
          </span>
          {remaining !== null && (
            <span className="camera-popup-countdown">{t("cameraPopup.countdown").replace("{time}", formatCountdown(remaining, t))}</span>
          )}
        </footer>
      </section>
    </div>
  );
}

/** Formats seconds as "2 min 43 s" or "1 h 02 min 03 s", using the translated unit labels. */
function formatCountdown(totalSeconds: number, t: (key: string) => string): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(t("cameraPopup.unitHours").replace("{n}", String(hours)));
  if (hours > 0 || minutes > 0) parts.push(t("cameraPopup.unitMinutes").replace("{n}", String(hours > 0 ? String(minutes).padStart(2, "0") : String(minutes))));
  parts.push(t("cameraPopup.unitSeconds").replace("{n}", String(hours > 0 || minutes > 0 ? String(seconds).padStart(2, "0") : String(seconds))));
  return parts.join(" ");
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  // Homey's API takes the offer in one request, so it cannot receive trickled candidates.
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timer);
        resolve();
      }
    });
  });
}
