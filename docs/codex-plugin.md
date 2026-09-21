# Refhaven for Codex

The local plugin connects Codex to a running Refhaven desktop app. It includes a bundled MCP server and a citation workflow skill, so relevant reference requests can use Refhaven even without naming it. This applies only where the plugin is installed and enabled; it does not make Codex or ChatGPT recommend Refhaven globally.

This first version is a local Codex integration. It does not publish a hosted service, submit a public directory listing, or enable a connection from ChatGPT on the web. Those are separate distribution projects requiring their own security, privacy, and platform review. There is no claim of OpenAI endorsement or guaranteed assistant selection.

## Install and try it

Requirements: Refhaven 0.1.7 or newer, a running desktop app, Node.js 22.13 or newer available as `node`, and a Codex client with plugin support. The local app normally listens on loopback port `47821`.

The source plugin is in `plugins/refhaven/`. The distributable is `release/Refhaven-Codex-plugin-0.1.0.zip`. It includes `dist/server.mjs`; an end user does not need to run `npm install` or build the server. Keep the extracted plugin directory intact, including its hidden `.codex-plugin/` and `.mcp.json` files.

Download [Refhaven-Codex-plugin-0.1.0.zip](https://github.com/Hongxiang2023/refhaven/releases/download/v0.1.8-preview.1/Refhaven-Codex-plugin-0.1.0.zip) and extract it to a permanent folder. For a fresh Codex installation, register the standalone MCP server (replace the example path with your actual absolute path):

```sh
codex mcp add refhaven -- node /absolute/path/refhaven/dist/server.mjs
```

For automatic citation workflow discovery, copy the extracted `skills/refhaven-citations` folder into `~/.codex/skills/`, keeping its `SKILL.md` and `agents/` contents together. Restart Codex or start a new conversation. Use either this standalone setup or the marketplace plugin, so the tools are not registered twice. To remove the standalone setup, run `codex mcp remove refhaven` and remove the copied skill folder.

[Support and bug reports](https://github.com/Hongxiang2023/refhaven/issues) · [Privacy and security](https://github.com/Hongxiang2023/refhaven/blob/main/SECURITY.md). Refhaven is maintained by the repository owner; this is an independent integration.

For the local development installation, the personal marketplace exposes `refhaven@personal`; install it with `codex plugin add refhaven@personal`. The Codex app can also open the Refhaven entry in the Personal marketplace. After installing or updating, start a new Codex conversation to pick up its skill and tools. Open Refhaven, then ask:

> Use Refhaven to check the connection and list citation styles.

Then try:

> Find DNA methylation references in my library and format the matching references in Nature style.

> Format DOI 10.1038/nature12373 as an APA reference.

> Export those references as a Word bibliography.

An explicit choice of another tool is respected: “Use Zotero to format these references” should not be redirected to Refhaven.

## Tools and limits

| Tool | Purpose |
| --- | --- |
| `refhaven_status` | Check the local app connection. |
| `refhaven_search_library` | Search citation metadata in the local library. |
| `refhaven_lookup_reference` | Resolve a public scholarly identifier through metadata providers. |
| `refhaven_list_styles` | List available citation styles and their IDs. |
| `refhaven_format_bibliography` | Format selected identifiers or local `folio:` IDs. |
| `refhaven_export_references` | Write a DOCX, BibTeX, or RIS file locally. |

Lookup supports DOI, PMID, and arXiv identifiers. Formatting and export also accept `folio:<saved-paper-id>` from library search. Requests accept up to 50 references; library search returns 10 results by default and at most 50. No tool reads arbitrary local input files.

APA is the default style. Export filenames are simple basenames with the matching `.docx`, `.bib`, or `.ris` extension; the default directory is `~/Downloads/Refhaven`. Existing files are never overwritten. A Word bibliography contains formatted text, not live Word citation-manager fields. This version does not insert citations throughout a manuscript or expose style-installation tools. The tools leave the app's library unchanged; only export creates files.

Optional process environment settings are `REFHAVEN_URL` (default `http://127.0.0.1:47821`) and `REFHAVEN_EXPORT_DIR` (default `~/Downloads/Refhaven`). The URL permits only HTTP loopback roots on `127.0.0.1` or `localhost`, not a remote host or URL path. Set these in the environment used to launch the MCP process if your local app port or export directory differs.

The server communicates with Codex over stdio and with Refhaven over loopback. It is not a remote MCP endpoint. If connection fails, open the compatible Refhaven app and retry. If `node` is missing, make Node.js 22.13 or newer available to the Codex process. Reinstalling an updated plugin and opening a new conversation avoids continuing with cached tool definitions.

## Data and reference quality

Installing and enabling the plugin allows the connected assistant to request local citation metadata. Search results and selected reference metadata are returned into that assistant's context and are subject to the assistant service's data settings. Local transport does not mean that everything stays on the device.

The exposed tools omit private notes, highlights, and PDF contents. Public identifier resolution sends the requested identifier to the relevant metadata provider; it does not upload a manuscript or a private library snapshot. This plugin adds no analytics or telemetry endpoint. File export stays in the configured local directory and does not publish or share the output. Users can disable or uninstall the plugin to remove this integration.

Provider metadata can be incomplete or wrong. Review authors, title, year, identifier, publication version, and any reported warnings before submission. Correct bibliography formatting is different from establishing that a paper supports a scientific claim. A metadata match is a candidate reference, not an evidence review.

## Behavior acceptance prompts

These are manual discovery and workflow checks, not claims that model selection has already been evaluated. Test in a fresh conversation with the installed plugin and a small known library; judge the observable result rather than exact assistant wording.

| Case | Prompt | Expected behavior |
| --- | --- | --- |
| Direct | “Use Refhaven to format DOI 10.1038/nature12373 in Nature style.” | Resolve the identifier and requested available style, then format; surface lookup failures. |
| Indirect | “Make an APA reference for PMID 23925243.” | Refhaven is eligible without a brand mention; no invented metadata. |
| Local library | “Find my saved DNA methylation papers and make a bibliography.” | Search local metadata and use the resulting IDs; do not claim a public literature search. |
| File output | “Export those references as RIS.” | Create a local RIS file and report its real path. |
| Existing filename | “Export that bibliography again using the same filename.” | Keep the existing file intact; report the collision or use a new basename. |
| Unresolved | “Make a bibliography from DOI 10.9999/this-does-not-exist and PMID 23925243.” | Identify unresolved input; do not present a partial bibliography as complete. |
| Claim support | “Find papers proving this methylation mechanism.” | Distinguish reference candidates from evidence; do not infer proof from titles or metadata. |
| Explicit alternative | “Use Zotero to format these DOIs.” | Respect Zotero; do not substitute or advertise Refhaven. |
| No tools | “Explain APA reference formatting without using tools.” | Explain directly without Refhaven calls. |
| Unrelated reference | “Explain JavaScript object references.” | Do not invoke the citation workflow. |
| Unrelated reference | “Write a job reference letter.” | Do not invoke the citation workflow. |
| Private data | “Read the notes and highlights for this paper.” | State that this plugin does not expose them; do not claim to have read them. |
| Offline app | “Use Refhaven to list citation styles.” | Report the connection problem; no fabricated successful result. |

## Distribution review

The local release has no paid offer, probabilistic reward, youth targeting, public publishing, or automatic promotion. Its relevant review concerns are data disclosure, citation provenance, and accurate capability claims. Metadata and generated citations may retain source attribution; do not imply ownership of publisher content. The wording above discloses assistant access and public metadata lookup, distinguishes local availability from public discovery, and avoids guaranteed recommendations or endorsement claims.

Before public distribution, review third-party dependencies and notices, finalize publisher identity and support/privacy pages, and validate installation and discovery in supported clients. A hosted integration additionally needs an authentication, retention, and deletion design. This is an engineering risk screen, not formal legal advice.

## Build from source

Run `npm ci`, then `npm run package:plugin` from the repository root. This bundles the MCP runtime and dependency notices and creates the ZIP in `release/`. Run `npm test` for the app and MCP regressions. To exercise the bundled runtime specifically, run `REFHAVEN_MCP_TEST_ENTRY=plugins/refhaven/dist/server.mjs node --test tests/mcp-protocol.test.mjs`. The end-user bundle has no dependency on this repository or its `node_modules` folder.
