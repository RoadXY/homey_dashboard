# mDNS-SD Service Discovery

**Status:** implemented on `phase_1_foundation`; live LAN verification pending  
**Service type:** `_homey-dashboard._tcp.local.`

## Purpose

Allow a Homey app to discover multiple Homey Dashboard installations on the same local network without asking users to enter host addresses or ports manually.

## Service identity

Each installation advertises:

| Field | Value |
|---|---|
| Service type | `_homey-dashboard._tcp.local.` |
| Transport | TCP |
| DNS-SD instance label | `Homey Dashboard - <friendly name> [<8-char ID prefix>]` |
| TXT `name` | Clean display name: `Homey Dashboard - <friendly name>` |
| SRV port | The running dashboard HTTP/API port |
| TXT `version` | `1` |
| TXT `api` | `/api` |
| TXT `id` | Persistent installation UUID |
| TXT `name` | Friendly instance name |

The DNS-SD instance label includes the first eight characters of the persistent UUID to make collisions highly unlikely. The Homey app should display the clean TXT `name` value, without the suffix. The full UUID is the stable identity for client-side configuration and must not be replaced by the friendly name.

## Name generation and configuration

On first startup, if no identity file exists, the backend selects two words from built-in Dutch word lists: an adjective and an animal (for example, `Vrolijke Panda`). It stores the generated name and UUID in `DATA_DIR/installation.json`.

The friendly name is editable on the **General settings** page in the **Dashboard identity** card. It is part of the normal general-settings save operation and is persisted in `DATA_DIR/settings.json`; the matching identity is updated in `DATA_DIR/installation.json`. The backend restarts the mDNS advertisement immediately after a successful save, without requiring a container restart. Existing installations keep their previously generated or configured name when upgrading. The installation UUID is retained when the friendly name changes.

The friendly name is validated so the complete service instance label, including its short UUID suffix, fits the DNS 63-byte label limit. Only letters, numbers, spaces, underscores and hyphens are accepted. The value is configuration and is not an authentication credential. The legacy `DASHBOARD_INSTANCE_NAME` environment variable is no longer supported; manage the name in General settings.

## Network deployment

The default production deployment (`compose.prod.yaml`) uses host networking and enables mDNS. The dashboard advertises via UDP multicast on `224.0.0.251:5353`.

The optional `compose.prod.bridge.yaml` deployment disables mDNS by default. A standard Docker bridge does not transparently forward link-local mDNS multicast between the container and the physical LAN. Setting `MDNS_ENABLED=true` in bridge mode alone does not solve that network boundary; use host networking or provide a separately configured multicast reflector/proxy.

The development Compose file disables mDNS to avoid advertising development instances.

If UDP 5353 cannot be bound or no suitable IPv4 interface is available, the backend logs a warning and continues serving HTTP. Check for host-level Avahi/mDNS socket coexistence during deployment validation.

## Homey app discovery flow

1. Browse for `_homey-dashboard._tcp.local.` (or enumerate services through `_services._dns-sd._udp.local.`).
2. Resolve the SRV record to obtain the target host and TCP port.
3. Resolve the target host's A record.
4. Read TXT metadata and display the `name` value to the user.
5. Store/use the `id` value as the stable installation identifier.
6. Call the discovered HTTP API at the advertised port, using the TXT `api` base path.

Discovery does not authenticate the client. API endpoints must continue to enforce their existing authentication and authorization rules.

## Implementation and verification

- Implementation: `src/server/mdns.ts`
- Startup integration: `src/server/index.ts`
- Automated tests: `src/server/mdns.test.ts`
- Persistent identity: `DATA_DIR/installation.json`

Automated tests cover name generation, input validation, persistence across restarts and stable UUID behavior when a configured name changes. Before treating LAN discovery as fully verified, test on the target Ubuntu host:

- mDNS advertisement and browsing from a second device on the same LAN;
- PTR, SRV, TXT and A record contents;
- coexistence with the host's Avahi service, if installed;
- discovery by the Homey app;
- persistence after container recreation and image updates;
- custom-name changes without changing the installation UUID.


The advertiser joins the mDNS multicast group on each eligible non-loopback IPv4 interface and sends announcements on each interface. It also publishes the standard DNS-SD service-enumeration PTR record for clients that first enumerate available service types. Query responses are sent directly to the requesting host, avoiding reliance on the host's default multicast route.


### Stable SRV target hostname

The SRV record target must not depend on `os.hostname()` inside the Docker container. Container hostnames may change when Portainer recreates a container and may not be resolvable by other LAN clients. The target is therefore `homey-dashboard-<8-char-installation-ID>.local.`; matching A records are advertised for the eligible host-network IPv4 addresses. The target remains stable when the friendly dashboard name changes and across container recreation as long as `DATA_DIR` is persisted.


### Rename cache behavior

A friendly-name change withdraws only the old service-instance PTR, SRV and TXT records with TTL 0. It must **not** withdraw the A record for the stable installation-specific host target: that A record is shared by the old and new service instance and remains valid across a rename. Sending an A-record goodbye during rename can make a discovery browser find the new instance but fail to resolve its SRV target after a cache refresh.
