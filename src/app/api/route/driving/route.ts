import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const key = process.env.AMAP_WEB_KEY!;
  const url = `https://restapi.amap.com/v3/direction/driving?origin=${origin}&destination=${destination}&key=${key}&extensions=all`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Driving API response:", data.status, data.info);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Driving API error:", err);
    return NextResponse.json({ error: "请求失败" }, { status: 500 });
  }
}
