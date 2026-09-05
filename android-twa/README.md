# NTMP Android app (Trusted Web Activity)

A thin Android wrapper around the PWA at https://narveer.vercel.app — the app
IS the website, opened full-screen; every deploy updates the app instantly.
Only `twa-manifest.json` (the app definition) and this README are committed;
the generated Android project, Gradle caches and the signing keystore stay
local (see `.gitignore`).

## One-time machine setup (already done on this PC)

- JDK 17 at `C:\Users\Kalpesh\jdk17`
- Android SDK at `C:\Users\Kalpesh\android-sdk` (build-tools 36.1.0)
- `~/.bubblewrap/config.json` points at the JDK and the SDK shim
  (`~/.bubblewrap/sdk-shim` — junctions that give bubblewrap the layout it
  expects: `bin/` + `build-tools/` in one folder)
- Signing keystore `signing.keystore` — passwords in `SIGNING-KEY-INFO.txt`
  (NOT committed; back both files up privately — losing them means the app
  can never be updated for existing installs)

## Build a new APK / AAB

```powershell
cd android-twa
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = "<see SIGNING-KEY-INFO.txt>"
$env:BUBBLEWRAP_KEY_PASSWORD = "<see SIGNING-KEY-INFO.txt>"
npx @bubblewrap/cli update --skipVersionUpgrade   # after editing twa-manifest.json
npx @bubblewrap/cli build --skipPwaValidation
```

Outputs land in this folder: `app-release-signed.apk` (share/install
directly) and `app-release-bundle.aab` (Play Store upload).

For a new release: bump `appVersionCode` (+1) and `appVersionName` in
`twa-manifest.json`, then update + build.

## Full-screen requirement (already satisfied)

The site serves `/.well-known/assetlinks.json` with this keystore's SHA-256
fingerprint. If the signing key ever changes, regenerate the fingerprint
(`keytool -list -v -keystore signing.keystore -alias narveer`) and update
`public/.well-known/assetlinks.json` — otherwise the app shows a browser
address bar instead of opening full-screen.
