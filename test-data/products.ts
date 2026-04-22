// This test data defined for test cases related check out product
export const products = {
  sku1001: {
    name: 'SKU_1001',
    price: 900000,
    stock: 2,
    tag: 'Hot',
  },
};

// This test data defined for test case admin add new product to product list
export type ProductData = {
  name: string;
  price: number;
  stock: number;
  tag: string;
};

export function createRandomProduct(baseProduct: ProductData): ProductData {
  const timestamp = Date.now();

  return {
    ...baseProduct,
    name: `${baseProduct.name}_${timestamp}`,
  };
}
