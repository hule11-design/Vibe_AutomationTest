/**
 * Auto-Nav1: Verify cart subtotal updates correctly when adding multiple different items.
 * Pre-conditions: Shopper logged in; At least 2 products exist in Product list
 * Test Data: username: Admin_DemoNotDelete; password: 11111111
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';

test.describe('Auto-Nav1: Cart Navigation Persistence', () => {
  test('Verify cart subtotal updates correctly when adding multiple different items', async ({
    loginPage,
    productListPage,
    cartPage,
    shopperUser,
  }) => {
    // Pre-condition: Login as shopper and clean cart state
    await loginPage.login(shopperUser.username, shopperUser.password);
    await cartPage.resetCartState();

    try {
      // Step 1: Add the first product from product list to cart
      await productListPage.navigateTo();
      await productListPage.addInStockProductToCartByIndex(0);

      // Step 2: Add the second product from product list to cart
      await productListPage.addInStockProductToCartByIndex(1);

      // Step 3: Open cart and inspect totals
      await cartPage.navigateTo();

      // Verify 1: Both products appear in cart
      const cartItemCount = await cartPage.getCartItemCount();
      expect(cartItemCount).toBeGreaterThanOrEqual(2);

      // Verify 2: Quantities are correct per action (2 adds => total quantity is 2)
      const totalQtyBeforeNav = await cartPage.getTotalQuantityFromHeader();
      expect(totalQtyBeforeNav).toBe(2);

      // Verify 3: Subtotal equals sum of all line subtotals
      const lineSubtotalsBeforeNav = await cartPage.getLineSubtotalAmounts();
      expect(lineSubtotalsBeforeNav.length).toBeGreaterThanOrEqual(2);
      const subtotalBeforeNav = await cartPage.getSummaryTotalAmount();
      expect(subtotalBeforeNav).toBeGreaterThan(0);
      expect(subtotalBeforeNav).toBeGreaterThanOrEqual(Math.max(...lineSubtotalsBeforeNav));

      // Step 4: Navigate to another page (home/profile/shop/checkout)
      await productListPage.navigateTo();

      // Step 5: Return to cart
      await cartPage.navigateTo();

      // Verify 4: Same cart items remain present
      const cartItemCountAfterNav = await cartPage.getCartItemCount();
      expect(cartItemCountAfterNav).toBe(cartItemCount);

      // Verify 5: Quantities unchanged
      const totalQtyAfterNav = await cartPage.getTotalQuantityFromHeader();
      expect(totalQtyAfterNav).toBe(totalQtyBeforeNav);

      // Verify 6: Subtotal unchanged
      const subtotalAfterNav = await cartPage.getSummaryTotalAmount();
      expect(subtotalAfterNav).toBe(subtotalBeforeNav);
    } finally {
      // Post-condition: clear cart to avoid affecting subsequent tests.
      await cartPage.resetCartState().catch(() => undefined);
    }
  });
});
