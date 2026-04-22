/**
 * Auto-8: Verify shopper can complete checkout using valid card payment flow.
 * Pre-conditions: Shopper logged in; Target product is added to cart
 * Test Data: card: 4242 4242 4242 4242; exp/cvc valid
 * Expected: Payment succeeds; confirmation page is displayed; order reflects paid/success and card method;
 *           order history shows corresponding order row with order id, payment date, confirmed status, item summary, total, and card method
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/pageObjectsFixture';
import { products } from '../../test-data/products';
import { shippingInfo, cardDetails } from '../../test-data/checkout';

test.describe('Auto-8: Checkout Card Payment', () => {
  test('Verify shopper can complete checkout using valid card payment flow', async ({
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

    // Step 3: Select Card Stripe payment
    await checkoutPage.selectCardPayment();

    // Step 4: Enter valid card details
    const card = cardDetails.valid;
    await checkoutPage.fillCardDetails(card.cardNumber, card.expiry, card.cvc);

    // Step 5: Confirm payment (submit form to trigger validation)
    await checkoutPage.clickPlaceOrder();

    // Verify 1: Payment succeeds
    const isOrderConfirmed = await checkoutPage.isOrderConfirmed();
    expect(isOrderConfirmed).toBeTruthy();

    // Verify 2: Order confirmation page is displayed
    const isConfirmationDisplayed = await checkoutPage.isOrderConfirmationPageDisplayed();
    expect(isConfirmationDisplayed).toBeTruthy();

    // Verify 3: Order status reflects paid/success and card payment method
    const hasPaidOrSuccessState = await checkoutPage.isOrderPaidOrSuccessStateVisible();
    expect(hasPaidOrSuccessState).toBeTruthy();
    const hasCardPaymentMethod = await checkoutPage.isCardPaymentMethodVisible();
    expect(hasCardPaymentMethod).toBeTruthy();

    // Capture exact order information from checkout confirmation for strict verification in order history.
    const confirmedOrderInfo = await checkoutPage.getConfirmedOrderIdAndPaymentDate();
    expect(confirmedOrderInfo).toBeTruthy();
    const confirmedPaymentInfo = await checkoutPage.getConfirmedSummaryTotalAndCardMethod();
    expect(confirmedPaymentInfo).toBeTruthy();

    // Step 6: Open order history page
    const openedOrderHistory = await orderHistoryPage.openOrderHistoryPage();
    expect(openedOrderHistory).toBeTruthy();

    // Verify 4: Order history page returns
    const isOrderHistoryVisible = await orderHistoryPage.isOrderHistoryPageVisible();
    expect(isOrderHistoryVisible).toBeTruthy();

    // Step 7: Inspect the corresponding order row data
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
    const hasExactSummaryTotalAndCardMethod = await orderHistoryPage.doesOrderMatchSummaryTotalAndPaymentMethodByOrderId(
      confirmedOrderInfo!.orderId,
      confirmedPaymentInfo!.summaryTotal,
      confirmedPaymentInfo!.cardMethod,
    );
    expect(hasExactSummaryTotalAndCardMethod).toBeTruthy();
  });
});
