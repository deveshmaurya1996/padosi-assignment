# Android APK

Submission build (tracked in this folder):

- File: [`padosipro-preview.apk`](./padosipro-preview.apk)
- EAS build: https://expo.dev/accounts/deveshmaurya/projects/padosipro/builds/d5352404-3b26-4541-894b-1e8ce1fa2dae
- API: `https://padosi-assignment.onrender.com`

OTP is shown on the Verify screen (no mailbox). Rebuild the APK after OTP UI changes:

```bash
cd apps/mobile && npx eas-cli build -p android --profile preview
```
