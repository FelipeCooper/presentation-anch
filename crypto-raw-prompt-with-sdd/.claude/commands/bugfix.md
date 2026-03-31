Fix documented bugs from a bugs file

<critical>You MUST fix ALL bugs listed in the bugs.md file</critical>
<critical>For EACH fixed bug, create regression tests (unit, integration, and/or E2E) that simulate the original problem and validate the fix</critical>
<critical>The task is NOT complete until ALL bugs are fixed and ALL tests are passing with 100% success</critical>
<critical>DO NOT apply superficial fixes or workarounds — resolve the root cause of each bug</critical>

## File Locations

- Bugs: `./tasks/prd-[feature-name]/bugs.md`
- PRD: `./tasks/prd-[feature-name]/prd.md`
- TechSpec: `./tasks/prd-[feature-name]/techspec.md`
- Tasks: `./tasks/prd-[feature-name]/tasks.md`
- Project Rules: @.claude/rules

## Steps to Execute

### 1. Context Analysis (Required)

- Read the `bugs.md` file and extract ALL documented bugs
- Read the PRD to understand the requirements affected by each bug
- Read the TechSpec to understand the relevant technical decisions
- Review the project rules to ensure compliance in the fixes

<critical>DO NOT SKIP THIS STEP — Understanding the full context is fundamental for quality fixes</critical>

### 2. Fix Planning (Required)

For each bug, generate a planning summary:

```
BUG ID: [Bug ID]
Severity: [High/Medium/Low]
Affected Component: [component]
Root Cause: [root cause analysis]
Files to Modify: [list of files]
Fix Strategy: [description of approach]
Planned Regression Tests:
  - [Unit test]: [description]
  - [Integration test]: [description]
  - [E2E test]: [description]
```

### 3. Fix Implementation (Required)

For each bug, follow this sequence:

1. **Locate the affected code** — Read and understand the involved files
2. **Mentally reproduce the problem** — Reason through the flow that causes the bug
3. **Implement the fix** — Apply the solution to the root cause
4. **Verify typing** — Run `npx tsc --noEmit` after the fix
5. **Run existing tests** — Ensure no test broke with the change

<critical>Fix bugs in order of severity: High first, then Medium, then Low</critical>

### 4. Regression Test Creation (Required)

For each fixed bug, create tests that:

- **Simulate the original bug scenario** — The test should fail if the fix is reverted
- **Validate the correct behavior** — The test should pass with the fix applied
- **Cover related edge cases** — Consider variations of the same problem

Types of tests to consider:

| Type | When to Use |
|------|-------------|
| Unit test | Bug in isolated logic of a function/method |
| Integration test | Bug in communication between modules (e.g.: controller + service) |
| E2E test | Bug visible in the user interface or in the complete flow |

### 5. Playwright MCP Validation (Required for visual/frontend bugs)

For bugs that affect the user interface:

1. Use `browser_navigate` to access the application
2. Use `browser_snapshot` to verify the page state
3. Reproduce the flow that caused the bug
4. Use `browser_take_screenshot` to capture evidence of the fix
5. Verify the behavior is correct

### 6. Final Test Execution (Required)

- Run ALL project tests: `npm test`
- Verify ALL pass with 100% success
- Run type checking: `npx tsc --noEmit`

<critical>The task is NOT complete if any test fails</critical>

### 7. Update bugs.md (Required)

After fixing each bug, update the `bugs.md` file by adding at the end of each bug:

```
- **Status:** Fixed
- **Fix applied:** [brief description of the fix]
- **Regression tests:** [list of tests created]
```

### 8. Final Report (Required)

Generate a final summary:

```
# Bugfix Report - [Feature Name]

## Summary
- Total Bugs: [X]
- Bugs Fixed: [Y]
- Regression Tests Created: [Z]

## Details by Bug
| ID | Severity | Status | Fix | Tests Created |
|----|----------|--------|-----|---------------|
| BUG-01 | High | Fixed | [description] | [list] |

## Tests
- Unit tests: ALL PASSING
- Integration tests: ALL PASSING
- E2E tests: ALL PASSING
- Typing: NO ERRORS
```

## Quality Checklist

- [ ] bugs.md file read and all bugs identified
- [ ] PRD and TechSpec reviewed for context
- [ ] Fix planning done for each bug
- [ ] Fixes implemented at the root cause (no workarounds)
- [ ] Regression tests created for each bug
- [ ] All existing tests still passing
- [ ] Type checking without errors
- [ ] bugs.md file updated with fix statuses
- [ ] Final report generated

## Important Notes

- Always read the source code before modifying it
- Follow all standards established in the project rules (@.claude/rules)
- Prioritize resolving the root cause, not just the symptoms
- If a bug requires significant architectural changes, document the justification
- If new bugs are discovered during fixing, document them in bugs.md

<critical>Use Context7 MCP to analyze the documentation of the language, frameworks, and libraries involved in the fix</critical>
<critical>START IMPLEMENTATION IMMEDIATELY after planning — do not wait for approval</critical>
