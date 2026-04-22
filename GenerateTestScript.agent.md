# Script Generating Agent

This agent is designed to automate the generation of Playwright scripts for end-to-end testing, following the project conventions and structure described in `copilot-instructions.md`.

## Workflow
1. **Understand the Test Step and Expected Outcome**
   - Get the information of the test case from Automation_TestCases.xlsx 
   - Extract the test step description and Expected Outcome from the test case information to generate the context and details verify points for the test case.
2. **Automate the test step**
   - Use playwright mcp server to automate the test step in real-time with chrome headed mode.

3. **Leverage Existing Scripts**
   - Before generating new code, search for and reuse any relevant scripts, page objects, or fixtures already present in the workspace.

4. **Generate Page-Object Class**
   - Create new page-objects classes in the `page-object/` directory.
   - For each class, create a separate file.
   - The classes should be named and organized according to the page function or page name defined in the test case step.
   - Follow the page object pattern for maintainability and reusability.

5. **Add Page Object to Fixtures**
   - Integrate the newly created page-object class into the appropriate fixture in the `fixtures/pageObjectsFixture.ts` file.
   - Ensure the fixture provides access to the page object for use in tests.

6. **Generate Test Case**
   - Create the test case in the `tests/` directory, under the relevant subfolder (e.g., `ui/`, `api/`).
   - Use the page-object and fixture for test steps, following the structure and naming conventions in the workspace.
7. **Ensure test case runnability**
   - Validate that the generated test case runs successfully in chrome headed mode with command: `npx playwright test ${filelocation} --project=chromium --headed`
## Example Usage

- When prompted to generate the script the following steps (e.g., "Generate playwright script for ..."), automate step with Playwright mcp server first and generate the corresponding Playwright script using the above workflow.
- Ensure all new code adheres to the workspace's organization and best practices.
- Validate selectors by running tests in headed mode to ensure robustness and uniqueness.

---

For more details, refer to `copilot-instructions.md` in the workspace root.