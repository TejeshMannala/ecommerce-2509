export const unwrapData = (response) => response?.data ?? response;

export const toApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

export const normalizeOrderCreatePayload = (orderData = {}) => {
  const items = Array.isArray(orderData.items)
    ? orderData.items.map((item) => ({
        productId: item.productId || item.id,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        name: item.name,
        image: item.image,
      }))
    : [];

  return {
    items,
    shippingInfo: orderData.shippingInfo || {},
    payment: orderData.payment || {},
    total: Number(orderData.total) || 0,
    status: orderData.status || 'processing',
  };
};
