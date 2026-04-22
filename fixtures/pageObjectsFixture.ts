import { test as base } from '@playwright/test';
import { LoginPage } from '../pageobjects/login-page';
import { DashboardPage } from '../pageobjects/dashboard-page';
import { ManageProductsPage } from '../pageobjects/manage-products-page';
import { ProductListPage } from '../pageobjects/product-list-page';
import { CartPage } from '../pageobjects/cart-page';
import { CheckoutPage } from '../pageobjects/checkout-page';
import { OrderHistoryPage } from '../pageobjects/order-history-page';
import { users } from '../test-data/users';

declare const process: {
  env: Record<string, string | undefined>;
};

type Credentials = {
  username: string;
  password: string;
};

type PageObjects = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  manageProductsPage: ManageProductsPage;
  productListPage: ProductListPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderHistoryPage: OrderHistoryPage;
  shopperUser: Credentials;
};

const resolveShopperPool = (): Credentials[] => {
  const envPoolRaw = process.env.SHOPPER_USERS_JSON;
  if (envPoolRaw) {
    try {
      const parsed = JSON.parse(envPoolRaw) as Credentials[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall back to static pool from test data when env format is invalid.
    }
  }

  if (Array.isArray(users.shopperPool) && users.shopperPool.length > 0) {
    return users.shopperPool;
  }

  return [users.shopper];
};

export const test = base.extend<PageObjects>({
  shopperUser: async ({}, use, testInfo) => {
    const pool = resolveShopperPool();
    const selected = pool[testInfo.workerIndex % pool.length];
    await use(selected);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  manageProductsPage: async ({ page }, use) => {
    const manageProductsPage = new ManageProductsPage(page);
    await use(manageProductsPage);
  },
  productListPage: async ({ page }, use) => {
    const productListPage = new ProductListPage(page);
    await use(productListPage);
  },
  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },
  orderHistoryPage: async ({ page }, use) => {
    const orderHistoryPage = new OrderHistoryPage(page);
    await use(orderHistoryPage);
  },
});

export { expect } from '@playwright/test';
