import { Page } from '@playwright/test';

export class ManageProductsPage {
  private page: Page;
  private manageProductsNavBtn: any;
  private addProductButton: any;
  private productNameInput: any;
  private productPriceInput: any;
  private productStockInput: any;
  private productTagSelect: any;
  private saveButton: any;

  constructor(page: Page) {
    this.page = page;
    this.manageProductsNavBtn = page.locator('button:has-text("Quản lý SP"), a:has-text("Quản lý SP")').first();
    this.addProductButton = page.locator('button:has-text("Thêm sản phẩm")').first();
    this.productNameInput = page.locator('input[type="text"]').first();
    this.productPriceInput = page.locator('input[type="number"]').nth(0);
    this.productStockInput = page.locator('input[type="number"]').nth(1);
    this.productTagSelect = page.locator('select').nth(0);
    this.saveButton = page.locator('button[type="submit"]').first();
  }

  async navigateTo() {
    await this.manageProductsNavBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddProduct() {
    await this.addProductButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillProductName(name: string) {
    await this.productNameInput.fill(name);
  }

  async fillProductPrice(price: number) {
    await this.productPriceInput.fill(price.toString());
  }

  async fillProductStock(stock: number) {
    await this.productStockInput.fill(stock.toString());
  }

  async fillProductTag(tag: string) {
    await this.productTagSelect.selectOption({ label: tag });
  }

  async clickSave() {
    const currentUrl = this.page.url();
    await this.saveButton.click();
    await Promise.race([
      this.page.waitForURL((url) => url.href !== currentUrl, { timeout: 10000 }),
      this.page.locator('[class*="success"], [class*="toast"]').first().waitFor({ timeout: 5000 }),
    ]).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  async isSuccessfulSave(): Promise<boolean> {
    const currentUrl = this.page.url();
    return !currentUrl.includes('/add') && !currentUrl.includes('/new');
  }

  async isProductInList(productName: string): Promise<boolean> {
    await this.navigateTo();
    await this.page.waitForLoadState('networkidle');
    const productRow = this.page.locator('text=' + productName).first();
    try {
      await productRow.waitFor({ timeout: 10000 });
      return await productRow.isVisible();
    } catch {
      return false;
    }
  }

  async addProduct(name: string, price: number, stock: number, tag: string) {
    await this.clickAddProduct();
    await this.fillProductName(name);
    await this.fillProductPrice(price);
    await this.fillProductStock(stock);
    await this.fillProductTag(tag);
    await this.clickSave();
  }
}
