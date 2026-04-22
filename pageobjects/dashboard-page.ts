import { Page } from '@playwright/test';

export class DashboardPage {
  private page: Page;
  private accountMenu: any;
  private logoutButton: any;
  private profileMenu: any;

  constructor(page: Page) {
    this.page = page;
    this.accountMenu = page.locator('[class*="avatar"], [class*="user-menu"], [class*="account"], img[alt*="avatar"], .ant-dropdown-trigger').first();
    this.logoutButton = page.locator('text=Logout, text=Đăng xuất, text=Sign out').first();
    this.profileMenu = page.locator('[class*="profile"], [class*="user"]').first();
  }

  async isAccountMenuVisible(): Promise<boolean> {
    return await this.accountMenu.isVisible().catch(() => false);
  }

  async isLogoutButtonVisible(): Promise<boolean> {
    try {
      await this.logoutButton.waitFor({ timeout: 5000 });
      return await this.logoutButton.isVisible();
    } catch {
      return false;
    }
  }

  async isDashboardLoaded(): Promise<boolean> {
    await this.page.waitForLoadState('networkidle');
    const url = this.page.url();
    return !url.includes('/login') && !url.includes('/auth');
  }
}
