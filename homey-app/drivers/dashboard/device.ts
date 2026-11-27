import Homey from 'homey';
import { DashboardClient, type DashboardConnection } from '../../lib/dashboard-api/client.js';

export const DEFAULT_PORT = 5173;

const SETUP_MESSAGE = 'Vul het IP-adres en de API-token in via de instellingen.';

/**
 * One device per Homey Dashboard container. Connection details live in the
 * device settings so they can be changed after pairing.
 */
export default class DashboardDevice extends Homey.Device {
  private client?: DashboardClient;

  async onInit() {
    try {
      this.client = this.createClient();
      if (!this.client) {
        await this.setUnavailable(SETUP_MESSAGE);
        return;
      }
      await this.setAvailable();
    } catch (error) {
      this.error('Initialising Homey Dashboard device failed', error);
    }
  }

  /** Throws when the device is not configured yet; flow cards rely on this. */
  getClient(): DashboardClient {
    if (!this.client) {
      throw new Error('Homey Dashboard device is not configured (host or token missing)');
    }
    return this.client;
  }

  async onSettings({ changedKeys }: { changedKeys: string[] }) {
    if (changedKeys.some((key) => ['host', 'port', 'token'].includes(key))) {
      this.client = this.createClient();
      if (this.client) await this.setAvailable();
      else await this.setUnavailable(SETUP_MESSAGE);
    }
  }

  private createClient(): DashboardClient | undefined {
    const host = String(this.getSetting('host') ?? '').trim();
    const token = String(this.getSetting('token') ?? '').trim();
    const port = Number(this.getSetting('port') ?? DEFAULT_PORT);
    if (!host || !token) return undefined;

    const connection: DashboardConnection = { host, port, token };
    return new DashboardClient(connection);
  }
}
