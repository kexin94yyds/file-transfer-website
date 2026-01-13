import { type NextRequest, NextResponse } from "next/server"
import { roomStorage } from "../upload/route"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.toUpperCase()

  if (!code) {
    return NextResponse.json({ error: "请输入房间号" }, { status: 400 })
  }

  const data = roomStorage.get(code)

  if (!data) {
    return NextResponse.json({ error: "房间号不存在或已过期" }, { status: 404 })
  }

  if (data.expires < Date.now()) {
    roomStorage.delete(code)
    return NextResponse.json({ error: "文件已过期" }, { status: 404 })
  }

  return NextResponse.json({ files: data.files })
}
