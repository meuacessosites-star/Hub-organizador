# Security Specification - Hub Organizado

## 1. Data Invariants
- All data (tags, categories, platforms, statuses) MUST be nested under a `users/{userId}` document.
- A user can ONLY read, create, update, or delete data where `userId == request.auth.uid`.
- Sensitive fields like `id` and `ownerId` (implied by path) must remain immutable.
- Timestamps like `updatedAt` must be verified using `request.time`.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to write to `users/attackerID/platforms/plat1` while logged in as `victimID`.
2. **Path Variable Poisoning**: Attempt to create a platform with an ID that is a 1MB string.
3. **Ghost Field Injection**: Attempt to add `isAdmin: true` to a user profile update.
4. **Unauthenticated Read**: Attempt to list `users/victimID/platforms` without being logged in.
5. **Cross-User Update**: Attempt to update `users/victimID/platforms/plat1` as `attackerID`.
6. **State Shortcutting**: (Not highly applicable here, but maybe modifying a "creation date" to be in the past).
7. **Type Poisoning**: Sending a number where a string is expected for `platform.name`.
8. **Size Exhaustion**: Sending a platform name that is 100KB long.
9. **Orphaned Write**: Attempting to create a platform sub-document before the parent user document exists (though subcollections don't strictly require parent existence in Firestore, we usually want the user profile to exist).
10. **Malicious ID Injection**: Using `../` or other escape sequences in document IDs.
11. **Client Timestamp Spoofing**: Sending a manually crafted `updatedAt` instead of `serverTimestamp()`.
12. **PII Leakage**: Attempting to list all users to find emails.

## 3. Test Runner Plan
The tests will use the Firebase emulator (if available) or be conceptual for this environment. In this AI Studio environment, I'll focus on crafting the `firestore.rules` and validating them with ESLint.
