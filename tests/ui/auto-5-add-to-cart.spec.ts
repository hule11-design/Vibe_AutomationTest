/**
 * Auto-5: Verify shopper can add one product to cart from product listing
 * Pre-conditions: Shopper logged in; Target product (SKU_1001) is added to Product list
 * Test Data: base product from products.ts (products.sku1001)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { products } from '../../test-data/products';

test.describe('Auto-5: Add to Cart', () => {
  test('Verify shopper can add one product to cart from product listing', async ({
    loginPage,
    productListPage,
    cartPage,
    shopperUser,
  }) => {
    // Pre-condition: Login as shopper
    await loginPage.login(shopperUser.username, shopperUser.password);
    await cartPage.resetCartState();

    try {
      // Step 1: Open product list page
      await productListPage.navigateTo();

      // Step 2: Click 'Add to cart' on an in-stock product
      await productListPage.addProductToCart(products.sku1001.name);

      // Step 3: Open cart page
      await cartPage.navigateTo();

      // Verify 1: Product appears in cart
      const isInCart = await cartPage.isProductInCart(products.sku1001.name);
      expect(isInCart).toBeTruthy();

      // Verify 2: Quantity is set to 1
      const qty = await cartPage.getProductQuantity();
      expect(qty).toBe(1);
    } finally {
      // Post-condition: Clear cart so this test does not affect later scenarios.
      await cartPage.resetCartState().catch(() => undefined);
    }
  });
});
