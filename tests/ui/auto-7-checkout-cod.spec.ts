/**
 * Auto-7: Verify shopper can complete checkout using valid shipping info and COD payment.
 * Pre-conditions: Shopper logged in; Target product is added to cart
 * Test Data: shipping info valid; payment: COD
 * Expected: Payment succeeds; confirmation page is displayed; order reflects paid/success and COD method;
 *           order history shows corresponding order row with order id, payment date, confirmed status, item summary, total, and COD method
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { products } from '../../test-data/products';
import { shippingInfo } from '../../test-data/checkout';

test.describe('Auto-7: Checkout COD', () => {
  test('Verify shopper can complete checkout using valid shipping info and COD payment', async ({
    loginPage,
    productListPage,
    cartPage,
    checkoutPage,
    orderHistoryPage,
    shopperUser,
  }) => {
    // Pre-condition: Login and add product to cart
    await loginPage.login(shopperUser.username, shopperUser.password);
    await cartPage.resetCartState();
    await productListPage.navigateTo();
    await productListPage.addProductToCart(products.sku1001.name);

    // Ensure cart has at least one item before opening checkout.
    await cartPage.navigateTo();
    let cartQty = await cartPage.getTotalQuantityFromHeader();
    if (cartQty === 0) {
      await productListPage.navigateTo();
      await productListPage.addFirstInStockProductToCart();
      await cartPage.navigateTo();
      cartQty = await cartPage.getTotalQuantityFromHeader();
    }
    expect(cartQty).toBeGreaterThan(0);

    // Step 1: Open checkout page
    await cartPage.clickCheckout();

    // Step 2: Enter valid shipping information
    const info = shippingInfo.valid;
    await checkoutPage.fillShippingInfo(info.fullName, info.phone, info.address, info.city);

    // Step 3: Select COD payment
    await checkoutPage.selectCodPayment();

    // Step 4: Click Place Order
    await checkoutPage.clickPlaceOrder();

    // Verify 1: Payment succeeds
    const isOrderConfirmed = await checkoutPage.isOrderConfirmed();
    expect(isOrderConfirmed).toBeTruthy();

    // Verify 2: Order confirmation page is displayed
    const isConfirmationDisplayed = await checkoutPage.isOrderConfirmationPageDisplayed();
    expect(isConfirmationDisplayed).toBeTruthy();

    // Verify 3: Order status reflects paid/success state and COD payment method
    const hasPaidOrSuccessState = await checkoutPage.isOrderPaidOrSuccessStateVisible();
    expect(hasPaidOrSuccessState).toBeTruthy();
    const hasCodMethod = await checkoutPage.isCodPaymentMethodVisible();
    expect(hasCodMethod).toBeTruthy();

    // Capture exact order/payment information from checkout confirmation for strict verification in order history.
    const confirmedOrderInfo = await checkoutPage.getConfirmedOrderIdAndPaymentDate();
    expect(confirmedOrderInfo).toBeTruthy();
    const confirmedPaymentInfo = await checkoutPage.getConfirmedSummaryTotalAndPaymentMethod();
    expect(confirmedPaymentInfo).toBeTruthy();

    // Step 5: Open order history page
    const openedOrderHistory = await orderHistoryPage.openOrderHistoryPage();
    expect(openedOrderHistory).toBeTruthy();

    // Verify 4: Order history page returns
    const isOrderHistoryVisible = await orderHistoryPage.isOrderHistoryPageVisible();
    expect(isOrderHistoryVisible).toBeTruthy();

    // Step 6: Inspect the corresponding order row data
    const isTargetOrderVisible = await orderHistoryPage.isOrderRowVisibleByOrderId(confirmedOrderInfo!.orderId);
    expect(isTargetOrderVisible).toBeTruthy();

    // Verify 5: Corresponding order ID and payment date displays exactly as checkout confirmation
    const hasExactOrderIdAndDate = await orderHistoryPage.doesOrderMatchIdAndDateByOrderId(
      confirmedOrderInfo!.orderId,
      confirmedOrderInfo!.paymentDate,
    );
    expect(hasExactOrderIdAndDate).toBeTruthy();

    // Verify 6: Corresponding Order status displays as Confirmed
    const isTargetOrderConfirmed = await orderHistoryPage.isOrderConfirmedByOrderId(confirmedOrderInfo!.orderId);
    expect(isTargetOrderConfirmed).toBeTruthy();

    // Verify 7: Item summary and total are shown along with payment method
    const hasExactSummaryTotalAndPaymentMethod = await orderHistoryPage.doesOrderMatchSummaryTotalAndPaymentMethodByOrderId(
      confirmedOrderInfo!.orderId,
      confirmedPaymentInfo!.summaryTotal,
      confirmedPaymentInfo!.paymentMethod,
    );
    expect(hasExactSummaryTotalAndPaymentMethod).toBeTruthy();
  });
});
