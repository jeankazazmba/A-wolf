# Security Specifications for Firestore

## 1. Data Invariants
- **Task**: Every task must have a valid `id`, `ownerId` matching the authenticated user's UID, non-empty `title`, standard `priority` (e.g. Haute, Moyenne, Basse), `group` type, `star` status, and any optional `subTasks`. `createdAt` must match the server timestamp.
- **FocusSession**: Must have a `duration` in seconds (positive), `timestamp` equal to `request.time`, state `type` restricted to Pomodoro or Long, and `ownerId` pointing to the user creator.
- **Reminder**: Must have an `id`, an `ownerId` matching `request.auth.uid`, a `deadline` string, and `completed`/`active` booleans.
- **Note**: Must have `updatedAt` matched with `request.time` and its `ownerId` matched to the user's UID.

---

## 2. The "Dirty Dozen" (12 Malicious Payloads)
The following payloads aim to bypass security but will be strictly blocked by the rules:

1. **Identity Spoofing in Tasks**: Create a task with `ownerId` set to a victim's user ID.
2. **Missing Requirement in Focus Sessions**: Insert a focus session missing the `duration` key.
3. **Invalid Data Type (State Poisoning)**: Insert a task with `completed: "not_completed"` instead of a boolean.
4. **ID Poisoning Attack**: Try to write to a document with ID `./some-trash-character-vector-aiming-for-injection-path`.
5. **Admin Spoofing**: Attempt to write a profile setting claiming `isAdmin` or admin role.
6. **Temporal Bypass**: Create a task with a backdated client-side `createdAt` timestamp instead of a server timestamp.
7. **Bypassing Owner Restrictions**: Attempt to read list of `tasks` without filtering by `ownerId == auth.uid`.
8. **Malicious Subtask Pollution**: Inject subtasks with an extremely long payload or invalid schema keys.
9. **Session Type Hijacking**: Create a Focus Session with `type: "InfiniteSleepFocus"`.
10. **Note Owner Switch**: Edit a note changing its immutable `ownerId` to someone else's.
11. **Mass Overwrite of Immutable Field**: Submit an update to `createdAt` on an existing task.
12. **Malformed ID in reminders**: Create a reminder with a 1MB string value for the ID.

---

## 3. Security Rules Validation (The "Fortress" rules validation)
All of the invalid or unauthorized requests will be rigorously validated and rejected with `PERMISSION_DENIED` at the Firestore security rules layer.
