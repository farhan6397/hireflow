# Hire Flow — Database Design

## 1. Purpose

Define the initial persistence model for Hire Flow. The proposed database is MongoDB, subject to confirmation in `ARCHITECTURE.md`. This is a logical model; exact schemas and indexes must be verified against actual queries during implementation.

## 2. Design Principles

- Store only data needed by approved user journeys.
- Enforce ownership and access checks in backend services.
- Do not expose hidden tests through candidate-facing APIs.
- Keep submission source snapshots immutable.
- Store execution attempts separately from the logical submission.
- Avoid storing reusable invitation secrets in plaintext where practical.
- Define retention and deletion policies before production.

## 3. Collections

### users

Fields:
- `_id`
- `email`
- `displayName`
- `role` (for example, interviewer or administrator)
- `status`
- `createdAt`
- `updatedAt`

Do not store plaintext passwords. The final authentication design determines whether password hashes or external identity references are stored.

### interviews

Fields:
- `_id`
- `ownerUserId`
- `candidateReference` (minimum necessary candidate information)
- `title`
- `status` (draft, scheduled, active, completed, cancelled)
- `questionIds`
- `startsAt`
- `endsAt`
- `createdAt`
- `updatedAt`

### invitations

Fields:
- `_id`
- `interviewId`
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `createdByUserId`
- `createdAt`
- `lastUsedAt` (optional)

Do not store a raw reusable invitation token if a hash can support validation.

### questions

Fields:
- `_id`
- `title`
- `prompt`
- `difficulty`
- `supportedLanguages`
- `starterCodeByLanguage`
- `visibility`
- `createdAt`
- `updatedAt`

### testSuites

Fields:
- `_id`
- `questionId`
- `version`
- `publicTestReferences`
- `hiddenTestStorageReference`
- `createdAt`
- `createdByUserId`

Keep hidden test data and expected outputs in trusted storage. Do not expose this collection directly to candidate routes.

### submissions

Fields:
- `_id`
- `interviewId`
- `candidateReference`
- `questionId`
- `language`
- `sourceSnapshot`
- `sourceHash`
- `idempotencyKey`
- `status`
- `createdAt`
- `updatedAt`

A submission's source snapshot should not be mutated after creation. New code creates a new submission record.

### executionAttempts

Fields:
- `_id`
- `submissionId`
- `attemptNumber`
- `queueJobId`
- `runtimeVersion`
- `status`
- `startedAt`
- `finishedAt`
- `durationMs`
- `cpuUsage` (when available)
- `memoryPeakBytes` (when available)
- `exitReason`
- `publicResultSummary`
- `sanitizedOutputReference` (optional)
- `createdAt`

Never put hidden expected outputs in candidate-readable result fields.

### evaluations

Fields:
- `_id`
- `interviewId`
- `submissionId` (optional)
- `reviewerUserId`
- `rubricVersion`
- `criteria`
- `humanNotes`
- `aiSuggestions` (optional, clearly marked as generated)
- `decisionStatus`
- `createdAt`
- `updatedAt`

AI suggestions and human-authored conclusions must be distinguishable.

### auditEvents

Fields:
- `_id`
- `actorType`
- `actorId`
- `interviewId` (optional)
- `action`
- `resourceType`
- `resourceId`
- `requestId`
- `metadata` (allowlisted, non-sensitive fields only)
- `createdAt`

### outboxEvents (add when needed)

Fields:
- `_id`
- `eventType`
- `aggregateType`
- `aggregateId`
- `payload`
- `createdAt`
- `publishedAt`
- `attemptCount`

Use an outbox only if needed to ensure reliable publication of state changes to the queue or realtime layer.

## 4. Relationships

- One user can own many interviews.
- One interview can reference multiple questions.
- One interview can have multiple invitations over time.
- One question can have multiple test-suite versions.
- One interview can have many submissions.
- One submission can have multiple execution attempts.
- An interview can have multiple evaluations and audit events.

MongoDB does not enforce relational foreign keys in the same way as a relational database. Validate referenced IDs and authorization in the application layer.

## 5. Indexes to Evaluate

Create indexes based on real access patterns and verify them with explain plans.

- `users`: unique normalized email, if email-based accounts are used.
- `interviews`: `{ ownerUserId: 1, updatedAt: -1 }`.
- `invitations`: unique `tokenHash`; index on `expiresAt` if cleanup queries require it.
- `submissions`: `{ interviewId: 1, createdAt: -1 }`.
- `submissions`: unique compound index for the agreed idempotency scope, such as `{ interviewId: 1, idempotencyKey: 1 }`.
- `executionAttempts`: `{ submissionId: 1, attemptNumber: 1 }` with uniqueness if attempt numbering is enforced.
- `auditEvents`: `{ interviewId: 1, createdAt: -1 }`.

Do not create indexes solely because a field exists. Confirm query patterns and write overhead.

## 6. Validation and Authorization

- Validate every request before persistence.
- Check interview ownership and candidate invitation permissions on the server.
- Never rely on a client-supplied owner ID as proof of ownership.
- Prevent candidate roles from retrieving hidden test definitions or interviewer-only notes.
- Restrict access to source code and evaluation records.
- Use explicit field allowlists to avoid mass assignment.

## 7. Migration and Seed Strategy

MongoDB schema changes still require controlled migration/versioning practices. Track schema changes and provide repeatable migration scripts when changes are not safely handled by backward-compatible application logic.

Seed only non-sensitive development data. Never seed production credentials or real candidate records into development.

## 8. Sensitive Data and Retention

Potentially sensitive data:
- Candidate source code.
- Interview notes and evaluations.
- Invitation tokens.
- Hidden test definitions and expected outputs.
- AI prompts/responses that may contain interview data.

Define retention, deletion, access logging, encryption, and backup access before production use.

## 9. Backup and Recovery

Document backup frequency, retention, access restrictions, restore testing, and recovery objectives before production. A backup is not considered verified until a restore test succeeds.

## 10. Open Decisions

- MongoDB driver versus ODM.
- Candidate identity representation.
- Source-code and evaluation retention duration.
- Whether hidden tests are stored in MongoDB or a separate protected store.
- Transaction and outbox requirements.
- Backup and recovery objectives.
