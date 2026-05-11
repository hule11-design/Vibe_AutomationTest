/**
 * Auto-3: Verify user can successfully log in
 * Pre-conditions: None
 * Test Data: username: Admin_DemoNotDelete; password: 11111111
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { users } from '../../test-data/users';

test.describe('Auto-3: Login', () => {
  test('Verify user can successfully log in', async ({ loginPage, dashboardPage }) => {
    // Step 1: Navigate to the application URL
    await loginPage.navigateTo();

    // Step 2: Enter username in Account field
    await loginPage.enterUsername(users.admin.username);

    // Step 3: Enter password in Password field
    await loginPage.enterPassword(users.admin.password);

    // Step 4: Click Login button
    await loginPage.clickLogin();

    // Verify 1: Login succeeds without error
    // Verify 2: User is redirected to dashboard page
    const isDashboardLoaded = await dashboardPage.isDashboardLoaded();
    expect(isDashboardLoaded).toBeTruthy();

    // Verify 3: Account menu or logged-in UI element is visible
    const isAccountMenuVisible = await dashboardPage.isAccountMenuVisible();
    expect(isAccountMenuVisible).toBeTruthy();
  });
});
