/**
 * Auto-N3: Verify required field validation for username.
 * Pre-conditions: None
 * Test Data: username: empty; password: password123
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';

test.describe('Auto-N3: Login Negative', () => {
  test('Verify required field validation for username', async ({ loginPage }) => {
    // Step 1: Navigate to login page
    await loginPage.navigateTo();

    // Step 2: Leave Account field empty
    await loginPage.enterUsername('');

    // Step 3: Enter password 'password123' in Password field
    await loginPage.enterPassword('password123');

    // Step 4: Click Login button
    await loginPage.clickLogin(false);

    // Verify 1: Validation error for Account field is shown
    const hasRequiredValidation = await loginPage.isUsernameRequiredValidationVisible();
    expect(hasRequiredValidation).toBeTruthy();

    // Verify 2: Login request is not sent (observed by staying on login page with local validation)
    const stillOnLoginPage = await loginPage.isOnLoginPage();
    expect(stillOnLoginPage).toBeTruthy();

    // Verify 3: User remains on login page
    expect(stillOnLoginPage).toBeTruthy();
  });
});
