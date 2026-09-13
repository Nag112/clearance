# Clearance

Deterministic tool-output compressor for **GitHub Copilot Chat in VS Code**. It trims noisy CLI output (git, tests, installs, docker, …) before those tokens are sent to the model. No second LLM. Same input always produces the same output.

Processor strategies are a TypeScript reimplementation of ideas from [token-saver](https://github.com/ppgranger/token-saver) (Apache-2.0). See `NOTICE`.

## Install

```bash
cd clearance
npm install
npm run compile
```

Then in VS Code: **Extensions: Install from VSIX…** after `npx vsce package --no-dependencies`, or open this folder and run **Debug: Start Debugging** (F5) to load the extension in a new window.

## Use

1. Command Palette → **Clearance: Enable**
2. Keep using Copilot Chat and pick models as usual. Clearance does not add a model to the picker.
3. Status bar shows session savings.
4. **Clearance: Disable** removes only the marked settings block.

Enable writes a marked block into VS Code user `settings.json`:

- `github.copilot.advanced.debug.overrideCapiUrl`
- `github.copilot.advanced.debug.overrideProxyUrl`
- `github.copilot.chat.proxy.url` (second hook if the debug URL keys go away)
- `terminal.chat.tools.terminalProfile` for this OS

pointing at `http://127.0.0.1:<port>`. That is the same unofficial Copilot debug surface [Headroom](https://headroom-docs.vercel.app/docs/vscode-copilot) uses. If GitHub removes those settings, Disable still unwraps the block.

The chat terminal profile prepends PATH **shims** for common CLIs (`git`, `pytest`, `npm`, `docker`, …). Those shims run `clearance exec`, which compresses captured stdout/stderr with the same engine and keeps the child’s exit code. They only wrap when `CLEARANCE_WRAP=1` (set on that chat profile, not your everyday terminal). Interactive programs (`vim`, `ssh`, `less`, `git commit` without `-m`, …) are passed through. Copilot’s `runInTerminal` uses a PTY, so wrapping is not skipped just because stdout is a tty.

The proxy binds **loopback only**, forwards the incoming `Authorization` header and model id, and **fails closed** (HTTP 502) if the Copilot API is unreachable. It does not silently bypass compression.

## What is compressed

Historical `tool` / `function` / `tool_result` text on the way **to** the model (`POST /chat/completions` and `POST /responses`). The Copilot UI may still show raw tool output.

Not routed (same class of limitation as Headroom): telemetry, GitHub API, MCP discovery, embeddings, cloud agents.

## Engine rules

Tiny outputs are skipped. Huge outputs are capped with a marker. The first matching processor wins. Failed commands use the generic processor unless a specialist opts into failures. Vanished error-shaped lines are recovered. If the result is not smaller, the original is kept — except when secrets were redacted.

`cat` of source files is unchanged. `.env` / `.env.example` / `.env.template` are unchanged; other `.env.*` values are redacted.

## Request logs

Every non-health proxy request is appended to gitignored `.clearance/` in the workspace:

- `requests.jsonl` — one JSON object per request: full incoming body, compressed outgoing body, each tool's raw `input` / compressed `output`, processor name, byte counts, and ratio
- `summary.json` — running totals (`savedBytes`, `ratio`, per-processor breakdown) for efficiency checks

Authorization headers are never written. Set `CLEARANCE_LOG=0` to disable, or `CLEARANCE_LOG_DIR` to pick another directory.

## Tests

```bash
npm test
```

## Layout

- `src/engine/` — CompressionEngine, gates, processors
- `src/proxy/` — loopback HTTP proxy
- `src/cli/` — `clearance exec` wrapper
- `src/shell/` — PATH shim generator
- `src/vscode/settingsBlock.ts` — marked settings writer
- `src/extension.ts` — Enable / Disable / status bar
