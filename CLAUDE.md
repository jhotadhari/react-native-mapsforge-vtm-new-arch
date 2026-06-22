# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-mapsforge-vtm` is a React Native New Architecture (Fabric + TurboModules) wrapper around the
[mapsforge/vtm](https://github.com/mapsforge/vtm) map rendering library. **Android only** — `ios/` contains
only Codegen-generated specs, there is no Swift/ObjC implementation and no `.podspec`.

**This repo is a temporary rebuild workspace, not the published package.** The real, published
`react-native-mapsforge-vtm` (old architecture) lives in a sibling repo at `../../react-native-mapsforge-vtm/`.
This repo exists to reimplement that library's components against the New Architecture; once all components
are done, this whole repo gets copied over to the sibling repo in one go (not component-by-component). The
API — how consumers use components and communicate with the map/layers — is being redesigned freely here
with no backwards-compatibility constraint to the old library. The example app here will also end up
different from the old repo's. `LayerPathSlopeGradient` (still commented out in `src/index.tsx`) is not
planned to be reimplemented in this library at all; it may become its own separate, single-purpose library
instead. That's also why there's no real `README.md` here — don't add one or treat this repo's metadata
(package name, version, etc.) as canonical.

The repo is a Yarn workspaces monorepo (created with `create-react-native-library`, type `fabric-view`):
- `/` — the library itself (`src/` for TS, `android/` for native Android code).
- `example/` — a workspace app (`react-native-mapsforge-vtm-example`) used to dev/test the library. It does
  **not** depend on the library via npm/yarn — `example/react-native.config.js` manually registers it as an
  autolinked dependency pointing at `../` (see "Autolinking" pitfall below).

You cannot use `npm` here — the project relies on Yarn workspaces (`packageManager: yarn@3.6.1`).

## Common commands

Run from the repo root unless noted.

```sh
yarn                      # install deps for both the library and example workspaces
yarn typecheck            # tsc --noEmit
yarn lint                 # eslint over **/*.{js,ts,tsx}
yarn lint --fix
yarn test                 # jest (single run: yarn test path/to/file.test.tsx -t "name")
yarn prepare              # bob build — builds lib/ (module + typescript + codegen) from src/
yarn clean                # del-cli android/build example/android/build example/android/app/build lib

yarn example start        # Metro for the example app
yarn example android       # build & run example app on a connected device/emulator
```

Native Android codegen (TurboModule specs, ViewManager interfaces under `android/generated/` and
`ios/generated/`) is (re)generated automatically as part of the Gradle build for the example app (see
`invokeLibraryCodegen` / `preBuild` task in `example/android/app/build.gradle`, and `bob build --target
codegen`). You normally don't need to invoke codegen manually — but if you change a
`src/NativeModules/Native*.ts` spec and need the regenerated Java interface before running a full Android
build (e.g. to write native code against it), run `npx react-native-builder-bob build --target codegen` to
refresh `android/generated/` directly.

To build/inspect the example's native Android project directly:

```sh
cd example/android
./gradlew :app:assembleDebug
./gradlew :app:tasks --info     # useful for debugging autolinking / settings.gradle issues
```

There are no Android unit/instrumented tests in this repo; `yarn test` only covers the JS/TS side (Jest,
single test file at `src/__tests__/index.test.tsx`).

## Architecture

### JS/TS side (`src/`)

- `src/index.tsx` — public exports. Several layers are commented out (not yet implemented):
  `LayerMapsforge`, `LayerHillshading`, `LayerMBTilesBitmap`, `LayerScalebar`,
  `LayerPathSlopeGradient`, `useRenderStyleOptions`. Don't assume they exist. `src/context/` and the
  `useLayerOrder` hook (below) are internal — not part of the public API.
- `src/NativeViews/MapsforgeVtmViewNativeComponent.ts` — the single Fabric host component (codegen
  `codegenNativeComponent`), rendered by `MapContainer`.
- `src/NativeModules/Native*.ts` — one TurboModule spec per "layer" (`NativeMapContainer`,
  `NativeLayerMarker`, `NativeLayerBitmapTile`, `NativeLayerPath`). These are *not* Fabric components; they
  are RPC-style modules (`createLayer`/`removeLayer`/...) plus `EventEmitter`s for native callbacks
  (`onError`, `onMarkerEvent`, etc.). `NativeMapContainer` also exposes `reorderLayers`, used for layer
  ordering (see below) — it has no other layer-management methods of its own.
- `src/components/*.tsx` — the public React components that wrap the above.
- `src/context/MapHandleContext.ts`, `src/context/MarkerLayerContext.ts`, `src/compose/useLayerOrder.ts` —
  internal context/hook plumbing that wires layers and items together (see below).

**Key pattern — layers vs. the map view:** `MapContainer` renders exactly one native Fabric view
(`MapsforgeVtmView`). Everything nested inside it (`LayerMarker`, `LayerBitmapTile`, `LayerPath`, ...) is
*not* a native view — it's a plain React component (returns `null` or wrapped children) that talks to the
native side through its TurboModule's `createLayer`/`removeLayer` calls, keyed by a `uuid` returned from the
native side and the view's `nativeNodeHandle` (obtained via `findNodeHandle` in `MapContainer`, since you
can't get a node handle for a Fabric view any other way before it mounts).

**Wiring layers together — Context, not prop-injection:** `MapContainer` provides `MapHandleContext`
(`{ nativeNodeHandle, registry }`) directly over `{children}` — it does not walk or clone its children. Any
component flagged with a static `isMapLayer = true` (see `LayerMarker.isMapLayer = true`) reads
`nativeNodeHandle` via the `useLayerOrder` hook (`src/compose/useLayerOrder.ts`) instead of via a prop, so an
arbitrary number of intermediate `View`s or custom wrapper components between `MapContainer` and a layer
doesn't break the wiring. `LayerMarker` follows the same pattern one level down: it provides its own
`MarkerLayerContext` (`{ markerLayerUuid }`) wrapping its children, and `Marker` reads it via `useContext`
instead of receiving it as an injected prop, forming a chain: view handle → layer uuid → item uuid.

**Continuous layer ordering, not one-shot creation index:** `createLayer` always appends on the native side;
a layer's position in `mapView.map().layers()` is established and kept in sync separately and continuously
by `useLayerOrder` and a shared `LayerOrderRegistry` (created once per `MapContainer`, handed down through
`MapHandleContext`). Each `isMapLayer` component registers into the registry **during render** (not in an
effect): it anchors itself right after whichever sibling rendered immediately before it in the same pass,
using a `cursor` that `MapContainer` resets to `undefined` at the start of every one of its own renders.
This works because React always re-renders non-memoized siblings together whenever a shared ancestor
re-renders (e.g. a `{show && <LayerPath/>}` toggle), so a layer that mounts/remounts lands in the correct
relative position instead of always being appended at the end — and an already-registered layer is never
moved by this, so a later solo re-render (e.g. its own `uuid` resolving asynchronously) can't corrupt the
order. Whenever the resulting order of resolved uuids actually changes, the registry calls the native
`reorderLayers` TurboModule method to resync the live native layer list. If you add a new `isMapLayer`
component, call `useLayerOrder(uuid)` to get `nativeNodeHandle` and register it the same way the existing
ones do.

Native module event subscriptions (`onMarkerEvent`, etc.) are global per TurboModule (not scoped to one
layer instance), so component-level hooks like `useMarkerEventSubscription` filter incoming events by
comparing `response.uuid` to the instance's own uuid.

**Gestures vs. programmatic triggers (`LayerPath`):** native gesture detection (tap/long-press/double-tap)
is enabled on the native layer via a `supportsGestures` flag, derived from whether
`onPress`/`onLongPress`/`onDoubleTap` are set (`onTrigger` does *not* count). It's passed at `createLayer`
time, and kept in sync afterwards via `updateSupportsGestures` (mutates `VectorLayer`'s flag in place) so
toggling those handlers doesn't require tearing down and recreating the layer — follow this
update-in-place pattern (see also `updateGestureScreenDistance`) rather than recreate-on-prop-change when
adding similar live-tunable native layer state. Separately, `LayerPath` accepts a `triggerEvent` ref prop
that it populates with an imperative function (`LayerPathModule.triggerEvent`) so a parent can fire a
synthetic path event (handled by `onTrigger`) without going through real touch input — this is a ref-based
escape hatch alongside the normal props-down/events-up flow, not a regular callback prop.

Components generally accept `null`/`undefined` props and fall back to native defaults exposed via
`<Module>.getConstants()` (e.g. `NativeMapContainer.getConstants()` in `MapContainer`,
`LayerMarkerModule.getConstants()` in `Marker`/`LayerMarker`). When adding a new prop, prefer wiring it
through native `getConstants()` defaults rather than hardcoding a JS-side default.

### Native Android side (`android/src/main/java/com/jhotadhari/reactnative/mapsforge/vtm/`)

- `MapsforgeVtmViewPackage.java` — the package class. **Must stay detectable by the RN CLI's autolinking
  regex** (it greps for `implements ... ReactPackage` or `extends TurboReactPackage`); it currently
  `extends BaseReactPackage implements ReactPackage` — the `implements ReactPackage` is redundant for Java
  but required for autolinking to find the class. Don't remove it. See "Autolinking pitfalls" below.
- `views/MapsforgeVtmView.java`, `views/MapsforgeVtmViewManager.java`, `views/MapFragment.java` — the single
  Fabric view, wrapping a `org.oscim.android.MapView` inside a Fragment.
- `modules/*.java` — one TurboModule implementation per JS `Native*.ts` spec (`MapContainer`,
  `LayerMarker`, `LayerBitmapTile`, `LayerPath`), each backed by `NativeMapContainerSpec`,
  `NativeLayerMarkerSpec`, etc. from `android/generated/`. `modules/MapContainer.java` additionally
  implements `reorderLayers`, since layer order is a whole-map concern, not specific to one layer type.
- `layer/*.java` (`ItemizedLayer`, `PathLayer`, `VectorLayer`) — vtm `Layer` subclasses used by the modules
  above to back markers/paths/vector data.
- `LayerHelper.java` — shared lookup of map/layer state by `nativeNodeHandle`. `addLayer` always appends to
  `mapView.map().layers()` (final position is established separately and continuously by
  `MapContainer.reorderLayers`, not at creation time).
- `LayerOrderRegistry.java` — a static, cross-module `nativeNodeHandle -> uuid -> Layer` lookup. It exists
  because each layer-type module (`LayerMarker.java`, `LayerPath.java`, `LayerBitmapTile.java`) owns its own
  private `LayerHelper` instance with its own non-shared map, but `MapContainer.reorderLayers` needs to
  resolve uuids to `Layer` objects regardless of which module created them, since all layer types share one
  flat native layer list.
- `HgtReader.java`, `FixedWindowRateLimiter.java`, `LayerZoomBoundsHelper.java`, `Utils.java` — supporting
  utilities (HGT elevation file reading, rate limiting, zoom-dependent bounds).

`android/build.gradle` pulls in the vtm/mapsforge ecosystem directly (`com.github.mapsforge.vtm:vtm`,
`vtm-android`, `vtm-themes`, `vtm-jts`, `vtm-http`, `vtm-android-mvt`, `vtm-hillshading`, plus
`mapsforge-core`/`mapsforge-map`), gpx parsing (`android-gpx-parser`), polyline simplification
(`simplify-java`), and a Savitzky–Golay smoothing filter — check there before adding a new native dependency,
it may already be present.

vtm's own `org.oscim.layers.GroupLayer` is **not** used for grouping layers here: it only flattens one level
deep for rendering/gesture dispatch (`org.oscim.map.Layers.updateLayers()`/`handleGesture()` special-case it
with a single non-recursive unwrap), and mutating its `layers` list doesn't mark the outer `Layers` dirty.
Any future grouping concept should stay JS-side and flatten to the single real native layer list, the same
way ordering already does.

### Versions / config that must stay in sync

- `android/gradle.properties` (`MapsforgeVtm_*`) vs. `example/android/gradle.properties` —
  `compileSdkVersion`/`minSdkVersion`/`targetSdkVersion`/`kotlinVersion`/`ndkVersion` are duplicated between
  the library module and the example app's root project; keep them aligned when bumping SDK/Kotlin/NDK
  versions.
- `package.json` `codegenConfig` (`name: "RNMapsforgeVtmViewSpec"`, `javaPackageName`) must match
  `android/build.gradle`'s `react { libraryName = ...; codegenJavaPackageName = ... }`.

## Autolinking pitfalls (important — has broken the build before)

The example app does **not** list `react-native-mapsforge-vtm` as a real dependency in
`example/package.json`; it's wired in purely through `example/react-native.config.js`'s manual
`dependencies[pkg.name] = { root: '../', platforms: { android: {} } }` entry, read by the RN CLI's
`autolinkLibrariesFromCommand()` in `example/android/settings.gradle`.

That autolinking step needs to detect the package's main `ReactPackage` class via a regex scan of
`*Package.java`/`*Package.kt` files in `android/src` — it only matches classes that either directly
`implements ReactPackage` (or `:` in Kotlin) or `extends TurboReactPackage`. If the package class is changed
to extend only `BaseReactPackage` (or any other base) without also declaring `implements ReactPackage`,
detection silently fails: the dependency's `android` config comes back without a `sourceDir`, Gradle drops
`:react-native-mapsforge-vtm` from `settings.gradle` entirely, and you get
`Project with path ':react-native-mapsforge-vtm' could not be found in project ':app'` — even though the
checked-in code looks fine. This is cached in `example/android/build/generated/autolinking/autolinking.json`
and only gets invalidated when `yarn.lock`/`package.json`/`package-lock.json` change, so the breakage can
appear long after the actual offending code change (e.g. right after an unrelated `yarn install`).

If you hit "Project with path ':...' could not be found" or "compileSdkVersion is not specified" when
building the example app, first check `npx react-native config` (run from `example/`) for the dependency's
`platforms.android` block — if it's missing `sourceDir`, the package class detection is the likely culprit.
Deleting `example/android/build/generated/autolinking/` forces a fresh detection.
