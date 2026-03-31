# Bugs — Crypto Portfolio Tracker

## A11Y-1: CoinSearch dropdown options remove visible focus indicator

- **Severity:** Minor
- **Location:** `CoinSearch.tsx:94`
- **WCAG Criterion:** 2.4.7 Focus Visible
- **Description:** Dropdown options use `focus:outline-none`, removing the visible focus indicator for keyboard users.
- **Status:** Fixed
- **Fix applied:** Replaced `focus:outline-none` with `focus:outline-2 focus:outline-indigo-500` to show a visible indigo focus ring.
- **Regression tests:** `accessibility.test.tsx > A11Y-1 — CoinSearch focus visibility > dropdown options do not use focus:outline-none`

## A11Y-2: Form error messages not linked to inputs via aria-describedby

- **Severity:** Minor
- **Location:** `HoldingForm.tsx:211-239`
- **WCAG Criterion:** 1.3.1 Info & Relationships
- **Description:** Validation error messages are not programmatically linked to their respective inputs, so screen readers cannot associate errors with fields.
- **Status:** Fixed
- **Fix applied:** Added `id` attributes to error `<p>` elements and `aria-describedby` on inputs pointing to their error (only when errors are present).
- **Regression tests:**
  - `accessibility.test.tsx > A11Y-2 — Error messages linked via aria-describedby > quantity error is linked to input via aria-describedby`
  - `accessibility.test.tsx > A11Y-2 — Error messages linked via aria-describedby > price error is linked to input via aria-describedby`
  - `accessibility.test.tsx > A11Y-2 — Error messages linked via aria-describedby > aria-describedby is absent when no errors`

## A11Y-3: Form inputs missing required and aria-required attributes

- **Severity:** Minor
- **Location:** `HoldingForm.tsx:201-226`
- **WCAG Criterion:** 1.3.5 Identify Input Purpose
- **Description:** Quantity and price inputs lack `required` and `aria-required="true"` attributes, preventing assistive technology from communicating that these fields are mandatory.
- **Status:** Fixed
- **Fix applied:** Added `required` and `aria-required="true"` to both inputs. Also added `noValidate` on the `<form>` to preserve existing custom validation behavior.
- **Regression tests:**
  - `accessibility.test.tsx > A11Y-3 — Inputs have required and aria-required > quantity input has required and aria-required attributes`
  - `accessibility.test.tsx > A11Y-3 — Inputs have required and aria-required > price input has required and aria-required attributes`

## A11Y-4: No skip-to-main-content link

- **Severity:** Minor
- **Location:** `App.tsx`
- **WCAG Criterion:** 2.4.1 Bypass Blocks
- **Description:** The page has no skip navigation link, forcing keyboard users to tab through the entire header before reaching main content.
- **Status:** Fixed
- **Fix applied:** Added a visually-hidden skip link (`sr-only` with `focus:not-sr-only`) at the top of the page targeting `#main-content`, and added `id="main-content"` to the `<main>` element.
- **Regression tests:**
  - `accessibility.test.tsx > A11Y-4 — Skip to main content link > renders a skip-to-main-content link targeting #main-content`
  - `accessibility.test.tsx > A11Y-4 — Skip to main content link > main element has id="main-content" as skip link target`

## A11Y-5: Holdings table missing caption element

- **Severity:** Minor
- **Location:** `HoldingsTable.tsx:37`
- **WCAG Criterion:** 1.3.1 Info & Relationships
- **Description:** The holdings `<table>` lacks a `<caption>` element, which helps screen readers identify the table's purpose.
- **Status:** Fixed
- **Fix applied:** Added `<caption className="sr-only">Portfolio holdings with prices, allocation, and profit/loss</caption>` as the first child of the table.
- **Regression tests:** `accessibility.test.tsx > A11Y-5 — Holdings table has caption > table includes a caption element`
