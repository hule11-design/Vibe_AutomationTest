/**
 * Auto-4: Verify admin can create a product with valid mandatory information.
 * Pre-conditions: Admin (Admin_DemoNotDelete/11111111) logged in with valid token; Admin is on Manage Products page
 * Test Data: base product from products.ts with timestamp-based random name; price: 900000; stock: 2; Tag: Hot
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { users } from '../../test-data/users';
import { createRandomProduct, products } from '../../test-data/products';

test.describe('Auto-4: Create Product', () => {
  test('Verify admin can create a product with valid mandatory information', async ({
    loginPage,
    manageProductsPage,
  }) => {
    // Use a unique product name so the test can run repeatedly without colliding with existing data.
    const productData = createRandomProduct({
      ...products.sku1001,
      name: 'Auto-4',
    });

    // Pre-condition: Login as admin
    await loginPage.login(users.admin.username, users.admin.password);

    // Step 1: Open Manage Products page
    await manageProductsPage.navigateTo();

    // Step 2: Click 'Add Product'
    await manageProductsPage.clickAddProduct();

    // Step 3: Enter valid required fields (name, price, stock, tag)
    await manageProductsPage.fillProductName(productData.name);
    await manageProductsPage.fillProductPrice(productData.price);
    await manageProductsPage.fillProductStock(productData.stock);
    await manageProductsPage.fillProductTag(productData.tag);

    // Step 4: Save product
    await manageProductsPage.clickSave();

    // Verify 1: Success - navigated away from the add form (product was saved)
    const isSuccess = await manageProductsPage.isSuccessfulSave();
    expect(isSuccess).toBeTruthy();

    // Verify 2: New product appears in product list
    const isProductInList = await manageProductsPage.isProductInList(productData.name);
    expect(isProductInList).toBeTruthy();
  });
});
