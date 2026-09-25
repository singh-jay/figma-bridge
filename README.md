# Figma Bridge

A local MCP bridge for reading and editing the open Figma desktop document. The same tools work with any application framework. Your coding agent combines Figma data with your project's components, tokens and guidance to implement code.

Requires Node.js 22+ and Figma desktop. This release is verified on macOS; Windows desktop acceptance is not yet established. The editor and plugin must stay open. The bridge uses the public Plugin API, not Figma's hosted MCP or REST service. Normal file permissions and Figma plan restrictions still apply. Design data returned to your agent is processed by its configured AI service.

## Install from GitHub

Install from the public repository: [https://github.com/singh-jay/figma-bridge](https://github.com/singh-jay/figma-bridge). Git, Node.js 22+ and npm or Bun are required. The HTTPS URL does not require GitHub credentials or SSH setup.

From your project directory, install `main` with npm:

```sh
npm install --save-dev git+https://github.com/singh-jay/figma-bridge.git#main
npx --no-install figma-bridge init --project .
```

Or use Bun:

```sh
bun add --dev git+https://github.com/singh-jay/figma-bridge.git#main
bunx --no-install figma-bridge init --project .
```

The repository includes the built CLI, reusable modules, Figma plugin and schema. Commit your package manifest and lockfile to preserve the resolved version. To select a specific reviewed version, replace `#main` with its full commit SHA.

Continue with **Connect to Figma** below.

## Alternative: install a shared release

Install the supplied tarball from your project directory:

```sh
npm install --save-dev /path/to/local-figma-bridge-0.1.0.tgz
npx --no-install figma-bridge init --project .
```

## Connect to Figma

`init` adds `.figma-bridge/` to an existing `.gitignore`, preserving its contents and avoiding duplicate entries. If your project has no `.gitignore`, create one and add `.figma-bridge/` as prompted. Import the generated `.figma-bridge/plugin/manifest.json` in Figma desktop under Plugins → Development → Import plugin from manifest. Merge the generated `.figma-bridge/codex.toml` into your Codex MCP configuration, or use `.figma-bridge/mcp.json` with a compatible client. These snippets contain installation-specific paths but no credentials. Initialization does not modify your existing client configuration.

Run in one terminal:

```sh
npx --no-install figma-bridge start
```

Keep it running. In another terminal:

```sh
npx --no-install figma-bridge pair
```

Run **Figma Bridge** in Figma and paste the five-minute pairing code. Select a frame. Reconnect the configured MCP server if your agent has not discovered its tools yet. Closing the plugin requires a new pairing code; temporary socket disconnects reuse the current run's credential.

For the optional agent skill:

```sh
npx --no-install figma-bridge install-skill
```

This installs `$figma-bridge` in your personal Codex skills directory. Other agents can use the shipped `skills/figma-bridge/SKILL.md` with their own skill installation mechanism. The skill does not start the service or create a missing MCP connection.

## Project context

Edit `figma-bridge.config.json`. It is safe to commit this configuration. Example:

```json
{
  "version": 1,
  "targets": {
    "web": {
      "root": ".",
      "framework": "vue",
      "language": "typescript",
      "styling": "css-modules",
      "components": ["src/components"],
      "tokens": ["src/styles/tokens.css"],
      "guidance": ["AGENTS.md"]
    }
  }
}
```

Use any descriptive framework/styling strings; they are not a list of code generators. Profiles can describe multiple apps in a monorepo. `root` is relative to the project, and source paths are relative to that target root. References may point to shared packages inside the project, but may not escape its root. The schema is shipped at `schema/project.schema.json`.

No configuration is required for Figma reads, supported edits or exports. `design_context` adds verified source references and reports missing/ambiguous project mappings. It does not infer component identity from a layer's name or color, and it does not automatically generate application code. The agent reads the supplied sources and follows that project's framework and behavior contracts.

Each MCP adapter receives an explicit `--project` path and keeps context local to that adapter. One shared service can therefore support multiple projects. The project target and the Figma session are independent selections.

## Tools

Tools use the `figma_bridge_` prefix:

| Tool | Purpose |
| --- | --- |
| `sessions`, `selection` | Select an explicit connected document and node IDs. |
| `read_nodes`, `read_text` | Bounded design structure, layout, rich text and fingerprints. |
| `read_resources` | Resolve local components, styles, variables and aliases. |
| `export` | Export PNG, SVG or original image bytes to a local artifact. |
| `design_context` | Scoped design plus the adapter's optional project target. |
| `write_scope`, `apply` | Lease a scope and perform typed, fingerprint-checked changes. |
| `operation_status`, `cancel_operation` | Inspect outcomes and request cancellation. |

Supported writes include frame/text/rectangle creation, local component instantiation, allowlisted layout/fill/text changes, instance properties, existing variable bindings and scoped moves. The schemas advertise the current operations. Deletion, component-set authoring, new variable definitions, arbitrary JavaScript, remote library imports and whole-document regeneration are not exposed.

Keep the same MCP connection through lease acquisition, apply and release. Use fresh fingerprints and a new operation UUID for each new write. A result can be partial or unknown: inspect its receipt before deciding what remains to do. Never replay a lost creation under a new UUID. Reads and writes are not transactions; human collaborators can edit between calls. Closing the panel does not cancel a running operation. Cancellation takes effect at an operation boundary.

Reads indicate truncation and continuation IDs. Writes allow at most 50 operations. Exports are capped at 10 MiB and 16 megapixels. Remote resources are reported unavailable. Native fonts/export operations can still fail after a preflight. There is no headless access to closed files or automatic code/design sync.

## Diagnostics and local state

```sh
npx --no-install figma-bridge doctor
npx --no-install figma-bridge verify
npx --no-install figma-bridge inspect sessions
```

`verify` checks the shared service's tools and instructions. To inspect a design, pass an explicit session from `sessions` and the tool's schema arguments, e.g. `inspect selection --args '{"sessionId":"the-returned-session-id"}'`. `inspect` accepts only read-only tools; it never writes to the Figma document.

The daemon owns private credentials, receipts and exports in the local application state directory (on macOS, `~/Library/Application Support/Figma Bridge`). Use `--state-dir` consistently across commands if overriding it. Do not share that directory. Receipts are capped at 16 MiB; archive them while the service is stopped if full. Restarting never replays writes.

The default loopback port is 3846. A custom `--port` requires running `init` with the same port so both the plugin code and manifest match. Run `init --force` to refresh generated plugin assets after an update, then reopen/re-pair the plugin. Do not run an older bridge on the same port. The CLI will report a conflict; it will not stop another process. Development import is the supported distribution method; this package is not a published Figma Community plugin.

## Develop and share

```sh
npm ci
npm run typecheck
npm run build
bun test tests
npm run check
npm pack
```

Commit the generated `dist/`, `plugin/code.js` and `schema/` together with source changes after `npm run build`. Consumers pin the full commit SHA; their installs do not need a local build toolchain. Rebuilding an unchanged checkout should leave these generated files unchanged.

Node builds the distribution; Bun is only needed to run the source unit tests. The packed installation test in `scripts/verify-package.mjs` runs under Node and installs a tarball into an unrelated temporary project. It covers real MCP stdio and HTTP transports with controlled Figma peers; desktop acceptance is separate.

This is one package with internal protocol, Figma, bridge, project and CLI modules. The reusable `./figma`, `./serialize` and `./protocol` exports allow an existing plugin to share the engine without forking it. Existing project-specific builders belong in the consuming project. The tarball includes compiled code, plugin assets, schema, skill and documentation, and excludes tests, credentials and designs.

The GitHub repository is public. The package remains marked `private: true` to prevent accidental npm registry publication; it is installed directly from GitHub or a tarball. A general open-source license and registry name have not been assigned. Bundled dependency notices are included in `THIRD_PARTY_NOTICES.md`.
