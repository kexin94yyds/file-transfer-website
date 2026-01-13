import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ code: generateCode() })
}
