import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

export async function GET (
	request: NextRequest,
	{ params }: { params: { filename: string } }
) {
	try {
		const { filename } = params
		const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
		const filePath = path.join(process.cwd(), "_uploads", safe)
		const data = await fs.readFile(filePath)

		// Basic content-type inference by extension
		const ext = path.extname(safe).toLowerCase()
		const type =
			ext === ".mp4"
				? "video/mp4"
			: ext === ".mov"
				? "video/quicktime"
			: ext === ".webm"
				? "video/webm"
			: ext === ".mp3"
				? "audio/mpeg"
			: ext === ".wav"
				? "audio/wav"
			: ext === ".png"
				? "image/png"
			: ext === ".jpg" || ext === ".jpeg"
				? "image/jpeg"
			: "application/octet-stream"

		return new NextResponse(data, {
			headers: {
				"Content-Type": type,
				"Cache-Control": "no-store"
			}
		})
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : String(err) },
			{ status: 404 }
		)
	}
}


