# Developer Guide

This folder contains technical documentation for developers who maintain or extend the Homey Dashboard.

The documents cover architecture, code paths, API contracts, runtime behavior, security boundaries, error handling and implementation decisions. User-facing instructions are in the [User Guide](../09-gebruikershandleiding/README.md).

## Topics

- [Central dashboard error area](dashboard-error-messages.md)
- [Runtime architecture, configuration and security](runtime-architecture-and-security.md)
- [Detailed inventory of Homey and dashboard errors](../03-dashboard/homey-foutmeldingen.md)
- [Notifications and Blockly developer guide](../02-architectuur/meldingen-blockly-developer-guide.md)
- [Notifications API architecture](../02-architectuur/meldingen-api.md)
- [Realtime dashboard updates](../03-dashboard/realtime-updates.md)
- [Quick Actions implementation](../../docs/quick-actions.md)

## Documentation rules

For every behavior, distinguish clearly between:

- **Current implementation:** what the code does today.
- **Approved design:** behavior explicitly agreed with the user.
- **Not implemented:** work that remains outstanding.

Never describe an approved design as if it were already implemented. Keep this documentation in English, including code comments and technical examples. User-facing dashboard strings must use the localization system rather than being hard-coded.
