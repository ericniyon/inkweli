import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

const defaultSettings = {
  showLogoInHeader: true,
  stickyHeader: true,
  showHero: true,
  showTrending: true,
  showFooter: true,
};

export async function GET() {
  try {
    if (!prisma.siteLayoutSettings) {
      return NextResponse.json(defaultSettings);
    }
    let settings = await prisma.siteLayoutSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (!settings) {
      settings = await prisma.siteLayoutSettings.create({
        data: {
          id: DEFAULT_ID,
          showLogoInHeader: true,
          stickyHeader: true,
          showHero: true,
          showTrending: true,
          showFooter: true,
        },
      });
    }
    return NextResponse.json({
      showLogoInHeader: settings.showLogoInHeader,
      stickyHeader: settings.stickyHeader,
      showHero: settings.showHero,
      showTrending: settings.showTrending,
      showFooter: settings.showFooter,
    });
  } catch (e) {
    console.error("GET /api/site-settings", e);
    return NextResponse.json(defaultSettings, { status: 200 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!prisma.siteLayoutSettings) {
      return NextResponse.json(defaultSettings);
    }
    const body = await request.json();
    const {
      showLogoInHeader,
      stickyHeader,
      showHero,
      showTrending,
      showFooter,
    } = body;

    const settings = await prisma.siteLayoutSettings.upsert({
      where: { id: DEFAULT_ID },
      create: {
        id: DEFAULT_ID,
        showLogoInHeader: showLogoInHeader ?? true,
        stickyHeader: stickyHeader ?? true,
        showHero: showHero ?? true,
        showTrending: showTrending ?? true,
        showFooter: showFooter ?? true,
      },
      update: {
        ...(typeof showLogoInHeader === "boolean" && { showLogoInHeader }),
        ...(typeof stickyHeader === "boolean" && { stickyHeader }),
        ...(typeof showHero === "boolean" && { showHero }),
        ...(typeof showTrending === "boolean" && { showTrending }),
        ...(typeof showFooter === "boolean" && { showFooter }),
      },
    });

    return NextResponse.json({
      showLogoInHeader: settings.showLogoInHeader,
      stickyHeader: settings.stickyHeader,
      showHero: settings.showHero,
      showTrending: settings.showTrending,
      showFooter: settings.showFooter,
    });
  } catch (e) {
    console.error("PATCH /api/site-settings", e);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  }
}
