Run code review on the current implementation

<critical>Use git diff to analyze code changes</critical>
<critical>Verify if the code complies with the project rules</critical>
<critical>ALL tests must pass before approving the review</critical>
<critical>The implementation must follow the TechSpec and Tasks EXACTLY</critical>

## Objectives

1. Analyze produced code via git diff
2. Verify compliance with project rules
3. Validate that tests pass
4. Confirm adherence to TechSpec and Tasks
5. Identify code smells and improvement opportunities
6. Generate code review report

## Prerequisites / File Locations

- PRD: `./tasks/prd-[feature-name]/prd.md`
- TechSpec: `./tasks/prd-[feature-name]/techspec.md`
- Tasks: `./tasks/prd-[feature-name]/tasks.md`
- Project Rules: @.claude/rules

## Process Steps

### 1. Documentation Analysis (Required)

- Read the TechSpec to understand the expected architectural decisions
- Read the Tasks to verify the implemented scope
- Read the project rules to know the required standards

<critical>DO NOT SKIP THIS STEP - Understanding the context is fundamental for the review</critical>

### 2. Code Changes Analysis (Required)

Run git commands to understand what was changed:

```bash
# View modified files
git status

# View diff of all changes
git diff

# View staged diff
git diff --staged

# View commits of current branch vs main
git log main..HEAD --oneline

# View full diff of branch vs main
git diff main...HEAD
```

For each modified file:
1. Analyze changes line by line
2. Verify they follow project standards
3. Identify potential issues

### 3. Rules Compliance Check (Required)

For each code change, verify:

- [ ] Follows naming conventions defined in the rules
- [ ] Follows the project folder structure
- [ ] Follows code standards (formatting, linting)
- [ ] Does not introduce unauthorized dependencies
- [ ] Follows error handling standards
- [ ] Follows logging standards (if applicable)
- [ ] Code is in Portuguese/English as defined in the rules

### 4. TechSpec Adherence Check (Required)

Compare implementation with the TechSpec:

- [ ] Architecture implemented as specified
- [ ] Components created as defined
- [ ] Interfaces and contracts follow the specification
- [ ] Data models as documented
- [ ] Endpoints/APIs as specified
- [ ] Integrations implemented correctly

### 5. Task Completeness Check (Required)

For each task marked as complete:

- [ ] Corresponding code was implemented
- [ ] Acceptance criteria were met
- [ ] Subtasks were all completed
- [ ] Task tests were implemented

### 6. Test Execution (Required)

Run the test suite:

```bash
# Run unit tests
npm test
# or
yarn test
# or the project-specific command

# Run tests with coverage
npm run test:coverage
```

Verify:
- [ ] All tests pass
- [ ] New tests were added for new code
- [ ] Coverage did not decrease
- [ ] Tests are meaningful (not just for coverage)

<critical>THE REVIEW CANNOT BE APPROVED IF ANY TEST FAILS</critical>

### 7. Code Quality Analysis (Required)

Check code smells and best practices:

| Aspect | Check |
|--------|-------|
| Complexity | Functions not too long, low cyclomatic complexity |
| DRY | No duplicated code |
| SOLID | SOLID principles followed |
| Naming | Clear and descriptive names |
| Comments | Comments only where necessary |
| Error Handling | Proper error handling |
| Security | No obvious vulnerabilities (SQL injection, XSS, etc.) |
| Performance | No obvious performance issues |

### 8. Code Review Report (Required)

Generate final report in the format:

```
# Code Review Report - [Feature Name]

## Summary
- Date: [date]
- Branch: [branch]
- Status: APPROVED / APPROVED WITH RESERVATIONS / REJECTED
- Modified Files: [X]
- Lines Added: [Y]
- Lines Removed: [Z]

## Rules Compliance
| Rule | Status | Notes |
|------|--------|-------|
| [rule] | OK/NOK | [notes] |

## TechSpec Adherence
| Technical Decision | Implemented | Notes |
|--------------------|-------------|-------|
| [decision] | YES/NO | [notes] |

## Tasks Verified
| Task | Status | Notes |
|------|--------|-------|
| [task] | COMPLETE/INCOMPLETE | [notes] |

## Tests
- Total Tests: [X]
- Passing: [Y]
- Failing: [Z]
- Coverage: [%]

## Issues Found
| Severity | File | Line | Description | Suggestion |
|----------|------|------|-------------|------------|
| High/Medium/Low | [file] | [line] | [desc] | [fix] |

## Positive Highlights
- [positive points identified]

## Recommendations
- [improvement recommendations]

## Conclusion
[Final review assessment]
```

## Quality Checklist

- [ ] TechSpec read and understood
- [ ] Tasks verified
- [ ] Project rules reviewed
- [ ] Git diff analyzed
- [ ] Rules compliance verified
- [ ] TechSpec adherence confirmed
- [ ] Tasks validated as complete
- [ ] Tests executed and passing
- [ ] Code smells checked
- [ ] Final report generated

## Approval Criteria

**APPROVED**: All criteria met, tests passing, code compliant with rules and TechSpec.

**APPROVED WITH RESERVATIONS**: Main criteria met, but there are recommended non-blocking improvements.

**REJECTED**: Tests failing, serious rules violation, non-adherence to TechSpec, or security issues.

## Important Notes

- Always read the complete code of modified files, not just the diff
- Check if there are files that should have been modified but were not
- Consider the impact of changes on other parts of the system
- Be constructive in criticism, always suggesting alternatives

<critical>THE REVIEW IS NOT COMPLETE UNTIL ALL TESTS PASS</critical>
<critical>ALWAYS check the project rules before flagging issues</critical>
