import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

const SETTINGS_ID = 1;

async function getOrCreateSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: SETTINGS_ID, defaultIndividualPrice: 200, defaultGroupPrice: 50 },
    });
  }
  return settings;
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await getOrCreateSettings();
  const settings = await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      defaultIndividualPrice: body.defaultIndividualPrice,
      defaultGroupPrice: body.defaultGroupPrice,
    },
  });
  return NextResponse.json(settings);
}
