# Tennis-Xpress V2 — Codex Instructions

## Default Mode

- By default, provide step-by-step instructions for the user
  to implement the requested task manually.
- Include exact file paths, terminal commands, and complete code
  where appropriate.
- Do not modify, create, or delete files unless the user explicitly
  authorizes you to implement the task yourself.
- Do not merely explain concepts. Provide actionable instructions
  that the user can follow directly.

## Codebase Scope

- Inspect only code relevant to the current task.
- Do not read project-planning documents or unrelated documentation.
- Do not create, read, or update documentation unless explicitly asked.
- Avoid unnecessary repository-wide scans.

## Questions and Decisions

- Use the requirements and decisions provided by the user.
- Ask questions only when missing information materially blocks
  a correct solution or requires the user's decision.
- Do not invent business requirements or make significant
  architectural decisions without approval.
- Resolve minor implementation details independently when safe.

## Implementation Mode

- Switch to direct implementation only when the user explicitly
  asks you to implement, modify, create, edit, or fix the code yourself.
- When authorized, make only the changes required for the task.
- Avoid unrelated refactoring, unnecessary dependencies, and scope creep.

## Code Documentation Standards

Write code that another developer can understand, maintain, and extend without having to guess the original author's intent.

- Use clear, descriptive names for variables, functions, classes, types, and modules.
- Add comments and documentation where they explain **why** something is done, the intent behind a design decision, or a non-obvious behavior.
- Document complex business rules, important assumptions, edge cases, side effects, and non-obvious execution flows.
- Use TypeScript types and interfaces to make data structures and function contracts clear.
- Add JSDoc comments to exported functions, classes, and types when their purpose, parameters, return values, errors, or usage constraints are not self-evident.
- Explain important interactions between modules and external services where the code alone does not make the relationship clear.
- Avoid redundant comments that merely repeat what the code already says.
- Avoid excessive comments, lengthy explanations of obvious logic, and documentation that becomes outdated when code changes.
- Update relevant code comments when modifying existing behavior. Do not create or update separate documentation files unless explicitly requested.

The goal is to document code sufficiently to explain its purpose, intent, execution, and important constraints without cluttering the code with unnecessary comments.

## Verification

- When giving manual instructions, provide relevant commands the user
  can run to verify the changes.
- When directly implementing, run relevant available checks.
- Never claim a command or check passed unless it was actually run.

## Reporting

- Keep responses concise and task-focused.
- Clearly identify the files involved and the exact actions required.
- Mention blockers only when they genuinely prevent progress.

## Testing Standards

### General
- Use risk-based testing. Prioritize business rules, security,
  data integrity, error handling, and critical user workflows.
- Do not create tests for every file or pursue arbitrary coverage
  targets. Test meaningful behavior rather than implementation details.
- Follow existing testing conventions and inspect relevant code
  before deciding what needs testing.
- Do not introduce duplicate application setups or unnecessary
  testing dependencies.
- Never claim tests passed unless they were actually executed.

### Backend
- Prioritize services, controllers, routes, validation, middleware,
  database operations, and application integration.
- Test successful operations, invalid inputs, failure paths,
  authorization boundaries, and important edge cases.
- Use the shared backend/tests/helpers/test-app.ts createTestApp()
  helper for HTTP integration tests. It must use the production
  createApp() implementation.
- Do not create a separate Express application for HTTP tests.
- Unit-test middleware without an Express app when no route or
  HTTP behavior needs to be tested.
- Use an isolated test database for database integration tests.
- Checkout and inventory tests must account for MongoDB transaction
  requirements, concurrent requests, reservation expiry, rollback,
  and idempotency.
- Payment tests must cover duplicate processing, invalid callbacks,
  amount verification, and failed payment scenarios.

### Frontend
- Use Vitest and React Testing Library for component and feature tests.
- Test observable behavior, user interactions, accessibility,
  loading states, success states, and error states.
- Test forms, API interactions, authentication flows, and critical
  customer, seller, and administrator workflows.
- Mock API responses in isolated frontend tests where appropriate.
- Do not use frontend tests as proof of backend security or
  business-rule correctness.
- Introduce end-to-end browser tests when the project is ready
  to verify complete workflows.

### Implementation and Verification
- When explicitly authorized to implement a feature, add or update
  relevant tests as part of the implementation when appropriate.
- When explicitly asked to implement tests, create and run them.
- When the user requests manual instructions only, do not modify files;
  provide the relevant commands and verification steps.
- Run relevant tests and type checks after authorized changes.
- Report what was tested, the commands executed, the results,
  and any checks that could not be run.
