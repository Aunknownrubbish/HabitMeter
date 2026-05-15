import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const locations = await db.savedLocation.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { name, address, lat, lng } = await req.json();
  if (!name || !address || lat == null || lng == null) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const location = await db.savedLocation.create({
    data: {
      userId: (session.user as any).id,
      name,
      address,
      lat,
      lng,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
