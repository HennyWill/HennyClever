# HennyClever privacy policy

Updated October 20, 2026. Applies to HennyClever version 1.4.0.

HennyClever lets you choose a simulated browser location and language for Google Search and websites you allow. The developer does not operate a data collection service for the extension. No accounts, analytics, advertising trackers or telemetry are included in the extension.

## Local preferences

Chrome local extension storage holds your selected capital and coordinates, country, language, favorites, up to five recent location choices, allowed domains, and feature switches. These preferences are not synchronized by the extension to a developer server. The history is a list of selected locations, not a log of visited pages.

## Information websites receive

When enabled, the extension adds your selected country, language and encoded coordinates to Google Search requests using gl, hl and uule parameters. Google receives these values as part of normal search requests.

On permitted websites, the extension overrides the browser geolocation API and may override navigator.language and navigator.languages. Those websites can read the simulated values. If you enable the request-language option, the selected language is also sent in the Accept-Language HTTP header on permitted websites.

These are locations you select in the extension. HennyClever does not read your real coordinates for the purpose of generating a simulated location. Disabling or resetting the override allows the browser to handle subsequent location requests under its normal permission controls. The extension is not a VPN or a guarantee that websites cannot infer your real location from your IP address, early location requests or other signals.

## Permissions

Storage saves the preferences listed above. Scripting applies the override on permitted pages. Declarative Net Request with host access changes search parameters and, optionally, the request-language header. Access to www.google.com is included; access to additional HTTP or HTTPS domains is requested when you add them. The extension uses permitted tab URLs to determine where to apply the override and does not send browsing history to the developer.

## External links

The optional support link opens Buy Me a Coffee. GitHub hosts the source and issue tracker. Those services and websites you visit handle their own network requests and data according to their respective policies.

## Control and deletion

You can disable the override without discarding your preferences. Reset location clears the selected location and language but retains favorites, recent choices and allowed domains. Remove allowed domains in Settings and reload their open pages. Uninstalling the extension removes its local storage from that Chrome profile.

## Contact and updates

Questions or privacy reports can be submitted through [GitHub Issues](https://github.com/HennyWill/HennyClever/issues). Policy changes will be recorded in this repository.
