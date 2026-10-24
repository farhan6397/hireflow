# Hire Flow — Coding Agent Rules

## 1. Source of Truth

Before implementing a task, read the relevant documents:
- `docs/backend/PRD.md`
- `docs/backend/ARCHITECTURE.md`
- `docs/backend/SANDBOX_SECURITY.md`
- `docs/backend/DATABASE.md`
- `docs/backend/API.md`
- `docs/backend/IMPLEMENTATION_PLAN.md`

If documents conflict, do not silently choose one. Identify the conflict and ask for a decision or propose a clearly labeled resolution.

## 2. Inspect Before Changing

- Inspect relevant files and existing patterns before editing.
- Summarize the implementation approach before a non-trivial change.
- Keep changes focused on the requested task.
- Do not rewrite unrelated code.
- Do not claim a command or test passed unless it was actually run.

## 3. Code Quality

- Use TypeScript for backend application code.
- Prefer clear names, small cohesive modules, and explicit types.
- Keep HTTP handlers thin; place business rules in services/domain modules.
- Validate external input at system boundaries.
- Avoid `any` unless justified and documented.
- Avoid premature abstractions and unnecessary dependencies.
- Use async error handling consistently.

## 4. Architecture

- Keep application business logic modular.
- Keep database access behind defined module/service boundaries.
- Keep queue integration behind an infrastructure adapter.
- Never execute candidate source code inside the API process.
- Keep the trusted execution controller separate from the untrusted sandbox.
- Do not introduce microservices, Kubernetes, or extra infrastructure without an approved requirement.

## 5. Security

- Never hardcode, print, or commit secrets.
- Never expose secrets through API responses or frontend variables.
- Enforce authorization on the server for every protected resource.
- Do not trust client-supplied owner IDs, roles, evaluation scores, or execution status.
- Keep hidden test definitions and expected outputs out of candidate-facing responses and candidate-readable sandbox paths.
- Treat candidate code, AI output, queue payloads, and external API responses as untrusted.
- Do not give candidate code access to production credentials, Docker control sockets, or unrestricted host/network access.
- Do not claim a sandbox is secure without testing the defined threat model.
- Redact sensitive information from logs.

## 6. Database and API

- Follow `DATABASE.md` and `API.md`.
- Do not change schemas or API contracts silently.
- Consider idempotency, concurrent updates, ownership, and pagination where relevant.
- Do not return hidden or unauthorized fields.
- Use stable error codes and sanitized error messages.

## 7. Testing

- Add tests for new business behavior and critical failure cases.
- Test authorization denials as well as success cases.
- Test duplicate requests and queue retries where applicable.
- For execution changes, test timeout, output limits, cleanup, and sandbox boundaries.
- Do not delete or weaken tests just to make a change pass.
- Run relevant type checks, tests, and build commands and report actual results.

## 8. Dependencies and Configuration

- Add a dependency only when the task needs it.
- Explain new security-sensitive dependencies.
- Keep environment variables documented in `.env.example`.
- Never put real credentials in examples.
- Validate required configuration at startup.

## 9. Documentation and Git

- Update documentation when behavior, contracts, or setup changes.
- Keep commits focused and use descriptive messages.
- Do not overwrite user changes.
- Report changed files, tests run, known limitations, and decisions still requiring approval.

## 10. Human Review

- AI-generated hiring suggestions must remain distinguishable from human judgments.
- Do not implement autonomous hiring decisions unless product requirements and governance explicitly change and are reviewed.
