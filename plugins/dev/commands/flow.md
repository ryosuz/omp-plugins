---
description: Design, implement, review, and fix code changes
argument-hint: <task>
---

# Development Workflow

Task: $ARGUMENTS

Execute the following workflow for the specified task.

## 1. DESIGN

- Analyze requirements and existing code.
- Create a concrete implementation plan.
- Define acceptance criteria.

## 2. IMPLEMENT

- Delegate implementation to the `implementer` agent.
- Provide the complete plan and acceptance criteria.
- Wait for implementation to finish.

## 3. REVIEW

- Delegate code review to the `reviewer` agent.
- Review the changes against the original plan.
- Check correctness, edge cases, and test coverage.

## 4. FIX

- If review finds issues, delegate fixes to `implementer`.
- Repeat review after fixes.
- Limit the review/fix loop to 3 iterations.

## 5. COMPLETE

- Report the final result and remaining issues.
