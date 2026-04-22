<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->


## Project Structure
- `tests/`: End-to-end test cases, organized by feature (e.g., `ui/`, `api/`).
- `playwright.config.ts`: Playwright configuration.
- `package.json`: Project dependencies and scripts.
- `test-data/`: Test data files, organized by environment and feature.
- `pageobjects/`: Page object classes, one per page/function, following the page object model.
- `fixtures/`: Playwright fixtures, used to initialize and provide page objects to tests.

## Page Object Convention
- Create separate files in `pageobjects/` based on its function or the page name mentioned in test step.
- Each page object class should encapsulate all interactions and elements of a specific page or component. 
- The element should be defined as class properties and initialized in the constructor.
-If locators are not unique, refine them using their attributes or their parent/child/sibling relationships and captured by xpath.
-All selectors should be robust and unique.
-Validate selectors by running tests in headed mode.
### Example Page Object Class
```typescript

export class GetAQuotePage {
  nextBtn: any;
  constructor(page: any) {
    this.nextBtn = page.locator('button:has-text("Next")');
  }
  async clickNext() {
    await this.nextBtn.click();
  }
}

```
### Example of Fixture Integration
```typescript

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});
```

## Test Convention
- Apply the Page Object Model for all test cases.
- Use Playwright fixtures to initialize page objects.
- Reuse existing test cases and page objects to avoid redundancy.
- Don't use page variables directly in test cases; instead, encapsulate them within page object classes.Eg: page.goto(url) should be in page object class method like navigateTo(url).
- Call all test steps from page object classes only.
- Ensure tests are independent and can run in any order.
- Use meaningful names for test cases and variables to improve readability.
- Apply data-driven testing to cover various input scenarios.
- Ensure all import paths are relative and correct. Use import paths like `from '../../page-object/login-page'` based on the test file location.

### Example Test Case
```typescript
import { expect } from '@playwright/test';
import { test } from '../fixtures/pageObjectsFixture';

test.describe('Login Page', () => {
  const validUsers = [
    { username: 'user1', password: 'pass1' },
    { username: 'user2', password: 'pass2' },
  ];

  for (const user of validUsers) {
    test(`should login successfully for ${user.username}`, async ({ loginPage }) => {
      await loginPage.login(user.username, user.password);
      // Add assertions for successful login
    });
  }
});
```