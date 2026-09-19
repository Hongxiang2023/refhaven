# Browser store submission draft

Refhaven Connector is a Manifest V3 extension for Chrome and Edge. Build the upload archive with `npm run package:connector`. Submit that ZIP through the browser store developer dashboard. The ZIP contains only the extension code and icons; it contains no library files or pairing keys.

## Listing copy

**Name:** Refhaven Connector

**Short description:** Save scholarly references and accessible PDFs to your local Refhaven library.

**Purpose:** While viewing a paper, open the connector to review its title, authors and PDF link. Choose Save reference, then optionally attach an accessible PDF. Refhaven must be running on the same computer.

**Support:** https://github.com/Hongxiang2023/refhaven/issues

**Privacy policy:** https://github.com/Hongxiang2023/refhaven/blob/main/docs/connector-privacy.md

**Listing screenshot:** `docs/assets/connector-store-screenshot.png` (1280 × 800). This uses the connector's current popup layout and clearly fictional paper metadata.

## Permission explanation

- `activeTab` and `scripting`: read citation metadata from the current article only when the user opens the popup.
- `storage`: keep the local Refhaven pairing key in the browser profile.
- `http://127.0.0.1:47821/*`: send the saved reference and optional PDF to the local desktop app.
- Optional `http://*/*` and `https://*/*`: request the specific publisher host only when the user chooses to attach a cross-site PDF; newly granted access is removed after the attempt.

**Privacy form:** Disclose active-page website content and URLs, saved citation/PDF content, and the locally stored pairing key even though Refhaven does not collect them on a remote service. The extension does not execute remote code. Check the final dashboard choices against the live code before submitting.

## Release gate

1. Install the packaged ZIP in a test Chrome and Edge profile and verify pairing, reference save, PDF permission and PDF failure behavior.
2. Prepare store screenshots and account ownership details; check the store privacy and permissions forms against `connector-privacy.md`.
3. Submit from the owner's Chrome Web Store and Edge Add-ons developer accounts. Keep store publication and public listing under owner approval.
4. After approval, replace the unpacked setup instructions with the store links. An unpacked installation and a store installation have different browser IDs, so users must pair the store version once and remove the old browser entry.

Store submission and review are external actions and are not performed by the source build.
