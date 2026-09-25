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

## Sample agent prompts

Install the [Figma Bridge skill](skills/figma-bridge/SKILL.md) using `npx --no-install figma-bridge install-skill`, then paste one of these prompts into your coding agent. Keep the bridge service and paired Figma plugin running. For selection-based prompts, select the intended frame in Figma first. If several documents are connected, identify the intended file so the agent can resolve its session.

### Inspect a selected design

```text
$figma-bridge Read the selected frame in the connected Figma document.
Summarize its layout, typography, spacing, colors, components and variable
bindings. Export and inspect a PNG preview, and report any missing resources.
This is a read-only design review.
```

### Implement a component in this project

```text
$figma-bridge Implement the selected Figma frame as a reusable component for
the web target in figma-bridge.config.json. Use that target's framework,
existing components, tokens and styling conventions. Read the design and
inspect its PNG preview, then implement responsive and accessible behavior
using real data or explicit props. Run the relevant checks and compare the
rendered component with the design. Report any unsupported or ambiguous mappings.
```

Replace `web` with a target key from your project's configuration. The same workflow can target React, Vue or another framework; the agent implements the code using your project's sources.

### Create a design board in the current document

```text
$figma-bridge Create a new top-level frame named "Account settings exploration"
on the current page of the connected Figma document, beside the existing
frames. Make it 1440 pixels wide and lay out a heading and instances of the
existing local settings components. Reuse available variables and styles;
report missing components before substituting them. Preserve existing designs.
Read the new frame back, inspect a PNG preview, and report its node ID.
```

Here, a board means a frame inside an already open Figma Design document. The bridge does not create a new Figma file, page or component library.

### Make a scoped design edit

```text
$figma-bridge In the selected Figma frame, change the heading to "Account
settings" and set the frame's auto-layout gap to 24 pixels. Keep all other
content and styling unchanged. Read the edited nodes back and inspect an
updated PNG preview to verify the result.
```

### Bring a component up to date after a Figma edit

```text
$figma-bridge Compare the selected Figma frame with the existing
src/components/AccountSettings component for the web target. Describe the
visual differences, then update the component using this project's design
system. Preserve its public API and business behavior. Verify the rendered
result and report anything that could not be matched.
```

Replace the component path and target with real values from your project. Each request is an explicit read or edit; the bridge does not continuously synchronize Figma and code.

## Project context

Save `figma-bridge.config.json` in your project root. It tells the agent where your code and design system live so it can implement Figma designs using your project's conventions. This configuration is safe to commit.

### Configuration fields

| Field | Meaning |
| --- | --- |
| `version` | Configuration format version; use `1`. |
| `targets` | Named profiles for the apps or surfaces in your project. |
| `web` | An example target name you choose; names such as `admin` or `mobile` also work. |
| `root` | Target directory relative to the project root. Defaults to `"."`. |
| `framework` | Your UI framework, such as `react`, `solid`, `vue` or `vanilla`. |
| `language` | Your implementation language, such as `typescript` or `javascript`. |
| `styling` | Your styling approach, such as `tailwind`, `css-modules` or `css`. |
| `components` | Paths to existing component files or directories the agent should inspect and reuse. |
| `tokens` | Paths to files defining theme values such as colors, spacing and typography. |
| `guidance` | Paths to project instructions or design-system documentation. |

All source paths in `components`, `tokens` and `guidance` are relative to the target's `root`. Use paths that exist in your project. Target fields are optional; omit references you do not have or use empty arrays. Missing references are reported as unavailable.

### React with Tailwind

For a project with components in `src/components`, theme CSS in `src/index.css`, and instructions in `AGENTS.md`:

```json
{
  "version": 1,
  "targets": {
    "web": {
      "root": ".",
      "framework": "react",
      "language": "typescript",
      "styling": "tailwind",
      "components": ["src/components"],
      "tokens": ["src/index.css"],
      "guidance": ["AGENTS.md"]
    }
  }
}
```

### Solid, Vue and vanilla JavaScript

Use the same configuration structure and adjust the labels and paths for your project:

| Stack                       | `framework` | `language`     | `styling`       |
| --------------------------- | ----------- | -------------- | --------------- |
| React with Tailwind         | `"react"`   | `"typescript"` | `"tailwind"`    |
| Solid with Tailwind         | `"solid"`   | `"typescript"` | `"tailwind"`    |
| React with CSS Modules      | `"react"`   | `"typescript"` | `"css-modules"` |
| Vue with CSS Modules        | `"vue"`     | `"typescript"` | `"css-modules"` |
| Vanilla JavaScript with CSS | `"vanilla"` | `"javascript"` | `"css"`         |

Framework, language and styling values are descriptive strings, not a fixed list of code generators. Tailwind is a styling choice and can accompany React, Solid or another framework. Point `tokens` at the CSS or configuration files containing your actual theme definitions. For vanilla JavaScript, point `components` at the files or directories containing reusable DOM-rendering code; omit it if none exists. These example paths do not create files or install dependencies.

### Choose a target in your prompt

```text
$figma-bridge Implement the selected Figma frame for the web target.
Follow figma-bridge.config.json, reuse existing components and theme
values, and verify the rendered result.
```

Replace `web` with a key from `targets`. A single configured target can be selected automatically; multiple targets require an explicit choice. The target selects your code conventions, not a Figma document.

Profiles can describe multiple apps in a monorepo. For example, with `root: "apps/web"`, `components: ["src/components"]` points to `apps/web/src/components`, while `guidance: ["../../AGENTS.md"]` points to the project-root instructions. References may point to shared packages inside the project, but may not escape the project root. The schema is shipped at `schema/project.schema.json`.

No configuration is required for Figma reads, supported edits or exports. `design_context` adds verified source references and reports missing or ambiguous project mappings. Source existence or similar layer names do not establish component identity. The bridge supplies design data and project references; the agent reads the actual sources and writes the implementation. This configuration does not install or change your framework, styling system or dependencies.

Each MCP adapter receives an explicit `--project` path and keeps context local to that adapter. One shared service can therefore support multiple projects. The project target and the Figma session are independent selections.

## Tools

Tools use the `figma_bridge_` prefix:

| Tool | Purpose |
| --- | --- |
| `sessions`, `selection` | Select an explicit connected document and node IDs. |
| `read_nodes`, `read_text` | Bounded design structure, layout, rich text and fingerprints. |
| `read_prototype`, `validate_prototype` | Bounded interaction graph, flow starts, scrolling settings and static validation. |
| `prepare_prototype_playback` | Prepare candidate checks for the agent’s browser/desktop controller; does not play the prototype itself. |
| `read_resources` | Resolve local components, styles, variables and aliases. |
| `export` | Export PNG, SVG or original image bytes to a local artifact. |
| `design_context` | Scoped design plus the adapter's optional project target. |
| `write_scope`, `apply` | Lease a scope and perform typed, fingerprint-checked changes. |
| `operation_status`, `cancel_operation` | Inspect outcomes and request cancellation. |

Supported writes include frame/text/rectangle creation, local component instantiation, allowlisted layout/fill/text changes, instance properties, existing variable bindings and scoped moves. The schemas advertise the current operations. Deletion, component-set authoring, new variable definitions, arbitrary JavaScript, remote library imports and whole-document regeneration are not exposed.

Keep the same MCP connection through lease acquisition, apply and release. Use fresh fingerprints and a new operation UUID for each new write. A result can be partial or unknown: inspect its receipt before deciding what remains to do. Never replay a lost creation under a new UUID. Reads and writes are not transactions; human collaborators can edit between calls. Closing the panel does not cancel a running operation. Cancellation takes effect at an operation boundary.

Reads indicate truncation and continuation IDs. Writes allow at most 50 operations. Exports are capped at 10 MiB and 16 megapixels. Remote resources are reported unavailable. Native fonts/export operations can still fail after a preflight. There is no headless access to closed files or automatic code/design sync.

## Prototype authoring and playback

Version 0.3 supports click, hover, press, drag, keyboard and delayed triggers; ordered actions; navigate, overlays, back/close and existing sibling-variant transitions; instant, dissolve and Smart Animate motion; existing local variable assignments, mode changes, typed expressions and bounded conditionals. The bridge can add/remove named flow starts and set `overflowDirection` to `NONE`, `HORIZONTAL`, `VERTICAL` or `BOTH`. It preserves other reactions and flow starts when changing an explicitly targeted entry.

```text
$figma-bridge Wire the selected screens into a prototype: Continue goes
forward, Back returns to the previous screen, and Help opens an overlay
with a Close button. Name the starting flow “Onboarding”. Read the
interactions back, validate the flow, then use the real Figma player
to test each path. Report authoring and playback results separately.
```

```text
$figma-bridge Inspect the selected prototype flow, test its navigation
in Figma’s player, and implement the observed behavior for the web target.
Follow this project’s framework, components and styling conventions.
```

The agent uses the bridge to author and inspect the prototype, then its existing browser or desktop controller to operate Figma’s presentation UI. No second browser runtime is installed. Without that controller or an authenticated Figma player, authoring still works; playback must be reported as blocked or unverified. `prepare_prototype_playback` always returns `playbackStatus: "not_run"`; a valid graph is not a passed interaction test.

Use explicit `sessionId`, `pageId`, starting node IDs and bounded traversal. Tools report incomplete or unsupported paths. Check the selected session’s advertised operations before writing; account availability remains unknown; a successful write does not prove playback entitlement. Check the peer’s `prototypeFeatures` as well as its operations. The [skill’s prototype reference](skills/figma-bridge/references/prototypes.md) includes the operation shapes, recovery rules and evidence format.

Create screens first, then use their confirmed IDs to wire reactions. **Configure flow starts in a separate batch after reading fresh page state:** Figma can automatically create a flow start when the first interaction is added. A mixed batch may correctly stop with a partial receipt and `STALE_FINGERPRINT`. Inspect the receipt and resume only unexecuted work with fresh fingerprints.

Basic navigation, back, overlays and dissolve were accepted in a Figma Free account during desktop verification. This does not unlock every Figma feature or remove Figma plan restrictions. Variables, expressions and conditionals in prototypes still require an eligible paid plan. Arbitrary overlay settings, media actions, custom transition curves, library imports and new component/variable-collection authoring remain outside this API. Existing unsupported reactions remain readable and are preserved when other entries are edited. Scrolling configuration is supported; a screen still needs overflowing content to visibly scroll.

### Advanced prototype examples

The [advanced skill reference](skills/figma-bridge/references/advanced-prototypes.md) contains copyable trigger, variable, expression and conditional schemas. Trigger timing uses **seconds** (`timeout: 1.5` is a 1500ms native delay); motion duration also uses seconds. Variable IDs must refer to existing local resources.

```text
Use $figma-bridge to add hover and drag interactions, a K-key shortcut and
an automatic 1.5-second delay to the selected QA flow. Use Smart Animate
between matching layers, read every reaction back, then test the real player.
Record missing controller capabilities and save a local evidence bundle.
```

```text
Use $figma-bridge to wire the selected button to toggle the existing local
boolean variable, then branch to the specified screens. Verify both true and
false paths after restart and record each returned actionPath separately.
Report paid-plan restrictions without claiming untested playback passed.
```

### Scenario checks and evidence

Prototype reads/validation accept optional `scenario: { startNodeId, expectedScreenIds, requireExitNodeIds }`. Include potentially disconnected expected screens among the seed `nodeIds`. The validator warns about unreachable screens and required exits only for complete, supported coverage. BACK/CLOSE require real history; intentional terminal screens remain valid unless explicitly required to have an exit.

After testing, save controller observations and actual player screenshots with:

```sh
npx --no-install figma-bridge prototype-report --project . --input /absolute/path/run-input.json
```

The [prototype skill reference](skills/figma-bridge/references/prototypes.md#save-a-durable-evidence-bundle) describes the input; a JSON Schema ships at `schema/prototype-report.schema.json`. The command creates a local run folder with `report.json`, copied screenshots and SHA-256 hashes under ignored `.figma-bridge/prototype-runs/`. It computes coverage and blocks unsupported claims: missing login/controller/document confirmation, disconnected plugin, changed flow/session or missing evidence cannot produce a passed report. Controller observations still require honest visual inspection; this command does not automate or authenticate the player.

### Upgrade from 0.1 or 0.2

Update the package dependency to a reviewed 0.3 commit from [the repository](https://github.com/singh-jay/figma-bridge), preserving your project profile. Then:

1. Stop the old bridge service and close its Figma plugin.
2. Run `npx --no-install figma-bridge init --project . --force` to refresh generated assets and MCP snippets. Use the same custom `--port` and `--state-dir`, if configured.
3. Start the new service, reopen the development plugin and generate a fresh pairing token with `figma-bridge pair`.
4. Refresh the installed skill with `npx --no-install figma-bridge install-skill --force`, and reconnect/restart the agent’s MCP connection.
5. Check `sessions` for protocol 3 and the connected peer’s prototype operations/features.

Package 0.3 uses protocol 3 and includes prototype resource dependencies in flow fingerprints. Old plugins are rejected with an upgrade message; do not reuse old leases or fingerprints. Project configuration stays at version 1. If the plugin menu contains multiple entries with the same name, check their manifest paths and run the one generated by the updated package.

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
