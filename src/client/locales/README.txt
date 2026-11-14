HOMEY DASHBOARD - TRANSLATION FILES
====================================

Translations are stored in the persistent Docker data volume, not in the
container image and not in the source-code directory.

LOCATION INSIDE THE CONTAINER
-----------------------------

/app/data/locales/

The production Compose file already mounts the persistent
homey_dashboard_dashboard_data volume at /app/data. The dashboard creates
the locales directory and copies the default English and Dutch files into
it on the first startup. Existing files are never overwritten on restart.

FILES
-----

- languages.json: registry of languages shown in the dashboard.
- en.json: English translations and fallback language.
- nl.json: Dutch translations.
- README.txt: this guide.

ADDING A LANGUAGE
-----------------

Example: to add German, create de.json with the same translation keys as
en.json, translate the values, and add this entry to the languages array
in languages.json:

  {
    "id": "de",
    "label": "Deutsch",
    "file": "de.json",
    "homeyCodes": ["de", "de-DE", "de-AT", "de-CH"]
  }

Copy the new or edited files into the running container's persistent data
volume. One practical method is to prepare the files in a temporary folder
on the Ubuntu host and use docker cp:

  docker cp ./de.json homey_dashboard-dashboard-1:/app/data/locales/de.json
  docker cp ./languages.json homey_dashboard-dashboard-1:/app/data/locales/languages.json

Use the actual container name shown by 'docker compose -f compose.prod.yaml ps'
if it differs from the example above. To update an existing translation,
copy the changed JSON file to the same destination path.

Then restart the dashboard container:

  cd /opt/homey_dashboard
  docker compose -f compose.prod.yaml restart dashboard

Finally, reload the dashboard page in the browser/tablet. No Docker image
rebuild is needed for adding or editing translation files.

REGISTRY FIELDS
---------------

- id: locale identifier saved in dashboard settings, for example de or fr.
- label: language name displayed in the selector, preferably in its own
  language (Deutsch, Francais, Espanol).
- file: translation JSON filename in this directory.
- homeyCodes: Homey language codes mapped to this translation for Automatic.
- fallback: locale used when Homey's language is not registered or a key is
  missing. Keep this as en unless you intentionally change the fallback.

TRANSLATION KEYS
----------------

Keep keys identical in every language file. Use en.json as the reference.
Do not translate key names. If a key is missing, the English fallback value
is used when available.

When adding or changing user-visible text in the application, never hard-code
translated text in React components, dialogs, validation messages, Blockly
blocks, dropdowns, tooltips, or accessibility labels. Add a stable namespaced
key to BOTH nl.json and en.json and use the central translate()/t() function.
Keep the placeholder names identical in every language, for example
"Device {name} is unavailable" / "Apparaat {name} is niet beschikbaar".
For a new locale, copy the complete key set from en.json and translate every
value. Keep keys and interpolation placeholders unchanged.

Blockly's custom dashboard blocks use these same locale keys. Blockly's own
built-in editor controls currently use the Dutch language pack for Dutch and
fall back to the English language pack for every other locale. A future locale
can therefore be added through JSON without code changes, while Blockly's
built-in context menus remain in English until a matching Blockly language
pack is integrated.

RECENT I18N CLEANUP
-------------------

The dashboard UI now routes the previously hard-coded Dutch labels and
validation messages in the measurement-tile settings, quick-action pickers,
notification settings, and custom Blockly blocks through the central
translation function. Matching Dutch and English entries are maintained in
nl.json and en.json. Blockly condition validation errors use translation keys
as well.

The Dutch and English dictionaries currently contain 383 matching keys.
Number formatting uses the active locale, and detected Homey language names
are formatted with Intl.DisplayNames.

Verification note: the JSON files and key parity were checked after this
change. A full npm typecheck, test run, and Docker build still need to be run
in the project build environment.

IMPORTANT
---------

- The container reads locale files from /app/data/locales at runtime.
- The directory is part of the existing persistent Docker data volume, so
  files survive container recreation and image updates.
- The container's data volume is mounted read-write because settings are
  stored there too. The translation API only serves validated locale JSON
  filenames; never store secrets or private data in translation files.
- Default locale files are copied only when a file does not yet exist. Your
  custom translations are therefore preserved on every restart.
