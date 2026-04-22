/**
 * Auto-N1: Verify error message is displayed when password is incorrect.
 * Pre-conditions: None
 * Test Data: username: valid admin account; password: wrongpass
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { users } from '../../test-data/users';

test.describe('Auto-N1: Login Negative', () => {
  test('Verify error message is displayed when password is incorrect', async ({ loginPage }) => {
    // Step 1: Navigate to login page
    await loginPage.navigateTo();

    // Step 2: Enter username 'admin'
    await loginPage.enterUsername(users.admin.username);

    // Step 3: Enter incorrect password 'wrongpass'
    await loginPage.enterPassword('wrongpass');

    // Step 4: Click Login button
    await loginPage.clickLogin(false);

    // Verify 1: Login fails with clear error message
    const isErrorVisible = await loginPage.isLoginErrorVisible();
    expect(isErrorVisible).toBeTruthy();

    // Verify 2: Error message indicates invalid credentials or username/password mismatch
    const hasInvalidCredentialHint = await loginPage.hasInvalidCredentialsMessage();
    expect(hasInvalidCredentialHint).toBeTruthy();

    // Verify 3: User remains on login page
    const stillOnLoginPage = await loginPage.isOnLoginPage();
    expect(stillOnLoginPage).toBeTruthy();
  });
});
