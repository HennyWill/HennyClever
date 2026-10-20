# HennyClever

Change browser geolocation and Google search country from a compact Chrome popup. Choose a country or capital to apply its coordinates immediately, then select a language. Useful for local search research and testing location-aware websites.

## Features

- Location and language apply automatically, without a Save button.
- Search countries and capitals, save favorites, and return to recent locations.
- Light and dark themes follow the system appearance.
- Enable or disable the override; the toolbar badge shows the country code.
- Add allowed websites with a permission request for each domain.
- Optionally set the Accept-Language request header on permitted websites.

## Install from source

1. Download this repository and extract it.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select the folder containing `manifest.json`.
4. Disable any other installed copy of HennyClever to avoid conflicting overrides.

## Use

Open the extension, search for a country or capital, and select it. The choice applies automatically. Change the language if needed, then reload an existing search page to update its results. Use **Settings** to add other websites.

Google search requests use `gl`, `hl` and `uule` parameters. Search results also depend on IP address, account settings and other Google signals. The extension does not change your IP address or timezone and is not a VPN. Website restrictions and early geolocation requests can prevent an override from applying; do not rely on it to conceal your real location.

## Privacy

Preferences are stored in local Chrome storage. The chosen coordinates and language are exposed to websites where the override applies. There are no developer analytics or telemetry endpoints in the extension. See [Privacy policy](PRIVACY.md).

## Version 1.4.0

Automatic application of location and language, refreshed interface, system dark theme, corrected country badges, persistent favorites, improved keyboard search, and restoration of browser geolocation for new requests after disabling the override. Reload pages after changing site permissions.

## Support

Report problems through [GitHub Issues](https://github.com/HennyWill/HennyClever/issues). You can also [support the project](https://buymeacoffee.com/hennywill).

MIT license. HennyClever is an independent project and is not affiliated with Google.
