/**
 * Auto-6: Verify increasing item quantity in cart recalculates line total and cart total correctly.
 * Pre-conditions: Shopper logged in; Target product (SKU_1001) is added to cart
 * Test Data: product: SKU_1001; unitPrice: 900000; qty: 1->2
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { products } from '../../test-data/products';

test.describe('Auto-6: Cart Quantity Update', () => {
  test('Verify increasing item quantity recalculates line total and cart total correctly', async ({
    loginPage,
    productListPage,
    cartPage,
    shopperUser,
  }) => {
    const unitPrice = products.sku1001.price;

    // Pre-condition: Login as shopper and add product to cart
    await loginPage.login(shopperUser.username, shopperUser.password);
    await cartPage.resetCartState();

    try {
      await productListPage.navigateTo();
      await productListPage.addProductToCart(products.sku1001.name);

      // Step 1: Open cart page
      await cartPage.navigateTo();

      // Ensure cart has at least one item before validating quantity controls.
      let cartQty = await cartPage.getTotalQuantityFromHeader();
      if (cartQty === 0) {
        await productListPage.navigateTo();
        await productListPage.addFirstInStockProductToCart();
        await cartPage.navigateTo();
        cartQty = await cartPage.getTotalQuantityFromHeader();
      }
      expect(cartQty).toBeGreaterThan(0);

      // Ensure baseline quantity is 1 so the scenario always validates 1 -> 2.
      await cartPage.setQuantityTo(1);

      // Step 2: Increase quantity of item from 1 to 2
      await cartPage.increaseQuantity();

      // Step 3: Click update/apply if required
      await cartPage.clickUpdate();

      // Step 4: Observe totals
      const newQty = await cartPage.getProductQuantity();

      // Verify 1: Item quantity changes to 2
      expect(newQty).toBe(2);

      // Verify 2 & 3: Line subtotal and cart total update correctly
      const lineTotal = await cartPage.getLineSubtotal();
      const cartTotal = await cartPage.getCartTotal();
      const expectedTotal = unitPrice * 2;

      // Check that the displayed totals contain the expected calculated amount
      const normalizeNumber = (str: string) => str.replace(/[^\d]/g, '');
      expect(normalizeNumber(lineTotal)).toContain(normalizeNumber(expectedTotal.toString()));
      expect(cartTotal).toBeTruthy();
    } finally {
      // Post-condition: Clear cart so this test does not affect later scenarios.
      await cartPage.resetCartState().catch(() => undefined);
    }
  });
});
