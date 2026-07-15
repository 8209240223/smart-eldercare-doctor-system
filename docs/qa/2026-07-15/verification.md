# 2026-07-15 verification evidence

## Streaming assistant

- Ordinary Q&A SSE: HTTP 200, 700 `delta` events, first delta at 2367 ms, last delta at 9205 ms.
- Site Agent SSE: `step -> tool -> tool_result -> delta -> done`, 144 `delta` events.
- Browser verification: Markdown rendered correctly and the assistant dialog had zero console errors.

![Streaming assistant](./assistant-streaming-local.png)

## Data linkage and patient scope

- Full Maven suite: 210 tests, 0 failures, 0 errors, 0 skipped.
- Doctor task scope: doctor01 received 18 tasks and all `doctorId` values were 2.
- Another doctor task scope: doctor02 received 2 tasks and all `doctorId` values were 3.
- Care-team nurse scope: nurse02 received 20 tasks belonging to doctors 2 and 3.
- Administrator scope: 22 tasks belonging to doctors 2, 3 and 4.
- A doctor querying another doctor's task ID returned business code 403.
- Forged elder/health-record doctor ownership returned business code 403 even when workflow generation was disabled.
- Temporary full-flow elder generated risk profile, follow-up plan, follow-up task, structured AI report, health record, physical exam and timeline links.
- The temporary elder was visible to its doctor, the doctor's collaborating nurse and the administrator, but not to an unrelated doctor.
- Exact cleanup restored every audited domain-table count; the local database remained at 19 active elders.
- The legacy `POST /api/elders` endpoint now also generated risk, plan, task and AI report while preserving the original elder-ID response.

## Frontend and Android

- `npm run build`: passed.
- `npm run lint`: passed with two pre-existing Fast Refresh warnings and no errors.
- Android debug build: passed.
- Android release build: passed.
- Release APK signature: APK Signature Scheme v2 and v3 verified, RSA 2048-bit certificate.
- Release APK SHA-256: `7CF56C1084AA9EE527114F89D151C8F09161E71CDB937A80B636A5DCFE3C892B`.
- Android 15 emulator: install, launch, login, dashboard rendering, assistant dialog and native back-button close behavior passed.
- The release app loads `http://159.75.139.2`, so website and app use the same server and database.

![Android launcher icon](./android-launcher-icon.png)

![Android release login](./android-release-login.png)

![Android release dashboard](./android-release-dashboard.png)
