# Login, roles and shared batch data — setup

## 1. Add a Web app to your Firebase project (if not already done)
Firebase console → Project settings (gear icon) → General → "Your apps" → Add app → Web (</>).
Copy the config object it shows you.

## 2. Enable Email/Password sign-in
Firebase console → Build → Authentication → Sign-in method → enable **Email/Password**.

## 3. Add these to your `.env`
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DB_URL=...            # you already have this one
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
All values come from the config object in step 1.

## 4. Realtime Database security rules
Firebase console → Realtime Database → Rules. Paste:

```json
{
  "rules": {
    "devices": {
      "$deviceId": { ".read": true, ".write": true }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "role": { ".validate": "newData.val() === 'farmer' || newData.val() === 'producer'" }
      }
    },
    "batches": {
      "$batchId": {
        ".read": true,
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'producer' && (!data.exists() || data.child('producerId').val() === auth.uid) && (!newData.exists() || newData.child('producerId').val() === auth.uid)"
      }
    }
  }
}
```

- Anyone can read a batch (farmers look it up without logging in).
- Only an account whose role is `producer` can create a batch, and only the producer who created it can edit or delete it.
- `/users/{uid}` is readable/writable only by that user, and `role` must be `farmer` or `producer`.
- Note the `(!newData.exists() || ...)` part: without it, deleting a batch is rejected, because a delete has no `newData`.

Verify in the Rules Playground before relying on it. These rules were written to valid syntax but not tested against a live project.

## 5. Password reset
- Login page → "Forgot password?" sends a reset link to the entered email.
- Account page (`/account`) → "Email me a password reset link" sends one to the signed-in email.
- Firebase sends the email itself. To customise the wording: Authentication → Templates → Password reset.
- If the email lands in spam, check Authentication → Settings → Authorized domains includes your hosting domain.

## 6. Changing account type
Signed-in users open **Account** (top-right of the header) and pick Farmer or Producer. This writes
`/users/{uid}/role`. Switching is self-service: anyone can become a producer. If you later want
approval-only producers, remove the user's write access to `role` in the rules and change roles from
the console or an admin tool instead.

## 7. What this does and doesn't do
- **Real:** signup/login, role per account, role switching, password reset, a Producer Dashboard that
  writes to shared `/batches/{batchId}`, and a Batch page showing that data to any farmer on any device.
- **Not built:** email verification, and admin approval of producers.
- Farmers can use the whole test/history/device flow **without** logging in. Login is only required for
  `/producer` and `/account`.
