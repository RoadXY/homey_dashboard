import Homey from 'homey';
import type DashboardDevice from './drivers/dashboard/device.js';
import DashboardApiError, { describeApiError } from './lib/dashboard-api/errors.js';
import type {
  ApiNotification,
  CameraPopupSound,
  NotificationSeverity,
  WeatherCondition,
} from './lib/dashboard-api/client.js';

interface DeviceArgs {
  device: DashboardDevice;
}

interface SetWeatherArgs extends DeviceArgs {
  condition: WeatherCondition;
}

interface CreateNotificationArgs extends DeviceArgs {
  title: string;
  message: string;
  severity: NotificationSeverity;
  /** Dropdown value: "0" means never expires, otherwise minutes as a string. */
  expiresInMinutes?: string;
}

interface UpdateNotificationArgs extends DeviceArgs {
  id: string | { id: string; name: string };
  title?: string;
  message?: string;
  severity?: NotificationSeverity;
}

interface NotificationIdArgs extends DeviceArgs {
  id: string | { id: string; name: string };
}

interface SearchArgs extends DeviceArgs {
  searchText: string;
}

interface ShowCameraArgs extends DeviceArgs {
  /** Homey camera device picked in the flow. Only id is used. */
  camera: { id: string };
  title: string;
  /** Only present on the cards that offer a sound. */
  sound?: CameraPopupSound;
  /** Dropdown value: minutes as a string. Only present on the cards that offer a duration. */
  expiresInMinutes?: string;
}

interface ExpirySearchArgs extends SearchArgs {
  /** Dropdown value: "0" means never expires, otherwise minutes as a string. */
  expiresInMinutes?: string;
}

/** Autocomplete and flow arguments can be a plain string or an {id, name} object. */
function idOf(value: string | { id: string }): string {
  return typeof value === 'string' ? value.trim() : value.id;
}

export default class HomeyDashboardApp extends Homey.App {

  async onInit() {
    this.registerFlowCards();
    this.log('Homey Dashboard Controller initialized');
  }

  private registerFlowCards() {
    const { flow } = this.homey;

    // Actions
    flow.getActionCard('set-weather-condition')
      .registerRunListener(this.guard(async (args: SetWeatherArgs) => {
        await args.device.getClient().setWeatherCondition(args.condition);
      }));

    flow.getActionCard('create-notification')
      .registerRunListener(this.guard(async (args: CreateNotificationArgs) => {
        const minutes = Number(args.expiresInMinutes ?? 0);
        const expiresAt = minutes > 0
          ? new Date(Date.now() + minutes * 60_000).toISOString()
          : undefined;

        const created = await args.device.getClient().createNotification({
          title: this.requireText(args.title, 'error_missingTitle'),
          message: this.requireText(args.message, 'error_missingMessage'),
          severity: args.severity,
          expiresAt,
        });
        return { id: created.id };
      }));

    // One card per field, so each card has only required arguments.
    const updateTitle = flow.getActionCard('update-notification-title');
    updateTitle.registerRunListener(this.guard(async (args: UpdateNotificationArgs) => {
      const title = this.requireText(args.title, 'error_missingTitle');
      await args.device.getClient().updateNotification(idOf(args.id), { title });
    }));
    updateTitle.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());

    const updateMessage = flow.getActionCard('update-notification-message');
    updateMessage.registerRunListener(this.guard(async (args: UpdateNotificationArgs) => {
      const message = this.requireText(args.message, 'error_missingMessage');
      await args.device.getClient().updateNotification(idOf(args.id), { message });
    }));
    updateMessage.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());

    const updateSeverity = flow.getActionCard('update-notification-severity');
    updateSeverity.registerRunListener(this.guard(async (args: UpdateNotificationArgs) => {
      if (!args.severity) throw new Error(this.homey.__('error_missingSeverity'));
      await args.device.getClient().updateNotification(idOf(args.id), { severity: args.severity });
    }));
    updateSeverity.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());

    const updateExpiry = flow.getActionCard('update-notification-expiry');
    updateExpiry.registerRunListener(this.guard(async (args: UpdateNotificationArgs & { expiresInMinutes?: string }) => {
      // "0" (Nooit) clears the expiry, so the notification stays until deleted.
      await args.device.getClient().updateNotification(idOf(args.id), {
        expiresAt: this.expiresAtFrom(args.expiresInMinutes),
      });
    }));
    updateExpiry.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());

    const deleteCard = flow.getActionCard('delete-notification');
    deleteCard.registerRunListener(this.guard(async (args: NotificationIdArgs) => {
      await args.device.getClient().deleteNotification(idOf(args.id));
    }));
    deleteCard.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());

    // Bulk deletion. Only notifications created through this app are affected.
    flow.getActionCard('delete-all-notifications')
      .registerRunListener(this.guard(async (args: DeviceArgs) => ({
        deletedCount: await this.deleteMatching(args, () => true),
      })));

    flow.getActionCard('delete-notifications-by-title')
      .registerRunListener(this.guard(async (args: SearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        return {
          deletedCount: await this.deleteMatching(args, (n) => n.title.toLowerCase().includes(text)),
        };
      }));

    flow.getActionCard('delete-notifications-by-message')
      .registerRunListener(this.guard(async (args: SearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        return {
          deletedCount: await this.deleteMatching(args, (n) => n.message.toLowerCase().includes(text)),
        };
      }));

    flow.getActionCard('delete-notification-by-exact-title')
      .registerRunListener(this.guard(async (args: SearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const deletedCount = await this.deleteMatching(args, (n) => n.title.trim().toLowerCase() === text);
        if (deletedCount === 0) throw new Error(this.homey.__('error_notFound'));
        return { deletedCount };
      }));

    flow.getActionCard('delete-notification-by-exact-message')
      .registerRunListener(this.guard(async (args: SearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const deletedCount = await this.deleteMatching(args, (n) => n.message.trim().toLowerCase() === text);
        if (deletedCount === 0) throw new Error(this.homey.__('error_notFound'));
        return { deletedCount };
      }));

    // Bulk expiry changes. Only notifications created through this app are affected.
    flow.getActionCard('update-expiry-by-title')
      .registerRunListener(this.guard(async (args: ExpirySearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const expiresAt = this.expiresAtFrom(args.expiresInMinutes);
        return {
          updatedCount: await this.applyToMatching(args, (n) => n.title.toLowerCase().includes(text),
            (id) => args.device.getClient().updateNotification(id, { expiresAt })),
        };
      }));

    flow.getActionCard('update-expiry-by-message')
      .registerRunListener(this.guard(async (args: ExpirySearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const expiresAt = this.expiresAtFrom(args.expiresInMinutes);
        return {
          updatedCount: await this.applyToMatching(args, (n) => n.message.toLowerCase().includes(text),
            (id) => args.device.getClient().updateNotification(id, { expiresAt })),
        };
      }));

    flow.getActionCard('update-expiry-by-exact-title')
      .registerRunListener(this.guard(async (args: ExpirySearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const expiresAt = this.expiresAtFrom(args.expiresInMinutes);
        const updatedCount = await this.applyToMatching(args, (n) => n.title.trim().toLowerCase() === text,
          (id) => args.device.getClient().updateNotification(id, { expiresAt }));
        if (updatedCount === 0) throw new Error(this.homey.__('error_notFound'));
        return { updatedCount };
      }));

    flow.getActionCard('update-expiry-by-exact-message')
      .registerRunListener(this.guard(async (args: ExpirySearchArgs) => {
        const text = this.requireText(args.searchText, 'error_missingSearchText').toLowerCase();
        const expiresAt = this.expiresAtFrom(args.expiresInMinutes);
        const updatedCount = await this.applyToMatching(args, (n) => n.message.trim().toLowerCase() === text,
          (id) => args.device.getClient().updateNotification(id, { expiresAt }));
        if (updatedCount === 0) throw new Error(this.homey.__('error_notFound'));
        return { updatedCount };
      }));

    // Camera popups. Optional settings have their own card, so each card only shows
    // the arguments it uses. Absent arguments are undefined and left out of the request.
    for (const id of [
      'show-camera-popup',
      'show-camera-popup-with-sound',
      'show-camera-popup-for-minutes',
      'show-camera-popup-with-sound-for-minutes',
    ]) {
      flow.getActionCard(id)
        .registerRunListener(this.guard(async (args: ShowCameraArgs) => {
          await this.showCamera(args);
        }));
    }

    flow.getActionCard('close-camera-popup')
      .registerRunListener(this.guard(async (args: DeviceArgs) => {
        await args.device.getClient().closeCameraPopup();
      }));

    // Conditions
    flow.getConditionCard('weather-condition-is')
      .registerRunListener(this.guard(async (args: SetWeatherArgs) => {
        const current = await args.device.getClient().getCurrentWeather();
        return current.category === args.condition;
      }));

    const activeCard = flow.getConditionCard('notification-is-active');
    activeCard.registerRunListener(this.guard(async (args: NotificationIdArgs) => {
      const id = idOf(args.id);
      const notifications = await args.device.getClient().listNotifications();
      return notifications.some((notification) => notification.id === id);
    }));
    activeCard.registerArgumentAutocompleteListener('id', this.notificationAutocomplete());
  }

  /**
   * Wraps a flow run listener so API failures show a short, translated message in
   * the flow. The technical error is still written to the app log.
   */
  private guard<A extends unknown[], R>(handler: (...args: A) => Promise<R>) {
    return async (...args: A): Promise<R> => {
      try {
        return await handler(...args);
      } catch (error) {
        const message = describeApiError(error, (key) => this.homey.__(key));
        if (message === undefined) throw error;
        this.error('Flow card failed', error);
        throw new Error(message);
      }
    };
  }

  /**
   * Runs action for every notification of this app that matches. Returns how many
   * were handled. A notification that is already gone (404) is skipped.
   */
  private async applyToMatching(
    args: DeviceArgs,
    matches: (notification: ApiNotification) => boolean,
    action: (id: string) => Promise<unknown>,
  ): Promise<number> {
    const targets = (await args.device.getClient().listNotifications()).filter(matches);
    let count = 0;
    for (const notification of targets) {
      try {
        await action(notification.id);
        count += 1;
      } catch (error) {
        if (error instanceof DashboardApiError && error.status === 404) continue;
        throw error;
      }
    }
    return count;
  }

  private deleteMatching(args: DeviceArgs, matches: (notification: ApiNotification) => boolean): Promise<number> {
    return this.applyToMatching(args, matches, (id) => args.device.getClient().deleteNotification(id));
  }

  /** Converts a dropdown value (minutes as a string) into an expiry timestamp. "0" means never. */
  private expiresAtFrom(minutesValue: string | undefined): string | null {
    const minutes = Number(minutesValue ?? 0);
    return minutes > 0 ? new Date(Date.now() + minutes * 60_000).toISOString() : null;
  }

  /** Shows the camera popup. Missing optional arguments are omitted, so the API applies its defaults. */
  private async showCamera(args: ShowCameraArgs): Promise<void> {
    const title = this.requireText(args.title, 'error_missingTitle');
    if (!args.camera?.id) throw new Error(this.homey.__('error_badRequest'));

    const minutes = Number(args.expiresInMinutes ?? 0);
    await args.device.getClient().showCameraPopup({
      title,
      deviceId: args.camera.id,
      expiresAt: minutes > 0 ? new Date(Date.now() + minutes * 60_000).toISOString() : undefined,
      sound: args.sound,
    });
  }

  /** Trims a required text argument and rejects empty values with a translated message. */
  private requireText(value: string | undefined, errorKey: string): string {
    const trimmed = value?.trim();
    if (!trimmed) throw new Error(this.homey.__(errorKey));
    return trimmed;
  }

  /**
   * Suggests active API notifications of the selected device. Free text is
   * still accepted, so IDs created elsewhere can be entered manually.
   */
  private notificationAutocomplete() {
    return async (query: string, args: DeviceArgs) => {
      if (!args?.device) return [];
      try {
        const notifications = await args.device.getClient().listNotifications();
        const needle = query.toLowerCase();
        return notifications
          .filter((n) => n.title.toLowerCase().includes(needle) || n.id.includes(needle))
          .map((n) => ({ id: n.id, name: `${n.title} (${n.severity})`, description: n.id }));
      } catch (error) {
        this.error('Autocomplete failed', error);
        return [];
      }
    };
  }

}
