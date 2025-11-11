import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"

export const runtime = "nodejs"

async function ensureUploadsDir () {
	const uploadsDir = path.join(process.cwd(), "_uploads")
	try {
		await fs.mkdir(uploadsDir, { recursive: true })
	} catch {}
	return uploadsDir
}

function toSafeFilename (name: string) {
	return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function POST (request: NextRequest) {
	try {
		const contentType = request.headers.get("content-type") || ""
		// Support two modes:
		// - multipart/form-data: actual file upload
		// - application/json: metadata echo for existing integrations
		if (contentType.includes("multipart/form-data")) {
			const form = await request.formData()
			const file = form.get("file") as unknown as File | null
			if (!file) {
				return NextResponse.json({ error: "file is required" }, { status: 400 })
			}

			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			const uploadsDir = await ensureUploadsDir()
			const origName = file.name || "upload.bin"
			const safeName = toSafeFilename(origName)
			const ext = path.extname(safeName)
			const base = path.basename(safeName, ext)
			const unique = `${base}-${Date.now()}${Math.random().toString(36).slice(2, 8)}${ext}`
			const filePath = path.join(uploadsDir, unique)
			await fs.writeFile(filePath, buffer)

		const uploadedUrl = `/api/uploads/file/${encodeURIComponent(unique)}`
		const result = {
			fileName: unique,
			originalFileName: origName,
			filePath: filePath,
			contentType: (file as any).type || "application/octet-stream",
			url: uploadedUrl,
			folder: "_uploads"
		}

		return NextResponse.json({ success: true, uploads: [result] })
		}

		// Fallback JSON handler for metadata-only calls
		if (contentType.includes("application/json")) {
			const body = await request.json()
			return NextResponse.json({ success: true, upload: body })
		}

		return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : String(err) },
			{ status: 500 }
		)
	}
}

export async function DELETE (request: NextRequest) {
	try {
		const body = await request.json()
		const { fileName } = body

		if (!fileName) {
			return NextResponse.json({ error: "fileName is required" }, { status: 400 })
		}

		// Sanitize the filename to prevent directory traversal
		const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
		const uploadsDir = path.join(process.cwd(), "_uploads")
		const filePath = path.join(uploadsDir, safeName)

		// Check if file exists and delete it
		try {
			await fs.access(filePath)
			await fs.unlink(filePath)
			return NextResponse.json({ success: true, message: "File deleted successfully" })
		} catch (err) {
			// File doesn't exist or can't be deleted
			return NextResponse.json(
				{ error: "File not found or already deleted" },
				{ status: 404 }
			)
		}
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : String(err) },
			{ status: 500 }
		)
	}
}

