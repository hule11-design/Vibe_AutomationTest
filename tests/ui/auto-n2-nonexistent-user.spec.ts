/**
 * Auto-N2: Verify error message for non-existent username without leaking user existence.
 * Pre-conditions: None
 * Test Data: username: nonexistent_user_xyz; password: anypass123
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';

test.describe('Auto-N2: Login Negative', () => {
  test('Verify error message for non-existent username without leaking user existence', async ({ loginPage }) => {
    // Step 1: Navigate to login page
    await loginPage.navigateTo();

    // Step 2: Enter username 'nonexistent_user_xyz'
    await loginPage.enterUsername('nonexistent_user_xyz');

    // Step 3: Enter any password 'anypass123'
    await loginPage.enterPassword('anypass123');

    // Step 4: Click Login button
    await loginPage.clickLogin(false);

    // Verify 1: Login fails with generic error message
    const hasGenericError = await loginPage.hasGenericLoginErrorMessage();
    expect(hasGenericError).toBeTruthy();

    // Verify 2: Message does not reveal whether username is invalid or password is wrong
    const noUserEnumerationLeak = await loginPage.doesNotRevealUserExistence();
    expect(noUserEnumerationLeak).toBeTruthy();

    // Verify 3: User remains on login page
    const stillOnLoginPage = await loginPage.isOnLoginPage();
    expect(stillOnLoginPage).toBeTruthy();

    // Verify 4: Prevents user enumeration attacks (same verification intent as generic + no leak)
    expect(hasGenericError && noUserEnumerationLeak).toBeTruthy();
  });
});
