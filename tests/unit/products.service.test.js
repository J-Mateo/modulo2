import { jest } from '@jest/globals';

const findUniqueMock = jest.fn();
const updateMock = jest.fn();
const notifyPendingAlertsMock = jest.fn();

jest.unstable_mockModule(
  '../../src/config/prismaClient.js',
  () => ({
    default: {
      product: {
        findUnique: findUniqueMock,
        update: updateMock,
      },
    },
  })
);

jest.unstable_mockModule(
  '../../src/services/restockAlerts.service.js',
  () => ({
    restockAlertsService: {
      notifyPendingAlerts: notifyPendingAlertsMock,
    },
  })
);

const { productsService } = await import(
  '../../src/services/products.service.js'
);

describe('productsService.updateProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('notifies pending alerts when stock changes from zero to available', async () => {
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 0,
      isActive: true,
    });

    const updatedProduct = {
      id: 1,
      name: 'Test product',
      stock: 5,
      isActive: true,
    };

    updateMock.mockResolvedValue(updatedProduct);

    notifyPendingAlertsMock.mockResolvedValue({
      notified: 1,
      failed: 0,
    });

    const result = await productsService.updateProduct(
      1,
      {
        stock: 5,
      }
    );

    expect(updateMock).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        stock: 5,
      },
    });

    expect(
      notifyPendingAlertsMock
    ).toHaveBeenCalledTimes(1);

    expect(
      notifyPendingAlertsMock
    ).toHaveBeenCalledWith(updatedProduct);

    expect(result).toBe(updatedProduct);

    consoleLogSpy.mockRestore();
  });

  test('does not notify when available stock increases', async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 5,
      isActive: true,
    });

    const updatedProduct = {
      id: 1,
      name: 'Test product',
      stock: 10,
      isActive: true,
    };

    updateMock.mockResolvedValue(updatedProduct);

    const result = await productsService.updateProduct(
      1,
      {
        stock: 10,
      }
    );

    expect(
      notifyPendingAlertsMock
    ).not.toHaveBeenCalled();

    expect(result).toBe(updatedProduct);
  });

  test('does not notify when product remains out of stock', async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 0,
      isActive: true,
    });

    const updatedProduct = {
      id: 1,
      name: 'Test product',
      stock: 0,
      isActive: true,
    };

    updateMock.mockResolvedValue(updatedProduct);

    const result = await productsService.updateProduct(
      1,
      {
        stock: 0,
      }
    );

    expect(
      notifyPendingAlertsMock
    ).not.toHaveBeenCalled();

    expect(result).toBe(updatedProduct);
  });

  test('does not notify when restocked product is inactive', async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 0,
      isActive: false,
    });

    const updatedProduct = {
      id: 1,
      name: 'Test product',
      stock: 5,
      isActive: false,
    };

    updateMock.mockResolvedValue(updatedProduct);

    const result = await productsService.updateProduct(
      1,
      {
        stock: 5,
      }
    );

    expect(
      notifyPendingAlertsMock
    ).not.toHaveBeenCalled();

    expect(result).toBe(updatedProduct);
  });

  test('does not notify when stock was not updated', async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 0,
      isActive: true,
    });

    const updatedProduct = {
      id: 1,
      name: 'Updated name',
      stock: 0,
      isActive: true,
    };

    updateMock.mockResolvedValue(updatedProduct);

    const result = await productsService.updateProduct(
      1,
      {
        name: 'Updated name',
      }
    );

    expect(
      notifyPendingAlertsMock
    ).not.toHaveBeenCalled();

    expect(result).toBe(updatedProduct);
  });

  test('keeps product update successful when restock notification fails', async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      stock: 0,
      isActive: true,
    });

    const updatedProduct = {
      id: 1,
      name: 'Test product',
      stock: 5,
      isActive: true,
    };

    updateMock.mockResolvedValue(updatedProduct);

    notifyPendingAlertsMock.mockRejectedValue(
      new Error('Email notification failed')
    );

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await productsService.updateProduct(
      1,
      {
        stock: 5,
      }
    );

    expect(
      notifyPendingAlertsMock
    ).toHaveBeenCalledWith(updatedProduct);

    expect(result).toBe(updatedProduct);

    consoleErrorSpy.mockRestore();
  });

  test('returns null when product does not exist', async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await productsService.updateProduct(
      999999,
      {
        stock: 5,
      }
    );

    expect(result).toBeNull();

    expect(updateMock).not.toHaveBeenCalled();

    expect(
      notifyPendingAlertsMock
    ).not.toHaveBeenCalled();
  });
});