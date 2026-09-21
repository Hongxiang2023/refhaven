# Refhaven user guide

This guide covers the current local desktop/browser app. Start with [the demo](demo.md) if you want to explore using fictional data. Refhaven is an early preview: keep backups and review generated references before submission.

## Contents

- [Install and open Refhaven](#install-and-open-folio)
- [Add and edit papers](#add-and-edit-papers)
- [Organize your library](#organize-your-library)
- [Read PDFs and create reading views](#read-pdfs-and-create-reading-views)
- [Ask a paper with optional AI](#ask-a-paper-with-optional-ai)
- [Generate and revise manuscript references](#generate-and-revise-manuscript-references)
- [Save papers with the browser connector](#save-papers-with-the-browser-connector)
- [Back up, restore, and move your library](#back-up-restore-and-move-your-library)
- [Use a cloud-provider folder](#use-a-cloud-provider-folder)
- [Troubleshooting and limits](#troubleshooting-and-limits)

## Install and open Refhaven

Follow the [installation guide](install.md): Apple silicon Macs can use the downloadable app; other platforms can run from source. Browser mode opens at `http://127.0.0.1:47821/papers`; the local service must keep running. Desktop mode starts its own service. Stop one mode before starting the other with the same library.

No Refhaven account is required. Locally available PDFs, organization, reading caches, and formatting with installed citation styles work offline. Online-only PDFs need your cloud provider to download them first. Public metadata lookup, connector publisher downloads, style downloads, and cloud AI require internet access.

## Add and edit papers

### Look up a PMID, DOI, or arXiv ID

1. Choose **Add paper / PMID**.
2. Enter a PubMed ID, DOI/doi.org URL, or arXiv ID. When multiple lookup fields are filled, PMID is tried first; otherwise DOI is preferred over arXiv.
3. Choose **Find paper details** and review the returned title, authors, year, journal/conference, reference type, and identifiers.
4. Optionally attach a PDF and choose **Save paper**.

You can also enter metadata manually. Separate authors with semicolons; `Family, Given; Family, Given` helps preserve name order. Separate tags with commas. Choose **Conference paper** or **Preprint** where appropriate; journal articles, books, chapters, reports, theses, and manuscripts are also offered.

Lookups use PubMed, Crossref, or arXiv. A DOI lookup/save may discover a verified PMID. Identifier availability varies by provider and discipline; no PMID is required to keep or cite a reference.

To correct a paper, select it and choose **Edit** in Reference details. Edit metadata there when you need a revised reference. Compatible library metadata takes precedence over an exported Word file's older snapshot on the next generation. Conflicting identifiers need correction rather than automatic merging.

### Import or attach PDFs

Choose **Import PDF**, select one or multiple files, or drag PDFs into the library. A single PDF opens metadata review; a batch uses filenames as initial titles. Review those titles and fill in identifiers afterward. Importing a PDF does not guarantee complete scholarly metadata extraction.

For a reference without a file, choose **Attach PDF**. Use **Edit → Replace PDF (optional)** to replace an attachment. The original PDF bytes are retained. Exact duplicate files share stored PDF data; this does not merge the reference records themselves.

Imports stream to disk without a 50 MB application limit. Disk space and OS/browser constraints still apply. Very large PDFs are better imported from disk than downloaded through the connector.

### Import another reference library

Choose **Import references** and select `.ris` or a Refhaven reference-export `.json` file. Imports skip recognized duplicate IDs, PMIDs, DOIs, or source URLs. These files contain reference metadata, not the original PDFs; attach those separately. Reference-import files must be under 20 MB. Arbitrary BibTeX import is not supported.

## Organize your library

- **All papers** shows the complete library. **Reading list** includes papers not marked Finished. **Starred** shows your starred items.
- Use the search box for titles, authors, tags, journal names, PMIDs, or DOIs; it searches reference metadata rather than all PDF text.
- Filter by **To read**, **Reading**, or **Finished**, and sort by **Recent**, **Title**, or **Year**.
- Create a collection with **＋ New**, then assign a selected paper using its Collection dropdown. Each paper belongs to one collection. Manage a collection to rename or remove it; removing one moves its papers to Unfiled and keeps their PDFs and notes.
- Use **Edit** to manage tags and metadata. The star button marks a paper as a favorite.
- Reading notes save automatically after a short pause or when the field loses focus. Check **Saved** before closing; a failed save shows a retry message.
- In **Reading notes**, switch between **Edit** and **Preview** to read your Markdown with headings, lists, links, code blocks, and tables rendered. Preview displays the current draft; saving still follows the status below it.

### Use reading notes in Obsidian or another editor

Refhaven saves each paper's freeform **Reading notes** as a plain Markdown file in `notes/` inside your current library folder. Open **Library & connector → Markdown notes → Copy notes folder path** to find it. In Obsidian, choose **Open folder as vault** and select that `notes` folder. A local AI tool can read the same files if you give it access to that folder. No Obsidian plugin or account connection is required.

The filename starts with the paper's title and ends with a stable paper key. It keeps its original name if you later rename the paper in Refhaven; do not remove the key suffix. You may edit the Markdown in Obsidian or another text editor. Refhaven checks the files while open and shows external changes in the reading note field. Changes made in Refhaven update the file. If both editors change the same note, Refhaven rejects the stale in-app save and asks you to copy your draft before reloading; it never silently merges conflicting text. Keep a backup before bulk edits. Removing or renaming a note file is not a deletion command: Refhaven may recreate it from its library copy.

This sync covers the freeform Reading notes field. Highlights and notes attached to selected passages remain in `library.json`; they are still included in a full library backup. The Markdown files in `notes/` move with a selected library folder and are included in full compressed backups. Obsidian's optional `.obsidian` settings folder is left where it was; reopen the moved `notes/` folder as a vault if you move your library. If the library is in a cloud-provider folder, keep Refhaven open on only one computer at a time and wait for provider sync before switching computers.

Opening a To read paper's PDF changes its status to Reading. Set Finished yourself after reading. **Copy BibTeX citation** copies the selected paper's export text. **Delete reference** asks for confirmation and removes the reference and its attachment association; a shared PDF remains if another reference needs it. Make a backup before removing valuable work.

## Read PDFs and create reading views

### Original PDF

Choose a paper with an attachment, then **Read PDF**. The original viewer supports the browser's built-in PDF controls. Use **Download PDF** or **Open PDF in a new tab** when needed. Reading notes are available alongside the original.

### Optional reading view

1. Switch to **Reading view** and choose **Generate reading view**.
2. Wait for local extraction, or use **Cancel** to stop it.
3. Navigate with **Go to section** or **Go to page**. Select **Text size** for a more comfortable text pane.
4. Use **Check original** beside a page whenever a passage or layout needs verification.

The reader extracts selectable text, common headings, figures and legends. Results may include subsections. Detected display equations are preserved as small PDF crops rather than editable mathematics. Bibliographies are omitted from the reading text and remain in the original PDF.

Journal rules include Nature-family layouts, Nature Computational Science, Nature Cell Biology, Nature Machine Intelligence, Cell Reports, Science Advances, and common heading/column patterns. These rules do not guarantee correct extraction for every article, publication date, or supplement. [Journal coverage notes](reading-journal-coverage.md) describe the scope.

### Figures, highlights, and notes

Use the figure dropdown or arrows to browse detected figures. The legend appears below the image. **Text on this page** moves the text pane; **Open original at page** opens the source PDF. A full-page preview means the crop boundaries were uncertain.

Use the zoom slider or Ctrl/Cmd-scroll over the preview (25–600%). Drag to pan; keyboard arrow keys and scrollbars are alternatives. **Fit width** resets the view. Higher zoom can render a sharper crop locally from the original PDF, but cannot recover detail absent from its source image.

Select text in the article pane, choose yellow, green, blue, pink, or purple, then choose **Highlight selection**. To attach a note to a passage, select the passage and choose **Add note to selection**, write the note, and save it. Existing annotations can be opened from the marked text or the saved-annotations list to edit their note or color. Cancel leaves the saved annotation unchanged. For selections spanning several paragraphs, the note is attached to the first highlighted paragraph. Overlapping highlights use the later saved highlight’s color; the saved list retains each annotation. Older highlights remain yellow. If an updated extraction no longer locates the exact quote, it stays listed rather than being placed on unrelated text. Notes and highlights belong to the reference, not the cache. They are not annotations written into the original PDF.

### Cache and performance

A reading cache is generated on this computer and reused offline. Identical PDFs share one cache. Existing older caches show **Update reading view** when newer parsing rules are available. Updating replaces that PDF's cached extraction; it does not continually accumulate copies.

Caches add disk use. Refhaven loads a paper's reading cache when that reading view is opened; generating more reading views does not mean every cache is loaded during normal startup. Actual opening speed still depends on the library, computer, PDF, and cache size.

**Remove reading cache** deletes the derived view while keeping the PDF, notes, highlights, and chat. Full compressed backups omit caches because they can be regenerated; copying the local application-data folder includes them. When the library is moved to a provider folder, reading caches remain in that local application-data folder. Storage totals appear under **Library & connector**.

Reading extraction supports up to 500 pages, a 16 MiB encoded-image budget, and a 24 MiB total cache limit. These are reading-view limits, not PDF import limits. Scanned and password-protected files, complex tables, unusual columns, and inline mathematics may need the original viewer. OCR is not included.

## Ask a paper with optional AI

Paper chat is optional. Opening or importing a PDF does not send it to an AI provider.

1. Generate its reading view, then choose **Ask this paper → Connection**.
2. Choose **ChatGPT account**, **OpenAI API**, or **Claude API** and save the connection. API connections need your key and an available model ID.
3. For ChatGPT, use **Start ChatGPT sign-in**, continue through the browser link, then **Check connection**. This currently requires macOS and an installed Codex CLI or Codex/ChatGPT runtime. Other platforms can use API connections.
4. Choose **Enable AI & summarize this paper** to send extracted paper content and request the initial summary.
5. Ask a question. You can include the selected text or opt into a figure/equation image using the selector. Check page links against the source.

Summaries and follow-ups use bounded paper excerpts and recent conversation. A long-paper answer may be labeled as incomplete. Figure/equation selection supplies available cached images and legends; equation numbering follows detected order and can differ from the printed paper. Text-only context cannot reliably explain images that were not supplied.

**Stop** cancels an active request. **Disable AI** stops further use until enabled again and preserves history. **Clear conversation** deletes saved chat and disables consent. Changing providers requires enabling that provider for the paper.

Cloud AI uses internet and your provider's subscription limits or separately billed API usage. Extracted content, questions, recent chat, and selected images go to that provider. AI can make mistakes; page links identify supplied context rather than prove the answer. Responses currently arrive as completed answers, not streamed tokens.

Conversation history is local and included in full backups. Connection settings, keys, and isolated ChatGPT runtime credentials are excluded. Desktop API keys use encrypted OS storage when available; otherwise keys stay in memory. See [AI implementation and privacy notes](ai-reading.md).

## Generate and revise manuscript references

### Insert identifiers while writing

Put one reference or a group in parentheses:

| What you have | Marker |
| --- | --- |
| Modern numeric PubMed ID | `(36599988)` |
| Several PubMed IDs | `(36599988, 40903587)` |
| Explicit PMID, including short IDs | `(PMID: 12345)` |
| DOI | `(doi:10.1038/nphys1170)` |
| arXiv ID | `(arxiv:1706.03762)` |
| Mixed identifiers | `(PMID: 36599988; doi:10.1038/nphys1170; arxiv:1706.03762)` |
| Saved paper without a public identifier | Use **Copy citation marker** to obtain `(folio:its-local-id)`. |

These examples illustrate syntax only. Numeric shorthand recognizes 7–9 digit PMIDs; shorter IDs need `PMID:`. Bare numbers in running prose, ordinary years such as `(2024)`, and already formatted `[1]` are not treated as identifiers. You can type numeric PMIDs directly; copying a marker from Refhaven is optional. Keep a marker within one paragraph.

For multiple references at one location, write one parenthetical group. Refhaven resolves the identities, deduplicates supported aliases, and lets the selected citation style format/order the cluster. Repeated references reuse their identity; numbering and author–date formatting depend on the style.

### Generate a manuscript

1. Choose **Generate references** in the library sidebar.
2. Paste marker-bearing text or upload a `.docx`. Your source file is not overwritten.
3. Select a **Citation style**. Common bundled styles include APA, Vancouver, Chicago author–date, Nature, Science, Cell, NEJM, IEEE, and Nature Medicine.
4. Leave **Look up missing identifiers** enabled when you want provider lookups. Optionally select **Save looked-up papers to my library**. Otherwise the temporary records are used only for this generator and its exports.
5. Choose **Generate references**, then inspect the manuscript preview, reference list, and warnings.
6. Resolve missing/conflicting identifiers before **Download Word document**. **Download plain text** is also available, but its formatted citations do not retain Word's revision controls.

Lookup sends identifiers to PubMed, Crossref, or arXiv, never the manuscript text. A paper already in the library or an intact exported document can be formatted offline. Temporary lookup sessions support up to 100 records; larger bibliographies can use saved library records.

### Add another journal style

Use **Search installed styles** to filter local styles. Under **Get more styles**, search the style repository and choose **Install**, or use **Import a CSL style** for a `.csl` file under 1 MB. Installed styles are available offline. Repository searches/downloads require internet and do not send your manuscript or library.

The workflow supports in-text citation styles, not styles requiring true footnotes or endnotes. Review formatting even when a journal-named style is available. [Citation style details](citation-styles.md)

### Revise an exported Word document

1. Keep a backup of the exported `.docx`.
2. Edit your prose in Word. Leave Refhaven's generated citation controls and bibliography intact.
3. Add new markers, such as `(40903587)` or `(36599988, 40903587)`, outside existing controls.
4. To change an existing citation's sources, remove its **entire citation control**, then insert the new marker. To remove a citation, remove its entire control. Retained controls can move with their text.
5. Upload the revised file into **Generate references**, resolve any new identifiers, select the desired style, and generate again.
6. Download the new Word document. Refhaven refreshes citations in the current manuscript order and replaces its managed bibliography rather than adding another copy.

Update author/title/year or other bibliographic corrections in **Reference details → Edit** in Refhaven. Compatible current library records take precedence over the snapshot stored in the document. Identity conflicts require correction; they are not silently switched to another paper.

Word exports include a limited snapshot of cited bibliographic metadata so an intact document can be revised without the original library. No library notes, PDF files, or credentials are included in that metadata. Share an exported manuscript only with people who should receive its references and manuscript content.

If a generated citation or reference list was manually changed, restore its intact control/list from your backup and make the correction through the supported workflow. Do not strip all content controls or paste formatted citation numbers as plain text and expect their identities to survive. Older exports without revision metadata require the original marker manuscript. This is a file upload/export workflow, not live integration inside Word or Google Docs.

Word conversion covers main-body paragraphs and tables, including markers split across text runs. Headers, footnotes, endnotes, and text boxes are unchanged. Accept or reject tracked changes in a copy before importing it. Word files must be under 20 MB compressed and 100 MB expanded. Review the final document's layout in your editor after export.

## Save papers with the browser connector

**Store status:** [Refhaven Connector 0.1.4 is available in the Chrome Web Store](https://chromewebstore.google.com/detail/refhaven-connector/ijpjnopkleehgbhflkkeiajhamehpghk). An Edge Add-ons listing has not been submitted. Firefox and Safari packages are not provided.

1. Keep Refhaven running and [install Refhaven Connector from the Chrome Web Store](https://chromewebstore.google.com/detail/refhaven-connector/ijpjnopkleehgbhflkkeiajhamehpghk).
2. In Refhaven, open **Library & connector → Copy connector pairing key**. Open **Refhaven Connector** from Chrome's Extensions menu, expand **Pair with Refhaven**, paste into **Connector token**, and choose **Save token**. Pin the connector for faster access.
3. Open an article page. Use **Save reference to Refhaven**, then **Attach available PDF** if offered. Keep the popup open while saving/downloading.

The connector reads supported scholarly citation metadata from the invoked page. PDF host access may require a browser permission. For university access, sign in through your library first. If capture fails, use **Open PDF in browser (check access)** or download the PDF yourself and attach it in Refhaven. Refhaven does not bypass publisher access restrictions.

**Replacing an unpacked copy:** Pair the Store copy separately; its browser ID differs from the unpacked copy. Confirm a reference saves, then remove the unpacked entry from `chrome://extensions` to avoid two connectors. Chrome updates the Store copy; updating the desktop app is separate.

**Manual setup for Edge or an unpacked connector:** Open **Library & connector → Copy folder path**. Visit `chrome://extensions` or `edge://extensions`, enable **Developer mode**, and choose **Load unpacked**. Select the entire connector folder containing `manifest.json`. On macOS, press Command–Shift–G in the picker to paste the path; on Windows, use Alt+D. Pair it as above. After a Refhaven update, choose **Reload** on its browser-manager card, then refresh the article page. Keep your pairing key private. To revoke it, stop Refhaven, remove only `connector-token` from the library folder, restart, and pair trusted connectors again.

## Back up, restore, and move your library

The exact folder is shown under **Library & connector**. Defaults are:

| Platform | Default library folder |
| --- | --- |
| macOS | `~/Library/Application Support/Folio` |
| Windows | `%LOCALAPPDATA%/Folio` |
| Linux | `~/.local/share/folio` or `$XDG_DATA_HOME/folio` |

Advanced users can set `FOLIO_DATA_DIR` before startup. Do not run two services against the same library.

**Export references** downloads Refhaven JSON with reference metadata, including notes/highlights where present, but without PDF attachments. Use this for reference transfer, not as your only PDF backup.

**Download full compressed backup**, in **Library & connector**, creates a `.tar.gz` with references, Markdown notes, referenced PDFs, and supported local library data such as conversations. It excludes regenerable reading caches and private pairing/API/account credentials. PDFs are losslessly archived rather than downsampled. Keep Refhaven open until the download finishes. A full backup reads every referenced PDF, so online-only PDFs download again and temporarily use local disk space.

To restore a downloaded backup:

1. Quit Refhaven and stop its local service.
2. Preserve the current library folder as a rollback copy.
3. Extract the archive. For the default local setup, restore its contents into the intended library folder, keeping `library.json` and `pdfs/` together and retaining other included library subfolders. For a moved library, restore `library.json`, `pdfs/`, and `citation-styles/` into the selected library folder; restore `paper-chat/` into the original local application-data folder, not the cloud folder.
4. Reopen Refhaven and check a few references, PDFs, notes, and conversations. Recreate reading caches as needed; pair the connector again if its token is absent.

You can also quit Refhaven and copy its folders to another disk. In the default setup, copying the entire library folder includes caches and may include private credentials. After moving a library, reference data/PDFs and private local data are in different folders; back up both if you need a complete manual copy. Treat any such copy as private. Never put your live library folder in a public repository.

For the earlier browser prototype, first export its reference backup and import the JSON here. Old browser-stored PDFs do not move automatically; download/re-attach them and keep the old data until migration is verified.

## Use a cloud-provider folder

This optional desktop feature changes where Refhaven stores its reference data and PDFs. Your installed OneDrive, Google Drive for desktop, Box Drive, or another compatible provider app handles uploads and online-only files. Refhaven does not sign into those services through OAuth, upload through a provider API, or guarantee that their syncing has finished.

### Move an existing library

1. Install and sign in to the provider’s desktop app. Confirm its managed folder is available in Finder or your file manager.
2. In Refhaven, download a **full compressed backup** and wait for it to finish. Stop other imports/downloads before moving.
3. Open **Library & connector → Choose library folder**. Create/select an **empty folder** inside the provider-managed location, then review the native confirmation. The chooser moves your current library; it is not an importer for an already populated second library.
4. Keep Refhaven open while it copies and verifies the files. Refhaven restarts using the new location, verifies the move, and cleans up the migrated source copies after successful activation. Do not manually delete the source to finish a move.
5. Reopen settings and use **Open folder** to inspect the selected location. Check a PDF, notes, and reference details, then wait for the provider’s upload to finish.

The moved files are `library.json`, `pdfs/`, `notes/`, and installed `citation-styles/`. Freeform reading notes are mirrored in `library.json` and individual Markdown files. Colors, highlights, and passage notes remain in `library.json`. Connector tokens, API/account credentials, paper conversations, and reading caches stay in the original **local application-data folder**. They are not moved into the provider folder by this feature.

### Free space after the upload

**Moving into a cloud folder does not itself make PDFs online-only.** After confirming the provider has uploaded the library, use its file-manager controls for `pdfs/`. Do not delete PDFs or drag them to Trash as a space-saving technique; a provider can sync those deletions.

| Provider | What to check |
| --- | --- |
| OneDrive on Mac | Files On-Demand lets uploaded PDFs become online-only through **Free up space**. Opening one downloads it again; **Always keep on this device** retains a local copy. [Microsoft instructions](https://support.microsoft.com/en-us/onedrive/save-disk-space-with-onedrive-files-on-demand-for-mac) |
| Google Drive for desktop | **Stream files** keeps most content in the cloud and downloads accessed files. **Mirror files** keeps a full local copy and does not provide the same space saving. [Google instructions](https://support.google.com/drive/answer/13401938?hl=en) |
| Box Drive | **Free up space** removes an offline copy without deleting the Box item. File/folder offline controls vary by version and platform; Box also uses a local cache. [Box guidance](https://support.box.com/hc/en-us/articles/29475996910867-Box-Drive-Frequently-Asked-Questions) |

Keep **`library.json` available offline** so Refhaven can open and update its reference database reliably. If your provider version cannot keep that file offline independently of the PDF folder, do not make the whole library online-only. Installed styles should also remain available locally when needed. Download the papers you need before working without internet.

The **PDF file size** shown in Refhaven is the logical size of its PDFs, not a promise about physical disk space currently occupied by provider placeholders or caches. Refhaven does not read every PDF simply to refresh that size statistic. Opening, parsing, backing up, or moving an online-only PDF reads its contents and can download it again. Use your provider and operating system’s storage information to assess actual disk use.

### Avoid conflicting edits

Use a library on **one computer at a time**. Quit Refhaven on the first computer, wait for its provider upload, and wait for downloads on the other computer before opening it there. Refhaven does not merge simultaneous database edits; provider conflict copies are not automatically combined. The folder chooser is for moving the current library into an empty destination, not a complete multi-computer setup or library-merging tool.

If the selected folder is unavailable, restore provider availability before reopening. Keep a separate backup: sync can propagate deletions and mistakes. There is no guarantee that a provider has finished uploading merely because Refhaven’s local move has completed.

## Troubleshooting and limits

| Symptom | What to check |
| --- | --- |
| Library will not open / port is busy | Stop other Refhaven instances and source services. Use the address printed by the running local service. Do not expose the port publicly. |
| Imported PDF has a filename as its title | Edit the reference, add an identifier, and use Find paper details. |
| No reading text or missing figures | Check the original PDF. Scans need OCR outside Refhaven; extraction may miss complex layouts. |
| Old reading layout remains | Use Update reading view when offered. Notes and highlights are retained. |
| Reference marker stays unchanged | Check parentheses, explicit prefixes for short IDs, missing records, or conflicting identifiers. Enable lookup when online. |
| Citation numbers cannot be revised | Use the intact Refhaven Word export with citation controls, or return to the original marker manuscript. Plain formatted numbers carry no recoverable identity. |
| Word import reports edited generated text | Restore intact citation controls/reference list, update metadata in Refhaven, and add new markers outside controls. Accept/reject tracked changes in a copy. |
| A style is unavailable | Search/install it or import an in-text CSL style. Footnote/endnote styles are not supported here. |
| Connector cannot save | Keep Refhaven running, check pairing, reload the extension after updates, and refresh the article page. |
| Reference saved but PDF failed | Check publisher access in your browser; download and attach it manually. |
| AI cannot connect | Check provider/model, key or sign-in state, network, and account limits. ChatGPT account mode currently requires macOS. |
| AI misses a result | Include the relevant selected passage or figure and verify the original; excerpt selection and model answers can be incomplete. |

Refhaven currently has no built-in cloud sync engine, simultaneous shared-library editing, full-text library search, editable PDF annotation layer, arbitrary BibTeX import, or live Word/Google Docs plugin. Keep a backup and review references and PDF extraction before relying on them for publication.

### Markdown notebook in the PDF reader

Open a paper with **Read PDF**, then choose **Notes** beside **Original PDF** and **Reading view**. Use **Source**, **Split**, or **Preview** to write Markdown and inspect the rendered note. Headings populate the notebook outline. Edits save automatically; the status shows whether a draft has saved. Switching reader tabs keeps the draft available.

The notebook shows your notes folder and a **Copy folder path** button. You can also find it under **Library & connector → Markdown notes**. Open that folder as an Obsidian vault to access the same `.md` files. Each filename includes the paper title and a stable identifying suffix; retain the suffix when renaming a note. If an external edit conflicts with an unsaved Refhaven draft, copy your draft before reloading instead of overwriting the external version.
