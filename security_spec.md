# Security Specification & Adversarial Payload Analysis for A.R.I. Beauty

This security specification outlines the data invariants and access controls for the A.R.I. Beauty Intelligence Firestore database, detailing the security boundaries tested against a "Dirty Dozen" set of aggressive compromise attempts.

## Core Data Invariants

1. **User Profiling Scoping:** A user profile document `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid` matches `{userId}`.
2. **Post Creators:** Community posts under `/posts/{postId}` must have an `authorId` that exactly matches the authenticated sender's UID to prevent profile spoofing on the public feed.
3. **Private Messenger Security:** Direct messages `/messages/{messageId}` require the authenticated client to be either the registered `senderId` or `recipientId`. No other third parties may read, list, or write to these messages.
4. **Looks Ownership:** Saved makeup looks `/saved_looks/{lookId}` are strictly owned by their creator. Reads, updates, and deletes require `userId` matching `request.auth.uid`.
5. **Timestamp Trust:** All creation and editing operations (`createdAt`, `updatedAt`) must rely synchronously upon the server time `request.time`.

---

## The "Dirty Dozen" Adversarial Payloads
Below are 12 specific payloads representing exploits targeting identities, integrity limits, and state short-cutting. All must return `PERMISSION_DENIED` on our firestore.rules gate.

### 1. Identity Spoofing - Profile Creep
*   **Attempt:** Authenticated user `attacker_uid` tries to modify `victim_uid`'s user profile to steal preferences or PII.
*   **Payload Target:** `CREATE` / `UPDATE` on `/users/victim_uid`
```json
{
  "userId": "victim_uid",
  "email": "hijacked@victim.com",
  "displayName": "Injected Name",
  "skinUndertone": "Warm"
}
```
*   **Result:** `PERMISSION_DENIED` (auth.uid fails to match profile document ID).

### 2. Privilege Escalation - Admin Injection
*   **Attempt:** A normal user attempts to inject an unauthorized `isAdmin` flag inside their profile document to bypass administrative gates.
*   **Payload Target:** `UPDATE` on `/users/attacker_uid`
```json
{
  "userId": "attacker_uid",
  "email": "attacker@gmail.com",
  "displayName": "Malicious User",
  "skinUndertone": "Olive",
  "isAdmin": true
}
```
*   **Result:** `PERMISSION_DENIED` (Strict schema and dynamic update filters forbid modification of non-permitted fields via `affectedKeys()`).

### 3. Resource Poisoning - Gigantic String Injection
*   **Attempt:** Exploiting ID strings with massive payloads (1MB of random characters) to bloat index sizes and cause Denial of Wallet (DoW) bills.
*   **Payload Target:** `CREATE` on `/users/short_id_but_heavy_field`
```json
{
  "userId": "attacker_uid",
  "displayName": "HeavyName_AWAWAWA_1MB_OF_JUNK_HERE...",
  "email": "heavy@gmail.com"
}
```
*   **Result:** `PERMISSION_DENIED` (Prevented by dynamic string length guard `.size() <= 128` applied to displayName and email fields).

### 4. Community Feed Spoofing - Ghost Poster
*   **Attempt:** User `hacker_uid` tries to publish a video look on the community feed acting as the famous creator `celebrity_uid`.
*   **Payload Target:** `CREATE` on `/posts/any_new_post_id`
```json
{
  "postId": "any_new_post_id",
  "authorId": "celebrity_uid",
  "authorName": "Real Celebrity Profile",
  "imageUrl": "https://images.unsplash.com/beautiful-makeup.jpg"
}
```
*   **Result:** `PERMISSION_DENIED` (authorId must strictly match authenticated user `request.auth.uid` in `isValidPost`).

### 5. Infinite Like Inflator
*   **Attempt:** Attacker sends a partial update to a post to artificially inflate the `likesCount` to 99999 without adding their UID to the likes array.
*   **Payload Target:** `UPDATE` on `/posts/victim_post_id`
```json
{
  "likesCount": 99999,
  "caption": "Malicious caption update"
}
```
*   **Result:** `PERMISSION_DENIED` (`affectedKeys()` only lets you alter the exact like button states or comments array under controlled actions).

### 6. Relational Orphan Post
*   **Attempt:** User creates a makeup post and points it to a non-existent or deleted look ID.
*   **Payload Target:** `CREATE` on `/posts/new_post` with missing integrity references.
*   **Result:** Checked dynamically or bypassed locally.

### 7. Direct Message Sniffing (La Voyeuse)
*   **Attempt:** Attacker tries to download the conversation list of `/messages` to spy on other users' secure personal chats.
*   **Payload Target:** `LIST` on `/messages`
```json
Query: collection("messages")
```
*   **Result:** `PERMISSION_DENIED` (Explicit list query enforcers require `resource.data.senderId == request.auth.uid || resource.data.recipientId == request.auth.uid`).

### 8. Message Impersonation - Trick Sender
*   **Attempt:** Authenticated user `attacker_uid` submits a message into the chat room but stamps the `senderId` as the recipient, spoofing a reply from the victim.
*   **Payload Target:** `CREATE` on `/messages/msg_999`
```json
{
  "messageId": "msg_999",
  "senderId": "victim_uid",
  "recipientId": "attacker_uid",
  "content": "Sure, here's my secret password..."
}
```
*   **Result:** `PERMISSION_DENIED` (senderId in message body must match `request.auth.uid`).

### 9. Tampering With Saved Looks of Others
*   **Attempt:** Attacker tries to modify contour coordinates of a top contour look saved by another user.
*   **Payload Target:** `UPDATE` on `/saved_looks/victim_look_123`
```json
{
  "name": "Ruined placement",
  "contourPoints": { "forehead": [0, 0, 0] }
}
```
*   **Result:** `PERMISSION_DENIED` (Saved look edits require owning `userId` to equal `request.auth.uid`).

### 10. Future Timestamp Manipulators
*   **Attempt:** Submitting a post with a `createdAt` date stamp set to "2050-01-01" to permanently stick the post to the top of the feed chronologically.
*   **Payload Target:** `CREATE` on `/posts/new_post`
```json
{
  "postId": "new_post",
  "authorId": "attacker_uid",
  "imageUrl": "https://img.jpg",
  "createdAt": "2050-01-01T00:00:00Z"
}
```
*   **Result:** `PERMISSION_DENIED` (Validation helper requires strict equality with `request.time`).

### 11. Comment Injector (Cyberbullying Guard)
*   **Attempt:** Injector tries to add a bulk of malicious comments to someone else's feed post while omitting key audit tracking attributes.
*   **Payload Target:** `UPDATE` on `/posts/victim_post_33`
*   **Result:** `PERMISSION_DENIED` (Checks on action-based updates verify exact list-size boundaries on maps).

### 12. Path ID Injection Attack (Resource Exhaustion)
*   **Attempt:** User tries to create an entry under `/users` with a gigantic 2KB malicious text string as the document ID path parameter.
*   **Payload Target:** `WRITE` on `/users/MALICIOUS_GID_2KB_LONG_STREAK...`
*   **Result:** `PERMISSION_DENIED` (`isValidId` blocks non-alphanumeric or massive IDs on single document paths).
