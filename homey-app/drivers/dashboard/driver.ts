import Homey from 'homey';
import { DashboardClient } from '../../lib/dashboard-api/client.js';
import { describeApiError } from '../../lib/dashboard-api/errors.js';
import { DEFAULT_PORT } from './device.js';

/** How long one discovery search runs before it stops and reports a time-out. */
export const DISCOVERY_TIMEOUT_MS = 15_000;

interface SelectDeviceInput {
  /** Set when the device was picked from the discovery results. */
  id?: string;
  name?: string;
  host: string;
  port?: number | string;
  token: string;
}

interface PairDevice {
  name: string;
  data: { id: string };
  settings: { host: string; port: number; token: string };
}

interface MdnsResult {
  id: string;
  address: string;
  port?: number;
  name?: string;
}

interface DiscoveredDashboard {
  id: string;
  name: string;
  host: string;
  port: number;
}

interface DiscoveryStatus {
  searching: boolean;
  timedOut: boolean;
  remainingMs: number;
  results: DiscoveredDashboard[];
}

export default class DashboardDriver extends Homey.Driver {

  async onInit() {
    this.log('Homey Dashboard driver initialized');
  }

  async onPair(session: Homey.Driver.PairSession) {
    // The device chosen in the pair view; the list_devices step shows only this one.
    let selected: PairDevice | undefined;
    let searchStartedAt: number | undefined;

    // The strategy is read from the app, not the driver, so manually added devices
    // are not tied to mDNS availability.
    const discoveredDashboards = (): DiscoveredDashboard[] => {
      let strategy;
      try {
        strategy = this.homey.discovery.getStrategy('dashboard-mdns');
      } catch (error) {
        this.error('Discovery strategy dashboard-mdns not available', error);
        return [];
      }
      const results = Object.values(strategy.getDiscoveryResults()) as unknown as MdnsResult[];
      return results.map((result) => ({
        id: result.id,
        name: result.name ?? 'Homey Dashboard',
        host: result.address,
        port: result.port ?? DEFAULT_PORT,
      }));
    };

    const status = (): DiscoveryStatus => {
      const elapsed = searchStartedAt === undefined ? undefined : Date.now() - searchStartedAt;
      const searching = elapsed !== undefined && elapsed < DISCOVERY_TIMEOUT_MS;
      return {
        searching,
        timedOut: elapsed !== undefined && !searching,
        remainingMs: searching && elapsed !== undefined ? DISCOVERY_TIMEOUT_MS - elapsed : 0,
        results: discoveredDashboards(),
      };
    };

    // Starts (or restarts) a search. The view polls discovery-status while it runs.
    session.setHandler('discovery-start', async () => {
      searchStartedAt = Date.now();
      return status();
    });

    session.setHandler('discovery-status', async () => status());

    session.setHandler('select-device', async (input: SelectDeviceInput) => {
      const host = String(input.host ?? '').trim();
      const port = Number(input.port || DEFAULT_PORT);
      const token = String(input.token ?? '').trim();

      const translate = (key: string) => this.homey.__(key);

      if (!host) throw new Error(translate('error_missingHost'));
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(translate('error_invalidPort'));
      if (!token) throw new Error(translate('error_missingToken'));

      const client = new DashboardClient({ host, port, token });
      try {
        if (!(await client.isReachable())) throw new Error(translate('error_unreachable'));
        if (!(await client.verifyToken())) throw new Error(translate('error_unauthorized'));
      } catch (error) {
        const message = describeApiError(error, translate);
        if (message === undefined) throw error;
        this.error('Pairing check failed', error);
        throw new Error(message);
      }

      selected = {
        name: input.name?.trim() || `Homey Dashboard (${host})`,
        data: { id: input.id ?? `manual:${host}:${port}` },
        settings: { host, port, token },
      };
      return true;
    });

    session.setHandler('list_devices', async () => (selected ? [selected] : []));
  }

}
