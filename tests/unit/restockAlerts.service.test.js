import { jest } from '@jest/globals';

const findManyMock = jest.fn();
const updateMock = jest.fn();
const sendRestockEmailMock = jest.fn();

jest.unstable_mockModule(
  '../../src/config/prismaClient.js',
  () => ({
    default: {
      restockAlert: {
        findMany: findManyMock,
        update: updateMock,
      },
    },
  })
);

jest.unstable_mockModule(
  '../../src/services/email.service.js',
  () => ({
    emailService: {
      sendRestockEmail:
        sendRestockEmailMock,
    },
  })
);

const { restockAlertsService } =
  await import(
    '../../src/services/restockAlerts.service.js'
  );

describe('restockAlertsService.notifyPendingAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does nothing when product is not available', async () => {
    const result =
      await restockAlertsService.notifyPendingAlerts({
        id: 1,
        name: 'Test product',
        stock: 0,
      });

    expect(result).toEqual({
      notified: 0,
      failed: 0,
    });

    expect(findManyMock).not.toHaveBeenCalled();
    expect(
      sendRestockEmailMock
    ).not.toHaveBeenCalled();
  });

  test('returns zero counts when there are no pending alerts', async () => {
    findManyMock.mockResolvedValue([]);

    const result =
      await restockAlertsService.notifyPendingAlerts({
        id: 1,
        name: 'Test product',
        stock: 5,
      });

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        productId: 1,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    expect(result).toEqual({
      notified: 0,
      failed: 0,
    });

    expect(
      sendRestockEmailMock
    ).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  test('marks alert as notified after successful email', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 10,
        user: {
          id: 5,
          name: 'Jessica',
          email: 'jessica@example.com',
        },
      },
    ]);

    sendRestockEmailMock.mockResolvedValue({
      id: 'email_123',
    });

    updateMock.mockResolvedValue({
      id: 10,
      status: 'NOTIFIED',
    });

    const product = {
      id: 1,
      name: 'Test product',
      stock: 5,
    };

    const result =
      await restockAlertsService.notifyPendingAlerts(
        product
      );

    expect(
      sendRestockEmailMock
    ).toHaveBeenCalledWith({
      to: 'jessica@example.com',
      userName: 'Jessica',
      product,
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        status: 'NOTIFIED',
        notifiedAt: expect.any(Date),
        cancelledAt: null,
      },
    });

    expect(result).toEqual({
      notified: 1,
      failed: 0,
    });
  });

  test('keeps alert pending when email fails', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 10,
        user: {
          id: 5,
          name: 'Jessica',
          email: 'jessica@example.com',
        },
      },
    ]);

    sendRestockEmailMock.mockRejectedValue(
      new Error('Email provider unavailable')
    );

    const consoleErrorSpy =
      jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

    const result =
      await restockAlertsService.notifyPendingAlerts({
        id: 1,
        name: 'Test product',
        stock: 5,
      });

    expect(updateMock).not.toHaveBeenCalled();

    expect(result).toEqual({
      notified: 0,
      failed: 1,
    });

    consoleErrorSpy.mockRestore();
  });

  test('continues processing alerts when one email fails', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 10,
        user: {
          id: 5,
          name: 'Jessica',
          email: 'jessica@example.com',
        },
      },
      {
        id: 11,
        user: {
          id: 6,
          name: 'Alex',
          email: 'alex@example.com',
        },
      },
    ]);

    sendRestockEmailMock
      .mockRejectedValueOnce(
        new Error('Temporary failure')
      )
      .mockResolvedValueOnce({
        id: 'email_456',
      });

    updateMock.mockResolvedValue({
      id: 11,
      status: 'NOTIFIED',
    });

    const consoleErrorSpy =
      jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

    const result =
      await restockAlertsService.notifyPendingAlerts({
        id: 1,
        name: 'Test product',
        stock: 5,
      });

    expect(
      sendRestockEmailMock
    ).toHaveBeenCalledTimes(2);

    expect(updateMock).toHaveBeenCalledTimes(1);

    expect(updateMock).toHaveBeenCalledWith({
      where: {
        id: 11,
      },
      data: {
        status: 'NOTIFIED',
        notifiedAt: expect.any(Date),
        cancelledAt: null,
      },
    });

    expect(result).toEqual({
      notified: 1,
      failed: 1,
    });

    consoleErrorSpy.mockRestore();
  });
});