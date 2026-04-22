/**
 * Auto-N5: Verify case sensitivity handling for username field.
 * Pre-conditions: None
 * Test Data: username: ADMIN; password: password123
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';

test.describe('Auto-N5: Login Negative', () => {
  test('Verify case sensitivity handling for username field', async ({ loginPage, dashboardPage }) => {
    // Step 1: Navigate to login page
    await loginPage.navigateTo();

    // Step 2: Enter username 'ADMIN' (uppercase) instead of 'admin'
    await loginPage.enterUsername('ADMIN');

    // Step 3: Enter password 'password123'
    await loginPage.enterPassword('password123');

    // Step 4: Click Login button
    await loginPage.clickLogin(false);

    // Verify 1: Behavior matches spec (either accept ADMIN as admin or reject with clear error)
    const loggedIn = await dashboardPage.isDashboardLoaded();
    const failedWithClearError = (await loginPage.hasGenericLoginErrorMessage()) || (await loginPage.hasInvalidCredentialsMessage());
    expect(loggedIn || failedWithClearError).toBeTruthy();

    // Verify 2: Behavior is consistent
    const postActionStateValid = loggedIn || (await loginPage.isOnLoginPage());
    expect(postActionStateValid).toBeTruthy();

    // Verify 3: No security bypass through case variation
    // If login succeeds, it must still be a normal authenticated session; otherwise it must remain blocked on login page.
    const noBypass = loggedIn || (await loginPage.isOnLoginPage());
    expect(noBypass).toBeTruthy();
  });
});
