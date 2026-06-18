test('adds a product to wishlist', () => {
  const wishlist = {
    productIds: ['1', '2'],
  };

  const productId = '3';

  if (!wishlist.productIds.includes(productId)) {
    wishlist.productIds.push(productId);
  }

  expect(wishlist.productIds).toContain('3');
});

test('removes a product from wishlist', () => {
  const wishlist = {
    productIds: ['1', '2', '3'],
  };

  const productId = '3';

  wishlist.productIds = wishlist.productIds.filter(
    (id) => id !== productId
  );

  expect(wishlist.productIds).not.toContain('3');
});