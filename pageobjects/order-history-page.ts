import { Page } from '@playwright/test';

export class OrderHistoryPage {
  private page: Page;
  private orderHistoryLink: any;
  private orderHistoryHeading: any;
  private orderRowCandidates: any;
  private globalLoadingText: any;

  constructor(page: Page) {
    this.page = page;
    this.orderHistoryLink = page.locator('a:has-text("Lịch sử đơn hàng"), a:has-text("Order History"), a:has-text("My Orders"), a:has-text("Đơn hàng"), button:has-text("Lịch sử đơn hàng"), button:has-text("Order History")').first();
    this.orderHistoryHeading = page.locator('h1:has-text("Lịch sử đơn hàng"), h2:has-text("Lịch sử đơn hàng"), h1:has-text("Order History"), h2:has-text("Order History"), h1:has-text("My Orders"), h2:has-text("My Orders")').first();
    this.orderRowCandidates = page.locator('tbody tr, [class*="order-row"], [class*="order-item"], [class*="order-card"]');
    this.globalLoadingText = page.getByText(/đang tải|loading/i).first();
  }

  async openOrderHistoryPage(): Promise<boolean> {
    if (await this.orderHistoryLink.isVisible().catch(() => false)) {
      await this.orderHistoryLink.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.waitForLoadingToSettle();
      if (await this.isOrderHistoryPageVisible()) {
        return true;
      }
    }

    const historyRoutes = [
      '/orders',
      '/order-history',
      '/orders/history',
      '/history',
      '/my-orders',
      '/account/orders',
      '/profile/orders',
      '/profile/history',
      '/profile?tab=orders',
      '/profile?tab=history',
      '/profile?section=orders',
    ];

    for (const route of historyRoutes) {
      await this.page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.waitForLoadingToSettle();
      if (await this.isOrderHistoryPageVisible()) {
        return true;
      }
    }

    return false;
  }

  async isOrderHistoryPageVisible(): Promise<boolean> {
    if (await this.globalLoadingText.isVisible().catch(() => false)) {
      return false;
    }

    const hasHeading = await this.orderHistoryHeading.isVisible().catch(() => false);
    if (hasHeading) {
      return true;
    }

    const hasOrderTableText = await this.page.getByText(/mã đơn|order id|order history|lịch sử đơn/i).isVisible().catch(() => false);
    if (hasOrderTableText) {
      return true;
    }

    const rowCount = await this.orderRowCandidates.count().catch(() => 0);
    return rowCount > 0;
  }

  async isFirstOrderRowVisible(): Promise<boolean> {
    return await this.orderRowCandidates.first().isVisible().catch(() => false);
  }

  async isOrderRowVisibleByOrderId(orderId: string): Promise<boolean> {
    return await this.getOrderRowByOrderId(orderId).isVisible().catch(() => false);
  }

  async doesFirstOrderMatchIdAndDate(orderId: string, paymentDate: string): Promise<boolean> {
    const firstRowText = await this.getFirstOrderRowText();
    const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
    const normalizeDate = (value: string) => value.replace(/[^\d]/g, '');
    const normalizedRowText = normalize(firstRowText);
    const normalizedRowDateDigits = normalizeDate(firstRowText);
    const normalizedOrderId = normalize(orderId);
    const normalizedPaymentDate = normalize(paymentDate);
    const normalizedPaymentDateDigits = normalizeDate(paymentDate);

    const hasExactOrderId = normalizedRowText.includes(normalizedOrderId);
    const hasExactPaymentDate =
      normalizedRowText.includes(normalizedPaymentDate) ||
      (normalizedPaymentDateDigits.length >= 6 && normalizedRowDateDigits.includes(normalizedPaymentDateDigits));

    return hasExactOrderId && hasExactPaymentDate;
  }

  async doesOrderMatchIdAndDateByOrderId(orderId: string, paymentDate: string): Promise<boolean> {
    const rowText = await this.getOrderRowTextByOrderId(orderId);
    if (!rowText) {
      return false;
    }

    const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
    const normalizeDate = (value: string) => value.replace(/[^\d]/g, '');

    const normalizedRowText = normalize(rowText);
    const normalizedRowDateDigits = normalizeDate(rowText);
    const normalizedOrderId = normalize(orderId);
    const normalizedPaymentDate = normalize(paymentDate);
    const normalizedPaymentDateDigits = normalizeDate(paymentDate);

    const hasExactOrderId = normalizedRowText.includes(normalizedOrderId);
    const hasExactPaymentDate =
      normalizedRowText.includes(normalizedPaymentDate) ||
      (normalizedPaymentDateDigits.length >= 6 && normalizedRowDateDigits.includes(normalizedPaymentDateDigits));

    return hasExactOrderId && hasExactPaymentDate;
  }

  async isFirstOrderConfirmed(): Promise<boolean> {
    const firstRowText = await this.getFirstOrderRowText();
    return /(confirmed|xác nhận|đã xác nhận|thành công|paid)/i.test(firstRowText);
  }

  async isOrderConfirmedByOrderId(orderId: string): Promise<boolean> {
    const rowText = await this.getOrderRowTextByOrderId(orderId);
    if (!rowText) {
      return false;
    }

    return /(confirmed|xác nhận|đã xác nhận|thành công|paid)/i.test(rowText);
  }

  async doesFirstOrderMatchSummaryTotalAndPaymentMethod(summaryTotal: number, paymentMethod: string): Promise<boolean> {
    const firstRowText = await this.getFirstOrderRowText();
    const normalizeText = (value: string) => value.replace(/\s+/g, '').toLowerCase();
    const normalizeDigits = (value: string) => value.replace(/[^\d]/g, '');

    const normalizedRowText = normalizeText(firstRowText);
    const normalizedPaymentMethod = normalizeText(paymentMethod);

    const rowMoneyMatches = firstRowText.match(/\d[\d\.,]*\s*đ|\$\s*\d[\d\.,]*/gi) || [];
    const rowAmounts = rowMoneyMatches.map((token) => this.parseAmountToNumber(token));
    const hasExactTotal = rowAmounts.includes(summaryTotal) || normalizeDigits(firstRowText).includes(String(summaryTotal));
    const hasExactPaymentMethod = this.matchesPaymentMethod(normalizedRowText, normalizedPaymentMethod);

    return hasExactTotal && hasExactPaymentMethod;
  }

  async doesOrderMatchSummaryTotalAndPaymentMethodByOrderId(orderId: string, summaryTotal: number, paymentMethod: string): Promise<boolean> {
    const rowText = await this.getOrderRowTextByOrderId(orderId);
    if (!rowText) {
      return false;
    }

    const normalizeText = (value: string) => value.replace(/\s+/g, '').toLowerCase();
    const normalizeDigits = (value: string) => value.replace(/[^\d]/g, '');

    const normalizedRowText = normalizeText(rowText);
    const normalizedPaymentMethod = normalizeText(paymentMethod);

    const rowMoneyMatches = rowText.match(/\d[\d\.,]*\s*đ|\$\s*\d[\d\.,]*/gi) || [];
    const rowAmounts = rowMoneyMatches.map((token) => this.parseAmountToNumber(token));
    const hasExactTotal = rowAmounts.includes(summaryTotal) || normalizeDigits(rowText).includes(String(summaryTotal));
    const hasExactPaymentMethod = this.matchesPaymentMethod(normalizedRowText, normalizedPaymentMethod);

    return hasExactTotal && hasExactPaymentMethod;
  }

  async doesFirstOrderMatchSummaryTotalAndCardMethod(summaryTotal: number, cardMethod: string): Promise<boolean> {
    return this.doesFirstOrderMatchSummaryTotalAndPaymentMethod(summaryTotal, cardMethod);
  }

  private async getFirstOrderRowText(): Promise<string> {
    const rowCount = await this.orderRowCandidates.count().catch(() => 0);
    if (rowCount > 0) {
      return (await this.orderRowCandidates.first().innerText()).replace(/\s+/g, ' ').trim();
    }

    return ((await this.page.locator('main').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  }

  private getOrderRowByOrderId(orderId: string) {
    const escapedOrderId = this.escapeRegExp(orderId);
    return this.orderRowCandidates.filter({ hasText: new RegExp(`#?${escapedOrderId}`, 'i') }).first();
  }

  private async getOrderRowTextByOrderId(orderId: string): Promise<string | null> {
    const row = this.getOrderRowByOrderId(orderId);
    const isVisible = await row.isVisible().catch(() => false);
    if (!isVisible) {
      return null;
    }

    return (await row.innerText()).replace(/\s+/g, ' ').trim();
  }

  private async waitForLoadingToSettle() {
    if (await this.globalLoadingText.isVisible().catch(() => false)) {
      await this.globalLoadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
  }

  private parseAmountToNumber(value: string): number {
    const digits = (value || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  private matchesPaymentMethod(normalizedRowText: string, normalizedPaymentMethod: string): boolean {
    if (normalizedPaymentMethod === 'cod') {
      return /(cod|tiềnmặt|cashondelivery|thanhtoánkhinhậnhàng)/i.test(normalizedRowText);
    }

    if (normalizedPaymentMethod === 'card') {
      return /(card|thẻ|stripe|visa|mastercard|tíndụng)/i.test(normalizedRowText);
    }

    return normalizedRowText.includes(normalizedPaymentMethod);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}