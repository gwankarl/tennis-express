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
