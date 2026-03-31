Generate a PRD from a feature description

<critical>DO NOT GENERATE THE PRD WITHOUT FIRST ASKING CLARIFICATION QUESTIONS (USE YOUR ASK USER QUESTIONS TOOL)</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PRD TEMPLATE PATTERN</critical>

## Objectives

1. Capture complete, clear, and testable requirements focused on the user and business outcomes
2. Follow the structured workflow before creating any PRD
3. Generate a PRD using the standardized template and save it in the correct location

## Template Reference

- Source template: @templates/prd-template.md
- Final file name: `prd.md`
- Final directory: `./tasks/prd-[feature-name]/` (name in kebab-case)

## Workflow

When invoked with a feature request, follow the sequence below.
### 1. Clarify (Required)

Ask questions to understand:

- Problem to solve
- Core functionality
- Constraints
- What is **NOT in scope**

### 2. Plan (Required)

Create a PRD development plan including:

- Section-by-section approach
- Areas needing research (**use Web Search to look up business rules**)
- Assumptions and dependencies

<critical>DO NOT GENERATE THE PRD WITHOUT FIRST ASKING CLARIFICATION QUESTIONS</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PRD TEMPLATE PATTERN</critical>

### 3. Draft the PRD (Required)

- Use the template `templates/prd-template.md`
- **Focus on WHAT and WHY, not HOW**
- Include numbered functional requirements
- Keep the main document to a maximum of 2,000 words

### 4. Create Directory and Save (Required)

- Create the directory: `./tasks/prd-[feature-name]/`
- Save the PRD to: `./tasks/prd-[feature-name]/prd.md`

### 5. Report Results

- Provide the final file path
- Provide a **very brief** summary of the PRD outcome

## Core Principles

- Clarify before planning; plan before drafting
- Minimize ambiguity; prefer measurable statements
- PRD defines outcomes and constraints, **not implementation**
- Always consider usability and accessibility

## Clarification Questions Checklist

- **Problem and Objectives**: what problem to solve, measurable objectives
- **Users and Stories**: primary users, user stories, main flows
- **Core Functionality**: data inputs/outputs, actions
- **Scope and Planning**: what is not included, dependencies
- **Design and Experience**: UI/UX and accessibility guidelines

## Quality Checklist

- [ ] Clarification questions completed and answered
- [ ] Detailed plan created
- [ ] PRD generated using the template
- [ ] Numbered functional requirements included
- [ ] File saved to `./tasks/prd-[feature-name]/prd.md`
- [ ] Final path provided

<critical>DO NOT GENERATE THE PRD WITHOUT FIRST ASKING CLARIFICATION QUESTIONS</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PRD TEMPLATE PATTERN</critical>
