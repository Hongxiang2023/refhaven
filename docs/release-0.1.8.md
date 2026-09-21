Refhaven 0.1.8 preview for Apple silicon Macs (macOS 13+).

### Changes
- Improved Nature Reviews Genetics reading views: preserve explicit spaces between tightly positioned words, keep section order, and improve figure/caption boundaries.
- Added a dedicated Notes tab alongside Reading view and Original PDF, with Markdown editing, preview, and an outline. Notes remain Markdown files in the library's notes folder.
- Added the optional Refhaven Codex integration: library metadata search, DOI/PMID/arXiv lookup, citation styles, bibliography formatting, and Word/BibTeX/RIS export. The plugin ZIP includes its runtime and dependency notices; Node.js 22.13+ is required for this integration only.

For existing reading caches, choose **Update reading view** to apply the parser fixes. Notes and highlights are retained.

### Downloads
- **Refhaven-0.1.8-arm64.dmg**: desktop app for Apple silicon Macs.
- **Refhaven-Codex-plugin-0.1.0.zip**: optional local Codex integration. Follow the [installation and privacy guide](https://github.com/Hongxiang2023/refhaven/blob/main/docs/codex-plugin.md).
- **SHA256SUMS.txt**: checksums for both downloads.

The Codex integration returns requested citation metadata to your assistant and uses public providers for identifier lookup. It does not expose private notes, highlights, or PDF contents. It does not enable global ChatGPT recommendations or a hosted ChatGPT connection.

Validation: build/typecheck and 308 automated tests passed; bundled MCP protocol checks passed; production dependency audit reported zero vulnerabilities. The Mac app remains an early preview, ad-hoc signed and not Apple-notarized. Follow the [installation guide](https://github.com/Hongxiang2023/refhaven/blob/main/docs/install.md) for first launch. Review PDF extraction and generated references before relying on them.
