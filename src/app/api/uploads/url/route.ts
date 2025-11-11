import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

interface UploadUrlRequest {
  userId: string;
  urls: string[];
}

function toSafeFilename (name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureUploadsDir () {
  const uploadsDir = path.join(process.cwd(), "_uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadUrlRequest = await request.json();
    const { userId, urls } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Download each URL and save to _uploads
    const uploadsDir = await ensureUploadsDir();
    const results: Array<{
      fileName: string;
      originalFileName: string;
      filePath: string;
      contentType: string;
      originalUrl: string;
      folder?: string;
      url: string;
    }> = [];

    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "application/octet-stream";
        const urlObj = new URL(u);
        const origNameFromUrl = path.basename(urlObj.pathname) || "download.bin";
        const safeName = toSafeFilename(origNameFromUrl);
        const ext = path.extname(safeName);
        const base = path.basename(safeName, ext);
        const unique = `${base}-${Date.now()}${Math.random().toString(36).slice(2, 8)}${ext}`;
        const filePath = path.join(uploadsDir, unique);
        const arrayBuffer = await res.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));
        results.push({
          fileName: unique,
          originalFileName: origNameFromUrl,
          filePath,
          contentType,
          originalUrl: u,
          folder: "_uploads",
          url: `/api/uploads/file/${encodeURIComponent(unique)}`
        });
      } catch {}
    }

    return NextResponse.json({ success: true, uploads: results });
  } catch (error) {
    console.error("Error in upload URL route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Lightweight proxy for external media when direct access is blocked (e.g., 403/CORS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const u = searchParams.get("u")
    if (!u) {
      return NextResponse.json({ error: "Missing 'u' query param" }, { status: 400 })
    }

    // Forward range header if present
    const range = request.headers.get("range")
    const fetchHeaders: Record<string, string> = {}
    if (range) {
      fetchHeaders["Range"] = range
    }

    const upstream = await fetch(u, { headers: fetchHeaders })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream"
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    }

    // Forward range-related headers from upstream
    const contentRange = upstream.headers.get("content-range")
    if (contentRange) {
      headers["Content-Range"] = contentRange
    }

    const contentLength = upstream.headers.get("content-length")
    if (contentLength) {
      headers["Content-Length"] = contentLength
    }

    return new NextResponse(upstream.body, { 
      status: upstream.status,
      headers 
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
