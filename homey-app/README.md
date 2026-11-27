# Homey Dashboard – Homey app

This directory is reserved for the companion Homey Pro app.

The Homey app is a client/integration for the public API exposed by the Docker dashboard. It is responsible for Homey-side drivers, Flow cards and related app assets. It does not host or render the dashboard website; the Docker application remains the only dashboard runtime.

The app project will receive its own manifest, dependencies, build/test scripts and CI validation when implementation starts. Until then, the dashboard implementation lives in `../docker/` and shared technical documentation lives in `../docs/`.
