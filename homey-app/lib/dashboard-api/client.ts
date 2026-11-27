import type { components } from './schema.js';
import DashboardApiError from './errors.js';

export { DashboardApiError };

export type WeatherCondition = components['schemas']['WeatherCondition'];
export type WeatherState = components['schemas']['WeatherState'];
export type NotificationSeverity = components['schemas']['NotificationSeverity'];
export type ApiNotification = components['schemas']['ApiNotification'];

export interface DashboardConnection {
  /** IP address or hostname of the Homey Dashboard container. */
  host: string;
  /** HTTP port of the dashboard (DASHBOARD_PORT, default 5173). */
  port: number;
  /** Managed Bearer token created in the dashboard Settings screen. */
  token: string;
  /** Use https:// instead of http://. Defaults to false (LAN). */
  secure?: boolean;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  severity: NotificationSeverity;
  /** ISO 8601 timestamp including timezone, must be in the future. */
  expiresAt?: string;
}

export interface UpdateNotificationInput {
  title?: string;
  message?: string;
  severity?: NotificationSeverity;
  /** ISO 8601 timestamp, or null to clear the expiry. */
  expiresAt?: string | null;
}

interface RequestOptions {
  body?: unknown;
  /** Send the Bearer token. Required for /api/v1 write endpoints. */
  auth?: boolean;
}

/** Parses JSON bodies; non-JSON bodies (e.g. proxy error pages) are returned as text. */
function parseBody(text: string): unknown {
  if (!text) return undefined;
  if (!/^[[{]/.test(text.trim())) return text;
  return JSON.parse(text);
}

/**
 * Typed client for the Homey Dashboard integration API (/api/v1) plus the
 * public GET /api/weather and GET /api/health endpoints.
 */
export class DashboardClient {
  private readonly baseUrl: string;

  constructor(
    private readonly connection: DashboardConnection,
    private readonly timeoutMs = 10_000,
  ) {
    const scheme = connection.secure ? 'https' : 'http';
    this.baseUrl = `${scheme}://${connection.host}:${connection.port}`;
  }

  /** Public liveness probe. Does not require a token. */
  isReachable(): Promise<boolean> {
    return this.request('GET', '/api/health/live').then(() => true, () => false);
  }

  /**
   * Verifies that the token is accepted. Uses a read-only authenticated
   * endpoint, so no data is changed.
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.listNotifications();
      return true;
    } catch (error) {
      if (error instanceof DashboardApiError && error.status === 401) return false;
      throw error;
    }
  }

  /** Current weather condition as shown on the dashboard (public endpoint). */
  getCurrentWeather(): Promise<WeatherState> {
    return this.request<WeatherState>('GET', '/api/weather');
  }

  async listWeatherConditions(): Promise<WeatherCondition[]> {
    const result = await this.request<{ conditions: WeatherCondition[] }>(
      'GET', '/api/v1/weather/conditions',
    );
    return result.conditions;
  }

  setWeatherCondition(condition: WeatherCondition) {
    return this.request<{ condition: WeatherCondition; receivedAt: string; source: 'api' }>(
      'POST', '/api/v1/weather/conditions', { body: { condition }, auth: true },
    );
  }

  async listNotifications(): Promise<ApiNotification[]> {
    const result = await this.request<{ notifications: ApiNotification[] }>(
      'GET', '/api/v1/notifications', { auth: true },
    );
    return result.notifications;
  }

  createNotification(input: CreateNotificationInput): Promise<ApiNotification> {
    return this.request<ApiNotification>('POST', '/api/v1/notifications', { body: input, auth: true });
  }

  updateNotification(id: string, patch: UpdateNotificationInput): Promise<ApiNotification> {
    if (Object.keys(patch).length === 0) {
      throw new Error('updateNotification requires at least one field');
    }
    return this.request<ApiNotification>(
      'PATCH', `/api/v1/notifications/${encodeURIComponent(id)}`, { body: patch, auth: true },
    );
  }

  async deleteNotification(id: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/notifications/${encodeURIComponent(id)}`, { auth: true });
  }

  private async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth) headers.Authorization = `Bearer ${this.connection.token}`;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      // No HTTP response at all: connection refused, DNS/route failure or timeout.
      throw new DashboardApiError(0, method, path, String(error));
    }

    if (response.status === 204) return undefined as T;

    const parsed = parseBody(await response.text());
    if (!response.ok) {
      throw new DashboardApiError(response.status, method, path, parsed);
    }
    return parsed as T;
  }
}
