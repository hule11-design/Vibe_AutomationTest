import { Page } from '@playwright/test';

export class ProductListPage {
  private page: Page;
  private addToCartButtons: any;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButtons = page.locator('button:has-text("Add to cart"), button:has-text("Thêm vào giỏ")');
  }

  async navigateTo() {
    await this.page.goto('/home', { waitUntil: 'domcontentloaded' });
    await this.addToCartButtons.first().waitFor({ timeout: 15000 });
  }

  async addProductToCart(productName: string) {
    const productHeading = this.page.getByRole('heading', { name: productName, exact: true }).first();
    await productHeading.waitFor({ timeout: 15000 });
    const productCard = productHeading.locator('xpath=ancestor::*[.//button[contains(normalize-space(.), "Thêm vào giỏ") or contains(normalize-space(.), "Add to cart")]][1]');
    const addToCartBtn = productCard.locator('button:has-text("Add to cart"), button:has-text("Thêm vào giỏ")').first();
    await addToCartBtn.click();
  }

  async addFirstInStockProductToCart() {
    const addToCartBtn = this.addToCartButtons.first();
    await addToCartBtn.click();
  }

  async addInStockProductToCartByIndex(index: number) {
    const addToCartBtn = this.addToCartButtons.nth(index);
    await addToCartBtn.waitFor({ timeout: 15000 });
    await addToCartBtn.click();
  }

  async isAddToCartSuccessVisible(): Promise<boolean> {
    try {
      const successToast = this.page.locator('[class*="success"], [class*="toast"], .ant-message-success').first();
      await successToast.waitFor({ timeout: 5000 });
      return await successToast.isVisible();
    } catch {
      return false;
    }
  }
}
