import { Prisma } from '@prisma/client';

const isPrismaDecimal = (value) =>
  Prisma.Decimal.isDecimal(value);

export const serializeApiData = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (isPrismaDecimal(value)) {
    return value.toFixed(2);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeApiData);
  }

  if (
    typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, nestedValue]) => [
          key,
          serializeApiData(nestedValue),
        ]
      )
    );
  }

  return value;
};