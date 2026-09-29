# Android APK

Submission build (tracked in this folder):

- File: [`padosipro-preview.apk`](./padosipro-preview.apk)
- EAS build: https://expo.dev/accounts/deveshmaurya/projects/padosipro/builds/13810600-4282-4cdb-a3cf-20d08413005e
- API: `https://padosi-assignment.onrender.com`

OTP is shown on the Verify screen (no mailbox). Rebuild the APK after OTP UI changes:

```bash
cd apps/mobile && npx eas-cli build -p android --profile preview
```
