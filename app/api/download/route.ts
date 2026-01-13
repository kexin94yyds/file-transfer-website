import { type NextRequest, NextResponse } from "next/server"

import { list } from "@vercel/blob"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.toUpperCase()

  if (!code) {
    return NextResponse.json({ error: "请输入房间号" }, { status: 400 })
  }

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: "房间号格式不正确" }, { status: 400 })
  }

  const prefix = `transfer/rooms/${code}/`
  const now = Date.now()

  try {
    const result = await list({ prefix })
    const validFiles = result.blobs
      .map((b) => {
        const namePart = b.pathname.slice(prefix.length)
        const [, ...rest] = namePart.split("__")
        const name = rest.join("__") || namePart
        return { uploadedAt: b.uploadedAt.getTime(), name, url: b.url, downloadUrl: b.downloadUrl }
      })
      .filter((f) => now - f.uploadedAt <= 10 * 60 * 1000)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)

    if (validFiles.length === 0) {
      return NextResponse.json({ error: "房间号不存在或已过期" }, { status: 404 })
    }

    return NextResponse.json({ files: validFiles.map(({ name, url, downloadUrl }) => ({ name, url, downloadUrl })) })
  } catch (error) {
    console.error("Download list error:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
