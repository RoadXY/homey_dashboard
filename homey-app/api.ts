import type DashboardDevice from './drivers/dashboard/device.js';
import { describeApiError } from './lib/dashboard-api/errors.js';

/** Subset of the Homey instance that the API handlers use. */
interface ApiHomey {
  app: unknown;
  drivers: { getDriver(id: string): { getDevices(): unknown[] } };
  __(key: string): string;
}

interface ApiContext {
  homey: ApiHomey;
}

function dashboards(homey: ApiHomey): DashboardDevice[] {
  return homey.drivers.getDriver('dashboard').getDevices() as DashboardDevice[];
}

/** Separator between device id and notification id in the delete route. Not used in either id. */
const ID_SEPARATOR = '|';

export default {

  /**
   * All dashboards known to the app, plus the active notifications this app
   * created on each of them. An unreachable dashboard is listed with reachable: false.
   */
  async getNotifications({ homey }: ApiContext) {
    const translate = (key: string) => homey.__(key);
    const devices = dashboards(homey);

    const results = await Promise.all(devices.map(async (device) => {
      const dashboard = {
        id: device.getData().id as string,
        name: device.getName(),
        host: String(device.getSetting('host') ?? ''),
        port: Number(device.getSetting('port') ?? 0),
        reachable: true,
        error: undefined as string | undefined,
      };
      try {
        const notifications = await device.getClient().listNotifications();
        return {
          dashboard,
          notifications: notifications.map((n) => ({
            deviceId: dashboard.id,
            dashboardName: dashboard.name,
            id: n.id,
            title: n.title,
            message: n.message,
            severity: n.severity,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
            expiresAt: n.expiresAt,
          })),
        };
      } catch (error) {
        dashboard.reachable = false;
        dashboard.error = describeApiError(error, translate) ?? translate('error_generic');
        return { dashboard, notifications: [] };
      }
    }));

    return {
      dashboards: results.map((r) => r.dashboard),
      notifications: results.flatMap((r) => r.notifications),
    };
  },

  /** Deletes one notification. The id has the form "<deviceId>|<notificationId>". */
  async deleteNotification({ homey, params }: ApiContext & { params: Record<string, string> }) {
    const translate = (key: string) => homey.__(key);
    const [deviceId, notificationId] = decodeURIComponent(params.id).split(ID_SEPARATOR);
    const device = dashboards(homey).find((d) => d.getData().id === deviceId);
    if (!device || !notificationId) {
      throw new Error(translate('error_notFound'));
    }

    try {
      await device.getClient().deleteNotification(notificationId);
    } catch (error) {
      const message = describeApiError(error, translate);
      if (message === undefined) throw error;
      throw new Error(message);
    }
    return { deleted: true };
  },

};
