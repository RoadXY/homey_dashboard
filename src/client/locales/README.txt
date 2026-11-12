HOMEY DASHBOARD - TRANSLATION FILES
====================================

This folder contains the dashboard's user-interface translations.

FILES
-----

- languages.json
  The language registry. This is the central list of languages available
  in the dashboard language selector.

- nl.json
  Dutch translations.

- en.json
  English translations and the fallback language.

- README.txt
  This guide.

ADDING A LANGUAGE
-----------------

Example: to add German:

1. Create a new translation file named de.json in this folder.
2. Copy the structure and keys from en.json into de.json.
3. Translate every value into German. Do not translate the keys.
4. Add a new entry to the "languages" array in languages.json:

   {
     "id": "de",
     "label": "Deutsch",
     "file": "de.json",
     "homeyCodes": ["de", "de-DE", "de-AT", "de-CH"]
   }

5. Keep the JSON syntax valid. Use double quotes around property names
   and string values, and separate entries with commas.
6. Save the files on the Ubuntu host in /opt/homey_dashboard/src/client/locales.\n7. Restart the dashboard container (no image rebuild is needed):\n\n   cd /opt/homey_dashboard\n   docker compose -f compose.prod.yaml restart dashboard\n\n8. Reload the dashboard page in the browser/tablet.

LANGUAGE REGISTRY FIELDS
------------------------

- id: The value stored in dashboard settings. Use a locale identifier
  such as "de", "fr", "nl-NL" or "en".
- label: The language name shown in the language selector. Prefer the
  language's own name, for example "Deutsch" or "Français".
- file: The translation JSON filename in this folder.
- homeyCodes: Homey language codes that should select this translation
  when the dashboard language is set to Automatic.

The "fallback" field in languages.json identifies the language used when
a translation key is missing or Homey's detected language is not registered.
Keep this value set to "en" unless you deliberately choose another fallback.

TRANSLATION KEYS
----------------

Translation keys must remain consistent across all language files.
Use en.json as the reference when adding keys. Add each new key to every
translation file and translate its value.

If a key is missing from a language file, the dashboard displays the
English fallback value when available; otherwise it displays the key.

IMPORTANT
---------

- Do not rename existing keys unless all language files and application
  references are updated together.
- Do not put secrets, API keys, PINs or personal data in translation files.
- Translation files are bundled into the frontend during the Docker build.
  A new language becomes available after the image is rebuilt and deployed.
- Adding a language requires both its translation JSON file and a registry
  entry in languages.json. No application component edits should be needed.
