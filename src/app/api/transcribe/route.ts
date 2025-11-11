import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import OpenAI from 'openai'

export const runtime = 'nodejs'

/**
 * POST /api/transcribe
 * Transcribes audio/video using OpenAI Whisper API
 * 
 * Request body:
 * {
 *   url: string;          // Media URL (e.g., /api/uploads/file/video.mp4)
 *   targetLanguage?: string;  // Language code (e.g., 'en', 'es')
 * }
 * 
 * Response:
 * {
 *   transcribe: {
 *     url: string;  // Data URL containing the transcription JSON
 *   }
 * }
 */
export async function POST(request: NextRequest) {
	try {
		// 1. Parse request body
		const body = await request.json()
		const { url: mediaUrl, targetLanguage } = body

		if (!mediaUrl) {
			return NextResponse.json(
				{ error: 'Media URL is required' },
				{ status: 400 }
			)
		}

		// 2. Initialize OpenAI client with Bearer authentication
		const apiKey = process.env.OPENAI_API_KEY
		if (!apiKey) {
			console.error('OPENAI_API_KEY is not configured')
			return NextResponse.json(
				{ error: 'OpenAI API key is not configured' },
				{ status: 500 }
			)
		}

		const openai = new OpenAI({
			apiKey: apiKey, // Bearer authentication is handled automatically by the SDK
		})

		// 3. Extract filename from URL and read the file
		// URL format: /api/uploads/file/filename.mp4
		const urlParts = mediaUrl.split('/')
		const filename = decodeURIComponent(urlParts[urlParts.length - 1])
		const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
		const filePath = path.join(process.cwd(), '_uploads', safeFilename)

		// Check if file exists
		try {
			await fs.access(filePath)
		} catch {
			return NextResponse.json(
				{ error: 'Media file not found' },
				{ status: 404 }
			)
		}

		// 4. Read file as buffer and create a File-like object for OpenAI
		const fileBuffer = await fs.readFile(filePath)
		
		// Determine MIME type based on file extension
		const ext = path.extname(safeFilename).toLowerCase()
		const mimeType = 
			ext === '.mp4' ? 'video/mp4' :
			ext === '.mov' ? 'video/quicktime' :
			ext === '.webm' ? 'video/webm' :
			ext === '.mp3' ? 'audio/mpeg' :
			ext === '.wav' ? 'audio/wav' :
			ext === '.m4a' ? 'audio/mp4' :
			'audio/mpeg'

		// Create a File-like object (convert Buffer to Uint8Array)
		const file = new File([new Uint8Array(fileBuffer)], safeFilename, { type: mimeType })

		// 5. Transcribe using OpenAI Whisper API
		console.log(`Starting transcription for file: ${safeFilename}`)
		
		const transcriptionParams: any = {
			file: file,
			model: 'whisper-1',
			response_format: 'verbose_json',
			timestamp_granularities: ['word', 'segment'],
		}

		// Add language if specified
		if (targetLanguage) {
			transcriptionParams.language = targetLanguage.toLowerCase()
		}

		const transcription: any = await openai.audio.transcriptions.create(transcriptionParams)

		console.log(`Transcription completed. Text length: ${transcription.text?.length || 0}`)

		// 6. Transform OpenAI response to expected format
		// OpenAI verbose_json returns: { text, words: [{ word, start, end }], segments: [...], duration, language }
		// We need: { sourceUrl, results: { main: { words: [{ word, start, end, confidence }] } } }
		
		const transformedData = {
			sourceUrl: mediaUrl,
			results: {
				main: {
					words: (transcription.words || []).map((w: any) => ({
						word: w.word,
						start: w.start,
						end: w.end,
						confidence: 1.0, // OpenAI doesn't provide confidence, default to 1.0
					})),
				},
			},
			// Include original data for reference
			original: {
				text: transcription.text,
				duration: transcription.duration,
				language: transcription.language,
				segments: transcription.segments,
			},
		}

		// 7. Convert to data URL (inline JSON)
		// This allows the frontend to fetch it directly without another API call
		const jsonString = JSON.stringify(transformedData)
		const dataUrl = `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`

		// 8. Return response in expected format
		return NextResponse.json({
			success: true,
			transcribe: {
				url: dataUrl,
			},
		})

	} catch (error) {
		console.error('Error in transcribe route:', error)
		
		// Handle OpenAI-specific errors
		if (error instanceof OpenAI.APIError) {
			return NextResponse.json(
				{
					error: 'OpenAI API error',
					message: error.message,
					status: error.status,
					code: error.code,
				},
				{ status: error.status || 500 }
			)
		}

		// Handle general errors
		return NextResponse.json(
			{
				error: 'Failed to transcribe media',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		)
	}
}
