# Refhaven Connector privacy

Refhaven Connector reads the active article page only when you open its popup. It extracts citation metadata and a possible PDF URL so you can decide whether to save them. It does not collect browsing history or run on pages in the background.

Choosing **Save reference** sends the metadata and the page URL to Refhaven running at `127.0.0.1:47821` on your computer. Choosing **Attach available PDF** downloads the PDF through your browser session and sends its bytes to that same local app. The connector does not send library content to a Refhaven cloud service. Publisher or institutional servers may receive the normal browser request needed to access a PDF.

The pairing key is saved in the browser's local extension storage. It is used only to authenticate requests to the local Refhaven app. The connector does not sync the key through a Refhaven account. You can remove the key by clearing the extension's local data or removing the extension. Removing the extension does not delete papers already saved in your Refhaven library.

The connector asks for the active tab, script injection, local browser storage and access to the local Refhaven address. For a PDF on another host, it asks for that host's permission when you choose to attach the PDF. A newly granted host permission is removed after that attempt. Existing permissions are left as you configured them.

Refhaven's local library stores saved references and PDFs until you remove them. For questions or deletion guidance, use the [Refhaven user guide](user-guide.md) or [project issues](https://github.com/Hongxiang2023/refhaven/issues).
