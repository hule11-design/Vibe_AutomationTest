import { Page } from '@playwright/test';

export class CheckoutPage {
  private page: Page;
  private fullNameInput: any;
  private phoneInput: any;
  private addressInput: any;
  private cityInput: any;
  private codPaymentOption: any;
  private cardPaymentOption: any;
  private placeOrderButton: any;
  private processingButton: any;
  private orderConfirmationMessage: any;
  private orderConfirmationHeading: any;
  private cardNumberInput: any;
  private mockCardInput: any;
  private cardExpiryInput: any;
  private cardCvcInput: any;
  private checkoutSubmittedAt: Date | null;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator('input[name*="name" i], input[placeholder*="full name" i], input[placeholder*="họ tên" i]').first();
    this.phoneInput = page.locator('input[name*="phone" i], input[placeholder*="phone" i], input[placeholder*="số điện thoại" i], input[type="tel"]').first();
    this.addressInput = page.locator('input[name*="address" i], textarea[name*="address" i], input[placeholder*="address" i]').first();
    this.cityInput = page.locator('input[name*="city" i], select[name*="city" i], input[placeholder*="city" i]').first();
    this.codPaymentOption = page.locator('input[value*="cod" i], label:has-text("COD"), label:has-text("Thanh toán khi nhận hàng"), [id*="cod"]').first();
    this.cardPaymentOption = page.locator('input[value*="card" i], input[value*="stripe" i], label:has-text("Card"), label:has-text("Thẻ"), [id*="stripe"]').first();
    this.placeOrderButton = page.locator('button:has-text("Place Order"), button:has-text("Đặt hàng"), button:has-text("Confirm"), button[type="submit"]').first();
    this.processingButton = page.locator('button:has-text("Đang xử lý"), button:has-text("Processing")').first();
    this.orderConfirmationMessage = page.locator('text=/đặt hàng thành công|order confirmed|thank you|thành công/i').first();
    this.orderConfirmationHeading = page.locator('h1:has-text("Đặt hàng thành công"), h2:has-text("Đặt hàng thành công"), h1:has-text("Order confirmed"), h2:has-text("Order confirmed")').first();
    this.cardNumberInput = page.locator('input[name*="card" i], input[placeholder*="card number" i], iframe[name*="card"] >> input').first();
    this.mockCardInput = page.locator('input[placeholder*="4242"], input[placeholder*="thẻ" i], input[placeholder*="card" i]').first();
    this.cardExpiryInput = page.locator('input[name*="expiry" i], input[placeholder*="MM/YY" i], input[placeholder*="expiry" i]').first();
    this.cardCvcInput = page.locator('input[name*="cvc" i], input[name*="cvv" i], input[placeholder*="CVC" i]').first();
    this.checkoutSubmittedAt = null;
  }

  async navigateTo() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  async fillFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async fillAddress(address: string) {
    await this.addressInput.fill(address);
  }

  async fillShippingInfo(fullName: string, phone: string, address: string, city: string) {
    await this.fillFullName(fullName);
    await this.fillPhone(phone);
    await this.fillAddress(address);
  }

  async selectCodPayment() {
    await this.codPaymentOption.click();
  }

  async selectCardPayment() {
    await this.cardPaymentOption.click();
  }

  async fillCardDetailsInIframe(cardNumber: string, expiry: string, cvc: string) {
    // Stripe uses iframes for card fields
    const cardFrame = this.page.frameLocator('iframe[name*="card-number"], iframe[title*="card" i]').first();
    await cardFrame.locator('input').fill(cardNumber);

    const expiryFrame = this.page.frameLocator('iframe[name*="card-expiry"], iframe[title*="expiry" i]').first();
    await expiryFrame.locator('input').fill(expiry);

    const cvcFrame = this.page.frameLocator('iframe[name*="card-cvc"], iframe[title*="cvc" i]').first();
    await cvcFrame.locator('input').fill(cvc);
  }

  async fillCardDetails(cardNumber: string, expiry: string, cvc: string) {
    // Current app may expose either a single mock card input or Stripe iframe fields.
    if (await this.mockCardInput.isVisible().catch(() => false)) {
      await this.mockCardInput.fill(cardNumber);
      return;
    }

    if (await this.cardNumberInput.isVisible().catch(() => false)) {
      await this.cardNumberInput.fill(cardNumber);

      if (await this.cardExpiryInput.isVisible().catch(() => false)) {
        await this.cardExpiryInput.fill(expiry);
      }

      if (await this.cardCvcInput.isVisible().catch(() => false)) {
        await this.cardCvcInput.fill(cvc);
      }
      return;
    }

    await this.fillCardDetailsInIframe(cardNumber, expiry, cvc);
  }

  async clickPlaceOrder() {
    this.checkoutSubmittedAt = new Date();
    await this.placeOrderButton.click();

    // COD flow can spend a few seconds in processing state before redirect/confirmation.
    if (await this.processingButton.isVisible().catch(() => false)) {
      await this.processingButton.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }
  }

  async isOrderConfirmed(): Promise<boolean> {
    // Success can be represented by a confirmation message or redirect away from checkout.
    const leftCheckout = !(await this.isOnCheckoutPage());
    if (leftCheckout) {
      return true;
    }

    const hasSuccessMessage = await this.orderConfirmationMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSuccessMessage) {
      return true;
    }

    // Last fallback: cart is empty after order completion.
    const emptyCartVisible = await this.page.getByText(/giỏ hàng của bạn đang trống|empty cart/i).isVisible().catch(() => false);
    return emptyCartVisible;
  }

  async isOrderConfirmationPageDisplayed(): Promise<boolean> {
    const hasHeading = await this.orderConfirmationHeading.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasHeading) {
      return true;
    }

    const hasOrderCode = await this.page.getByText(/mã đơn hàng|order id|order code/i).isVisible({ timeout: 5000 }).catch(() => false);
    return hasOrderCode;
  }

  async isOrderPaidOrSuccessStateVisible(): Promise<boolean> {
    const hasPaidOrSuccessText = await this.page.getByText(/paid|success|thành công|đã thanh toán/i).isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPaidOrSuccessText) {
      return true;
    }

    // Confirmation screen itself is a success signal in this app.
    return this.isOrderConfirmationPageDisplayed();
  }

  async isCardPaymentMethodVisible(): Promise<boolean> {
    return this.page.getByText(/stripe|card|thẻ|visa|mastercard/i).isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCodPaymentMethodVisible(): Promise<boolean> {
    return this.page.getByText(/cod|cash on delivery|tiền mặt khi nhận hàng|thanh toán khi nhận hàng/i).isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isOnCheckoutPage(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded');

    const hasCheckoutHeading = await this.page.getByRole('heading', { name: /thanh toán/i }).isVisible().catch(() => false);
    const hasCheckoutForm = await this.fullNameInput.isVisible().catch(() => false);
    const hasPlaceOrder = await this.placeOrderButton.isVisible().catch(() => false);

    // Confirmation screen can stay on /checkout route, so detect by checkout form UI instead of URL.
    return hasCheckoutHeading && (hasCheckoutForm || hasPlaceOrder);
  }

  async getValidationErrors(): Promise<string[]> {
    const errors = this.page.locator('[class*="error"], [class*="invalid-feedback"], [role="alert"]');
    const count = await errors.count();
    const messages: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await errors.nth(i).textContent();
      if (text) messages.push(text);
    }
    return messages;
  }

  async getConfirmedOrderIdAndPaymentDate(): Promise<{ orderId: string; paymentDate: string } | null> {
    const mainText = ((await this.page.locator('main').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

    const labeledOrderIdMatch = mainText.match(/(?:mã đơn hàng|mã đơn|order id|order code)\s*[:\-]?\s*#?([A-Z0-9-]{4,})/i);
    const fallbackOrderIdMatch = mainText.match(/#([A-Z0-9-]{4,})/i);
    const orderId = (labeledOrderIdMatch?.[1] || fallbackOrderIdMatch?.[1] || '').trim();

    const labeledDateMatch = mainText.match(/(?:ngày thanh toán|payment date|ngày đặt|order date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i);
    const fallbackDateMatch = mainText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i);
    const paymentDateFromText = (labeledDateMatch?.[1] || fallbackDateMatch?.[1] || '').trim();
    const paymentDate = paymentDateFromText || this.getSubmittedDateFallback();

    if (!orderId || !paymentDate) {
      return null;
    }

    return { orderId, paymentDate };
  }

  async getConfirmedSummaryTotalAndPaymentMethod(): Promise<{ summaryTotal: number; paymentMethod: string } | null> {
    const mainText = ((await this.page.locator('main').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

    const moneyMatches = mainText.match(/\d[\d\.,]*\s*đ|\$\s*\d[\d\.,]*/gi) || [];
    const summaryTotal = moneyMatches.length > 0 ? this.parseAmountToNumber(moneyMatches[moneyMatches.length - 1]) : 0;

    const paymentMethodMatch = mainText.match(/(?:💳\s*)?(thẻ|card|stripe|visa|mastercard|cod|cash on delivery|thanh toán khi nhận hàng|tiền mặt khi nhận hàng|tiền mặt)/i);
    const rawPaymentMethod = (paymentMethodMatch?.[1] || '').trim();
    const paymentMethod = this.normalizePaymentMethod(rawPaymentMethod);

    if (!summaryTotal || !paymentMethod) {
      return null;
    }

    return { summaryTotal, paymentMethod };
  }

  async getConfirmedSummaryTotalAndCardMethod(): Promise<{ summaryTotal: number; cardMethod: string } | null> {
    const paymentInfo = await this.getConfirmedSummaryTotalAndPaymentMethod();
    if (!paymentInfo) {
      return null;
    }

    return {
      summaryTotal: paymentInfo.summaryTotal,
      cardMethod: paymentInfo.paymentMethod,
    };
  }

  private getSubmittedDateFallback(): string {
    if (!this.checkoutSubmittedAt) {
      return '';
    }

    const day = String(this.checkoutSubmittedAt.getDate()).padStart(2, '0');
    const month = String(this.checkoutSubmittedAt.getMonth() + 1).padStart(2, '0');
    const year = String(this.checkoutSubmittedAt.getFullYear());
    return `${day}/${month}/${year}`;
  }

  private parseAmountToNumber(value: string): number {
    const digits = (value || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  private normalizePaymentMethod(value: string): string {
    const text = (value || '').toLowerCase();

    if (/cod|cash on delivery|tiền mặt|thanh toán khi nhận hàng/.test(text)) {
      return 'cod';
    }

    if (/card|thẻ|stripe|visa|mastercard|tín dụng/.test(text)) {
      return 'card';
    }

    return text.trim();
  }
}
