/**
 * Auto-N4: Verify required field validation for password.
 * Pre-conditions: None
 * Test Data: username: valid admin account; password: empty
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { users } from '../../test-data/users';

test.describe('Auto-N4: Login Negative', () => {
  test('Verify required field validation for password', async ({ loginPage }) => {
    // Step 1: Navigate to login page
    await loginPage.navigateTo();

    // Step 2: Enter username 'admin'
    await loginPage.enterUsername(users.admin.username);

    // Step 3: Leave Password field empty
    await loginPage.enterPassword('');

    // Step 4: Click Login button
    await loginPage.clickLogin(false);

    // Verify 1: Validation error for Password field is shown
    const hasPasswordRequiredValidation = await loginPage.isPasswordRequiredValidationVisible();
    expect(hasPasswordRequiredValidation).toBeTruthy();

    // Verify 2: Login request is not sent (observed by staying on login page with local validation)
    const stillOnLoginPage = await loginPage.isOnLoginPage();
    expect(stillOnLoginPage).toBeTruthy();

    // Verify 3: User remains on login page
    expect(stillOnLoginPage).toBeTruthy();
  });
});
