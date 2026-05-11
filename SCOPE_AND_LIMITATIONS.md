# Test Scope and Limitations

## 1. In-Scope Automation
Current automated UI scenarios cover:
- Login success path.
- Product creation with mandatory fields.
- Add-to-cart and cart update behavior.
- Checkout flow (COD and card path).
- Selected negative login validations.

Source mapping:
- `Automation_TestCases_Main.md`
- `Automation_TestCases_Negative.md`

## 2. Out-of-Scope (Current Baseline)
Not included in current baseline unless explicitly added:
- Full cross-browser matrix beyond configured project(s).
- Mobile device-specific UI automation.
- Performance, load, and security testing.
- API-level contract validation.
- Visual regression comparison baseline management.

## 3. Environment Assumptions
- Stable test environment availability.
- Test accounts and data are valid and pre-provisioned.
- Network/firewall allows browser access to target URL.

## 4. Data and Credential Notes
- Any credentials or sensitive data must be externally managed.
- Keep real customer credentials out of source control.

## 5. Quality Interpretation
- A green run indicates covered scenarios passed at runtime.
- It does not imply full product certification outside defined scope.

## 6. Recommended Next Expansion
- Add cross-browser projects.
- Expand negative and boundary cases.
- Add API checks for faster defect localization.
- Add CI scheduling + trend monitoring.
