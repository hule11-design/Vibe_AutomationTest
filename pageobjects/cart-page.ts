import { Page } from '@playwright/test';

export class CartPage {
  private page: Page;
  private cartIcon: any;
  private quantityInput: any;
  private quantityValue: any;
  private decreaseQtyButton: any;
  private increaseQtyButton: any;
  private updateButton: any;
  private subtotalText: any;
  private totalText: any;
  private checkoutButton: any;

  constructor(page: Page) {
    this.page = page;
    this.cartIcon = page.locator('button:has-text("🛒"), a[href*="cart"], [aria-label*="cart" i]').first();
    this.quantityInput = page.locator('input[class*="qty"], input[class*="quantity"], input[name*="qty"], input[type="number"]').first();
    this.quantityValue = page.locator('button:has-text("−") + *, button:has-text("-") + *').first();
    this.decreaseQtyButton = page.locator('button:has-text("−"), button:has-text("-")').first();
    this.increaseQtyButton = page.locator('button:has-text("+"), [class*="increase"], [class*="plus"], [aria-label*="increase" i]').first();
    this.updateButton = page.locator('button:has-text("Update"), button:has-text("Cập nhật"), button:has-text("Apply")').first();
    this.subtotalText = page.locator('[class*="subtotal"], [class*="sub-total"]').first();
    this.totalText = page.locator('[class*="total"]:not([class*="subtotal"])').first();
    this.checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Thanh toán"), a:has-text("Checkout"), button:has-text("Thanh toán ngay")').first();
  }

  private isPageActive(): boolean {
    return !this.page.isClosed();
  }

  async navigateTo() {
    if (!this.isPageActive()) {
      return;
    }

    if (await this.cartIcon.isVisible().catch(() => false)) {
      await this.cartIcon.click();
    } else {
      await this.page.goto('/cart', { waitUntil: 'domcontentloaded' });
    }
    await this.page.getByRole('heading', { name: /Giỏ hàng của bạn/i }).waitFor({ timeout: 15000 });
  }

  async openCartViaIcon() {
    await this.cartIcon.click();
    await this.page.getByRole('heading', { name: /Giỏ hàng của bạn/i }).waitFor({ timeout: 15000 });
  }

  async getProductQuantity(): Promise<number> {
    if (!this.isPageActive()) {
      return 0;
    }

    // Attempt 1: Try quantity input field (direct number input)
    try {
      if (await this.quantityInput.isVisible().catch(() => false)) {
        const value = await this.quantityInput.inputValue();
        const qty = parseInt(value, 10);
        if (!Number.isNaN(qty)) return qty;
      }
    } catch {}

    // Attempt 2: Try quantity display next to minus button
    try {
      if (await this.quantityValue.isVisible().catch(() => false)) {
        const value = (await this.quantityValue.textContent({ timeout: 1000 }).catch(() => '0'))?.trim() ?? '0';
        const qty = parseInt(value, 10);
        if (!Number.isNaN(qty)) return qty;
      }
    } catch {}

    // Attempt 3: Search for any visible quantity pattern on page
    try {
      const allNumbers = this.page.locator('text=/^[0-9]+$/');
      const count = await allNumbers.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const text = await allNumbers.nth(i).textContent();
          const qty = parseInt(text?.trim() ?? '0', 10);
          if (!Number.isNaN(qty) && qty > 0) {
            return qty;
          }
        }
      }
    } catch {}

    // Attempt 4: Look for quantity in common cart attributes
    try {
      const qtyElement = this.page.locator('[data-qty], [data-quantity], [class*="qty-value"], [class*="quantity-value"]').first();
      if (await qtyElement.isVisible().catch(() => false)) {
        const value = await qtyElement.textContent();
        const qty = parseInt(value?.trim() ?? '0', 10);
        if (!Number.isNaN(qty)) return qty;
      }
    } catch {}

    return 0;
  }

  async setQuantity(qty: number) {
    await this.quantityInput.clear();
    await this.quantityInput.fill(qty.toString());
  }

  async increaseQuantity() {
    const beforeQty = await this.getProductQuantity();
    await this.increaseQtyButton.click();
    for (let i = 0; i < 20; i++) {
      const currentQty = await this.getProductQuantity();
      if (currentQty >= beforeQty + 1) {
        break;
      }
      await this.page.waitForTimeout(200);
    }
  }

  async setQuantityTo(targetQty: number) {
    for (let i = 0; i < 12; i++) {
      const currentQty = await this.getProductQuantity();
      if (currentQty === targetQty) {
        break;
      }

      if (await this.quantityInput.isVisible().catch(() => false)) {
        await this.setQuantity(targetQty);
        await this.clickUpdate();
        break;
      }

      if (currentQty > targetQty) {
        await this.decreaseQtyButton.click();
      } else {
        await this.increaseQtyButton.click();
      }

      await this.page.waitForTimeout(250);
    }
  }

  async clickUpdate() {
    try {
      await this.updateButton.waitFor({ timeout: 3000 });
      await this.updateButton.click();
    } catch {
      // Some carts auto-update without a button
    }
  }

  async getLineSubtotal(): Promise<string> {
    const lineSubtotal = this.page.locator('[class*="line-total"], [class*="item-total"], [class*="subtotal"]').first();
    return await lineSubtotal.textContent() ?? '';
  }

  async getCartTotal(): Promise<string> {
    return await this.totalText.textContent() ?? '';
  }

  async isProductInCart(productName: string): Promise<boolean> {
    const productRow = this.page.locator(`text=${productName}`).first();
    try {
      await productRow.waitFor({ timeout: 10000 });
      return await productRow.isVisible();
    } catch {
      return false;
    }
  }

  async getCartItemCount(): Promise<number> {
    const items = this.page.locator('[class*="cart-item"], [class*="order-item"]');
    return await items.count();
  }

  async getTotalQuantityFromHeader(): Promise<number> {
    const headingText = (await this.page.getByRole('heading', { name: /Giỏ hàng của bạn/i }).first().textContent()) ?? '';
    const match = headingText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getLineSubtotalAmounts(): Promise<number[]> {
    const itemRows = this.page.locator('[class*="cart-item"], [class*="order-item"]');
    const rowCount = await itemRows.count();
    const amounts: number[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = itemRows.nth(i);
      const moneyNodes = row.locator('xpath=.//*[contains(normalize-space(text()), "đ") and not(self::s) and not(self::del) and not(contains(@class, "line-through")) and not(contains(@class, "old")) and not(contains(@style, "line-through"))]');
      const moneyNodeCount = await moneyNodes.count();
      if (moneyNodeCount === 0) {
        continue;
      }

      // The last currency node in each cart row is usually the line subtotal.
      const lineTotalText = (await moneyNodes.nth(moneyNodeCount - 1).innerText()).trim();
      const lineTotal = this.parseCurrencyToNumber(lineTotalText);
      amounts.push(lineTotal);
    }

    return amounts;
  }

  async getSummaryTotalAmount(): Promise<number> {
    const pageText = (await this.page.locator('main').innerText().catch(() => '')) || '';
    const allMoneyTokens = pageText.match(/\d[\d\.,]*\s*đ/gi) || [];
    if (allMoneyTokens.length === 0) {
      return 0;
    }

    // In the cart view, the grand total is expected to be the largest monetary value on the page.
    const values = allMoneyTokens.map((token) => this.parseCurrencyToNumber(token));
    return Math.max(...values);
  }

  private parseCurrencyToNumber(value: string): number {
    const digits = (value || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  async clearCart() {
    if (!this.isPageActive()) {
      return;
    }

    const removeButtons = this.page.locator('button:has-text("✕"), button:has-text("x"), button[aria-label*="remove" i], [class*="remove"] button');

    for (let i = 0; i < 20; i++) {
      const count = await removeButtons.count();
      if (count === 0) {
        break;
      }

      await removeButtons.first().click();
      await this.page.waitForTimeout(300);
    }
  }

  async resetCartState() {
    if (!this.isPageActive()) {
      return;
    }

    try {
      await this.navigateTo();
      await this.clearCart();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Target page, context or browser has been closed')) {
        return;
      }
      throw error;
    }
  }

  async clickCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
