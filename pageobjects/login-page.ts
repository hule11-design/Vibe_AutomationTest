import { Page } from '@playwright/test';

export class LoginPage {
  private page: Page;
  private accountInput: any;
  private passwordInput: any;
  private loginButton: any;
  private loginErrorBanner: any;

  constructor(page: Page) {
    this.page = page;
    this.accountInput = page.locator('input[placeholder*="account" i], input[placeholder*="username" i], input[name="username"], input[name="account"], input[type="text"]').first();
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Đăng nhập"), button[type="submit"]').first();
    this.loginErrorBanner = page.locator('[role="alert"], .ant-alert-error, .ant-message-error, [class*="error" i], [class*="invalid" i]').first();
  }

  async navigateTo() {
    await this.page.goto('/');
  }

  async enterUsername(username: string) {
    await this.accountInput.fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin(expectRedirect = true) {
    await this.loginButton.click();
    if (expectRedirect) {
      // Wait for login to complete and redirect away from login page
      await this.page.waitForURL((url) => !url.pathname.includes('/login') && url.pathname !== '/', { timeout: 15000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle');
      return;
    }

    // For negative flows, do not wait for network idle because transient validation alerts can disappear quickly.
    for (let i = 0; i < 20; i++) {
      const isDisabled = await this.loginButton.isDisabled().catch(() => false);
      if (!isDisabled) {
        break;
      }
      await this.page.waitForTimeout(250);
    }
  }

  async login(username: string, password: string, expectRedirect = true) {
    await this.navigateTo();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin(expectRedirect);
  }

  async isLoginErrorVisible(): Promise<boolean> {
    const textError = this.page.locator('text=/invalid|incorrect|mismatch|wrong|failed|sai|kh[oô]ng|th[aá]t\s*b[aạ]i/i').first();
    try {
      await Promise.race([
        this.loginErrorBanner.waitFor({ state: 'visible', timeout: 5000 }),
        textError.waitFor({ state: 'visible', timeout: 5000 }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async hasInvalidCredentialsMessage(): Promise<boolean> {
    const pageText = await this.page.locator('body').innerText();
    return /invalid|incorrect|mismatch|username\/?password|wrong|sai|kh[oô]ng\s*đ[uú]ng|th[aá]t\s*b[aạ]i/i.test(pageText);
  }

  async hasGenericLoginErrorMessage(): Promise<boolean> {
    await Promise.race([
      this.page.locator('[role="alert"], .ant-alert-error, .ant-message-error').first().waitFor({ state: 'visible', timeout: 10000 }),
      this.page.waitForTimeout(1000),
    ]).catch(() => {});

    const pageText = await this.page.locator('body').innerText();
    return /invalid|incorrect|username\/?password|wrong|login failed|đăng nhập thất bại|không đúng|vui lòng nhập đầy đủ tài khoản và mật khẩu|tài khoản hoặc mật khẩu/i.test(pageText);
  }

  async doesNotRevealUserExistence(): Promise<boolean> {
    const pageText = await this.page.locator('body').innerText();
    return !/user not found|username not found|does not exist|không tồn tại|tài khoản không tồn tại/i.test(pageText);
  }

  async isUsernameRequiredValidationVisible(): Promise<boolean> {
    const validationMessage = await this.accountInput.evaluate((el: any) => el.validationMessage || '').catch(() => '');
    if (validationMessage.trim().length > 0) {
      return true;
    }

    const hasGenericRequiredAlert = await this.hasGenericLoginErrorMessage();
    if (hasGenericRequiredAlert) {
      return true;
    }

    const fieldError = this.page
      .locator('text=/required|please input|please enter|bắt buộc|vui lòng nhập/i')
      .first();
    return await fieldError.isVisible().catch(() => false);
  }

  async isPasswordRequiredValidationVisible(): Promise<boolean> {
    const validationMessage = await this.passwordInput.evaluate((el: any) => el.validationMessage || '').catch(() => '');
    if (validationMessage.trim().length > 0) {
      return true;
    }

    const hasGenericRequiredAlert = await this.hasGenericLoginErrorMessage();
    if (hasGenericRequiredAlert) {
      return true;
    }

    const fieldError = this.page
      .locator('text=/required|please input|please enter|bắt buộc|vui lòng nhập/i')
      .first();
    return await fieldError.isVisible().catch(() => false);
  }

  async isOnLoginPage(): Promise<boolean> {
    const currentUrl = this.page.url();
    const hasLoginUrl = /\/login$|\/login\?|\/$/.test(currentUrl);
    const hasLoginForm = await this.accountInput.isVisible().catch(() => false);
    const hasPasswordField = await this.passwordInput.isVisible().catch(() => false);
    const hasLoginButton = await this.loginButton.isVisible().catch(() => false);
    return hasLoginUrl && hasLoginForm && hasPasswordField && hasLoginButton;
  }
}
