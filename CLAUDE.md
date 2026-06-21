# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-mapsforge-vtm` is a React Native New Architecture (Fabric + TurboModules) wrapper around the
[mapsforge/vtm](https://github.com/mapsforge/vtm) map rendering library. **Android only** — `ios/` contains
only Codegen-generated specs, there is no Swift/ObjC implementation and no `.podspec`.

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
codegen`). You normally don't need to invoke codegen manually.

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
  `LayerPathSlopeGradient`, `useRenderStyleOptions`. Don't assume they exist.
- `src/NativeViews/MapsforgeVtmViewNativeComponent.ts` — the single Fabric host component (codegen
  `codegenNativeComponent`), rendered by `MapContainer`.
- `src/NativeModules/Native*.ts` — one TurboModule spec per "layer" (`NativeMapContainer`,
  `NativeLayerMarker`, `NativeLayerBitmapTile`, `NativeLayerPath`). These are *not* Fabric components; they
  are RPC-style modules (`createLayer`/`removeLayer`/...) plus `EventEmitter`s for native callbacks
  (`onError`, `onMarkerEvent`, etc.).
- `src/components/*.tsx` — the public React components that wrap the above.

**Key pattern — layers vs. the map view:** `MapContainer` renders exactly one native Fabric view
(`MapsforgeVtmView`). Everything nested inside it (`LayerMarker`, `LayerBitmapTile`, `LayerPath`, ...) is
*not* a native view — it's a plain React component (returns `null` or wrapped children) that talks to the
native side through its TurboModule's `createLayer`/`removeLayer` calls, keyed by a `uuid` returned from the
native side and the view's `nativeNodeHandle` (obtained via `findNodeHandle` in `MapContainer`, since you
can't get a node handle for a Fabric view any other way before it mounts).

`MapContainer` walks its `children` tree (`wrapChildren`) and injects `nativeNodeHandle` and a sequential
`reactTreeIndex` into every child whose component type has a static `isMapLayer = true` flag (see
`LayerMarker.isMapLayer = true`). `reactTreeIndex` tells the native side where in the map's layer stack to
insert the corresponding native layer. Layer components, in turn, inject their own `uuid` (as e.g.
`markerLayerUuid`) into *their* children (e.g. `Marker` nested inside `LayerMarker`), forming a chain:
view handle → layer uuid → item uuid.

Native module event subscriptions (`onMarkerEvent`, etc.) are global per TurboModule (not scoped to one
layer instance), so component-level hooks like `useMarkerEventSubscription` filter incoming events by
comparing `response.uuid` to the instance's own uuid.

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
  `NativeLayerMarkerSpec`, etc. from `android/generated/`.
- `layer/*.java` (`ItemizedLayer`, `PathLayer`, `VectorLayer`) — vtm `Layer` subclasses used by the modules
  above to back markers/paths/vector data.
- `LayerHelper.java` — shared lookup of map/layer state by `nativeNodeHandle`.
- `HgtReader.java`, `FixedWindowRateLimiter.java`, `LayerZoomBoundsHelper.java`, `Utils.java` — supporting
  utilities (HGT elevation file reading, rate limiting, zoom-dependent bounds).

`android/build.gradle` pulls in the vtm/mapsforge ecosystem directly (`com.github.mapsforge.vtm:vtm`,
`vtm-android`, `vtm-themes`, `vtm-jts`, `vtm-http`, `vtm-android-mvt`, `vtm-hillshading`, plus
`mapsforge-core`/`mapsforge-map`), gpx parsing (`android-gpx-parser`), polyline simplification
(`simplify-java`), and a Savitzky–Golay smoothing filter — check there before adding a new native dependency,
it may already be present.

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
