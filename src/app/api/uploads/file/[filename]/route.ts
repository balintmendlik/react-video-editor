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
		
		// Get file stats to determine file size
		const stats = await fs.stat(filePath)
		const fileSize = stats.size

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

		// Check if the request includes a Range header
		const range = request.headers.get("range")
		
		if (range) {
			// Parse the range header (e.g., "bytes=0-1023")
			const parts = range.replace(/bytes=/, "").split("-")
			const start = parseInt(parts[0], 10)
			const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
			
			if (start >= fileSize || end >= fileSize) {
				return new NextResponse(null, {
					status: 416,
					headers: {
						"Content-Range": `bytes */${fileSize}`
					}
				})
			}

			const chunkSize = (end - start) + 1
			
			// Read only the requested range
			const buffer = Buffer.alloc(chunkSize)
			const fileHandle = await fs.open(filePath, "r")
			await fileHandle.read(buffer, 0, chunkSize, start)
			await fileHandle.close()

			return new NextResponse(buffer, {
				status: 206,
				headers: {
					"Content-Type": type,
					"Content-Range": `bytes ${start}-${end}/${fileSize}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunkSize.toString(),
					"Cache-Control": "public, max-age=31536000, immutable"
				}
			})
		}

		// No range requested, return the entire file
		const data = await fs.readFile(filePath)
		
		return new NextResponse(data, {
			headers: {
				"Content-Type": type,
				"Accept-Ranges": "bytes",
				"Content-Length": fileSize.toString(),
				"Cache-Control": "public, max-age=31536000, immutable"
			}
		})
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : String(err) },
			{ status: 404 }
		)
	}
}


