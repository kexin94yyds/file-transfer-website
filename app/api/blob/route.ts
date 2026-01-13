import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const code = (clientPayload ?? "").toUpperCase()

        if (!/^[A-Z0-9]{6}$/.test(code)) {
          throw new Error("Invalid room code")
        }

        const prefix = `transfer/rooms/${code}/`
        if (!pathname.startsWith(prefix)) {
          throw new Error("Invalid upload pathname")
        }

        return {
          maximumSizeInBytes: 50 * 1024 * 1024 * 1024,
          addRandomSuffix: false,
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Blob handleUpload error:", error)
    return NextResponse.json({ error: "上传初始化失败" }, { status: 400 })
  }
}
