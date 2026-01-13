import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const roomStorage = new Map<string, { files: { name: string; url: string }[]; expires: number }>()

// 生成6位随机房间号
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// 清理过期房间
function cleanExpired() {
  const now = Date.now()
  for (const [code, data] of roomStorage.entries()) {
    if (data.expires < now) {
      roomStorage.delete(code)
    }
  }
}

export { roomStorage }

export async function POST(request: NextRequest) {
  try {
    cleanExpired()

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 })
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const blob = await put(`transfer/${Date.now()}-${file.name}`, file, {
          access: "public",
        })
        return {
          name: file.name,
          url: blob.url,
        }
      }),
    )

    // 生成唯一房间号
    let code = generateCode()
    while (roomStorage.has(code)) {
      code = generateCode()
    }

    // 存储房间信息，10分钟后过期
    roomStorage.set(code, {
      files: uploadedFiles,
      expires: Date.now() + 10 * 60 * 1000,
    })

    return NextResponse.json({ code })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
