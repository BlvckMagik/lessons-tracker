import { prisma } from './prisma';

const SETTINGS_ID = 1;

export async function getDefaultPrices() {
  let settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: SETTINGS_ID, defaultIndividualPrice: 200, defaultGroupPrice: 50 },
    });
  }
  return settings;
}

export async function resolveStudentPrice(
  studentId: number,
  lessonType: string,
): Promise<number> {
  const [student, defaults] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { individualPrice: true, groupPrice: true } }),
    getDefaultPrices(),
  ]);

  if (lessonType === 'INDIVIDUAL') {
    return student?.individualPrice ?? defaults.defaultIndividualPrice;
  }
  return student?.groupPrice ?? defaults.defaultGroupPrice;
}

export async function resolveStudentPrices(
  studentIds: number[],
  lessonType: string,
): Promise<Map<number, number>> {
  const [students, defaults] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, individualPrice: true, groupPrice: true },
    }),
    getDefaultPrices(),
  ]);

  const priceMap = new Map<number, number>();
  const isIndividual = lessonType === 'INDIVIDUAL';

  for (const sid of studentIds) {
    const student = students.find((s) => s.id === sid);
    const price = isIndividual
      ? (student?.individualPrice ?? defaults.defaultIndividualPrice)
      : (student?.groupPrice ?? defaults.defaultGroupPrice);
    priceMap.set(sid, price);
  }

  return priceMap;
}
