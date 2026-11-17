# Developer Guide

This folder contains technical documentation for developers who maintain or extend the Homey Dashboard.

The documents cover architecture, code paths, API contracts, runtime behavior, security boundaries, error handling and implementation decisions. User-facing instructions are in the [User Guide](../09-gebruikershandleiding/README.md).

## Project status and phases

The single source of truth for the active project phase, implementation progress across all phases, completed early work and outstanding scope is the [central project phase and status overview](../06-fases/README.md). Do not infer current phase status from historical phase labels in individual design or implementation documents.

## Topics

- [Central project phase and status overview](../06-fases/README.md)
- [Central dashboard error area](dashboard-error-messages.md)
- [Runtime architecture, configuration and security](runtime-architecture-and-security.md)
- [Detailed inventory of Homey and dashboard errors](../03-dashboard/homey-foutmeldingen.md)
- [Notifications and Blockly developer guide](../02-architectuur/meldingen-blockly-developer-guide.md)
- [Notifications API architecture](../02-architectuur/meldingen-api.md)
- [Realtime dashboard updates](../03-dashboard/realtime-updates.md)
- [Quick Actions implementation](../../docs/quick-actions.md)
- [Settings UI design system and theme tokens](settings-design-system.md)
- [Weather icon rendering and pack coverage](weather-icons.md)

## Documentation lifecycle and final structure

The long-term goal is to keep only two maintained project documentation guides:

1. **User Guide** — the complete, practical guide for people using the dashboard.
2. **Developer Guide** — the complete technical reference for architecture, implementation, configuration, APIs, operational procedures and development decisions.

Supporting documents, design notes, investigation records and temporary implementation references may be created during active development. They are working documentation, not automatically part of the final documentation set.

The following rules apply throughout development:

- Capture relevant decisions and implementation details in the appropriate working document when they are made.
- Move all information that is still relevant to operating, using, maintaining or extending the dashboard into the User Guide or Developer Guide as appropriate.
- Keep the two guides accurate as the implementation changes. Clearly distinguish current implementation, approved design and work not yet implemented.
- Do not delete or archive supporting documentation merely because its feature has been implemented.
- Before removing supporting documentation, audit it and verify that every piece of relevant information has been transferred to one of the two guides. Preserve necessary context, constraints, rationale and links to source code.
- Only after both guides are complete enough to stand on their own and have been reviewed for completeness may the remaining supporting project documentation be removed or archived.
- Perform that final consolidation deliberately, checking internal links and repository references so that no required information or navigation is lost.

This is a documentation cleanup milestone, not a restriction on creating temporary or focused documents during development. Until the final audit is explicitly completed, supporting documentation remains available as project reference material.

## Documentation rules

For every behavior, distinguish clearly between:

- **Current implementation:** what the code does today.
- **Approved design:** behavior explicitly agreed with the user.
- **Not implemented:** work that remains outstanding.

Never describe an approved design as if it were already implemented. Keep this documentation in English, including code comments and technical examples. User-facing dashboard strings must use the localization system rather than being hard-coded.
