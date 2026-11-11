# Docker-daemon controle na buildfout – 11 november 2026

Na de tijdelijke fout `NotFound: forwarding Ping: no such job` heeft de gebruiker `docker info` uitgevoerd.

Resultaat:
- Docker Client: 29.1.3
- Docker Server: 29.1.3
- Docker Compose plugin: 2.24.6
- Storage driver: overlay2
- Ubuntu 22.04.5 LTS, kernel 5.15.0-198-generic
- Docker rapporteert 18 containers, waarvan 15 running
- `docker info` eindigde zonder foutmelding en de daemon is bereikbaar.

Conclusie: er is geen aanwijzing voor een algemene Docker-daemonstoring. De eerdere fout `NotFound: forwarding Ping: no such job` kan een tijdelijke BuildKit/buildsessiefout zijn geweest. De nieuwe image op basis van commit `0f1c613` is hiermee nog niet gevalideerd.

Vervolg: voer `~/bin/homey-dashboard-update.sh` opnieuw uit. Bij succes bevestig containerstatus, API healthcheck en Homey-status. Bij een herhaling van de fout: verzamel `docker compose ps`, de volledige buildfout en eventueel `docker buildx ls` voordat er wijzigingen aan Docker/BuildKit worden gedaan.
