import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  const location = await db.savedLocation.findUnique({ where: { id } });
  if (!location || location.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "未找到或无权删除" }, { status: 404 });
  }

  await db.savedLocation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
