/** Error returned for any failed request to the dashboard. Status 0 means no response was received. */
export default class DashboardApiError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly body: unknown,
  ) {
    super(`Homey Dashboard API ${method} ${path} failed with HTTP ${status}`);
    this.name = 'DashboardApiError';
  }
}

export type Translate = (key: string) => string;

/**
 * Turns a dashboard API error into a short, translated message for flows and the
 * pairing view. Returns undefined for errors that are not from the API client.
 * The technical details stay in the app log.
 */
export function describeApiError(error: unknown, translate: Translate): string | undefined {
  if (!(error instanceof DashboardApiError)) return undefined;

  switch (error.status) {
    case 0: return translate('error_unreachable');
    case 400: return translate('error_badRequest');
    case 401: return translate('error_unauthorized');
    case 403: return translate('error_forbidden');
    case 404: return translate('error_notFound');
    case 409: return translate('error_cameraUnavailable');
    case 503: return translate('error_unavailable');
    default: return translate('error_generic');
  }
}
