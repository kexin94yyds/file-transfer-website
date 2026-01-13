"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { Upload, Download, Copy, Check, Smartphone, Monitor, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [roomCode, setRoomCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloadFiles, setDownloadFiles] = useState<{ name: string; url: string }[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setError("")

    try {
      const roomRes = await fetch("/api/room", { method: "POST" })
      const roomData = await roomRes.json()

      if (!roomRes.ok || !roomData.code) {
        throw new Error("Failed to create room")
      }

      const code = String(roomData.code).toUpperCase()

      await Promise.all(
        files.map(async (file) => {
          const safeName = file.name.replace(/\//g, "_")
          const pathname = `transfer/rooms/${code}/${Date.now()}__${safeName}`

          await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/blob",
            clientPayload: code,
            multipart: true,
          })
        }),
      )

      setRoomCode(code)
      setFiles([])
    } catch {
      setError("上传失败，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setError("")

    try {
      const res = await fetch(`/api/download?code=${joinCode.toUpperCase()}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setDownloadFiles(data.files)
      }
    } catch {
      setError("获取失败，请检查房间号")
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">跨设备文件传输</h1>
          <p className="text-muted-foreground">Windows、Mac、手机之间快速传文件，无需登录</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-muted-foreground">
            <Monitor className="w-5 h-5" />
            <span className="text-xs">⟷</span>
            <Laptop className="w-5 h-5" />
            <span className="text-xs">⟷</span>
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-2">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                发送文件
              </h2>

              {!roomCode ? (
                <>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">拖拽文件到这里，或</p>
                    <label>
                      <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                      <span className="text-primary cursor-pointer hover:underline">点击选择文件</span>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm"
                        >
                          <span className="truncate flex-1">{file.name}</span>
                          <button
                            onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-destructive ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <Button onClick={handleUpload} disabled={uploading} className="w-full mt-3">
                        {uploading ? "上传中..." : `上传 ${files.length} 个文件`}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">在其他设备输入此房间号</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-mono font-bold tracking-widest text-primary">{roomCode}</span>
                    <Button variant="ghost" size="icon" onClick={copyCode}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">文件将在 10 分钟后自动删除</p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setRoomCode("")}>
                    发送新文件
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="border-2">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                接收文件
              </h2>

              {downloadFiles.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">输入发送方的房间号</p>
                  <Input
                    placeholder="输入房间号"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                  <Button onClick={handleJoin} className="w-full">
                    获取文件
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">找到 {downloadFiles.length} 个文件</p>
                  {downloadFiles.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      download={file.name}
                      className="flex items-center justify-between bg-muted/50 rounded px-3 py-3 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="truncate flex-1">{file.name}</span>
                      <Download className="w-4 h-4 text-primary ml-2" />
                    </a>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2 bg-transparent"
                    onClick={() => {
                      setDownloadFiles([])
                      setJoinCode("")
                    }}
                  >
                    接收其他文件
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {error && <p className="text-center text-destructive mt-4 text-sm">{error}</p>}

        {/* Usage Tips */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>使用方法：</p>
          <p className="mt-1">1. 在发送设备上传文件 → 2. 获取房间号 → 3. 在接收设备输入房间号下载</p>
        </div>
      </div>
    </main>
  )
}
