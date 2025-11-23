/**
 * Remotion Composition: Video with Captions
 * 
 * This composition renders a video with burned-in captions
 */

import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import type { VideoCompositionProps, TrackItem } from '../types'
import { RenderVideo } from '../components/render-video'
import { RenderCaption } from '../components/render-caption'
import { RenderAudio } from '../components/render-audio'
import { RenderImage } from '../components/render-image'
import { RenderText } from '../components/render-text'

export const VideoWithCaptions: React.FC<VideoCompositionProps> = ({
	trackItems,
	background,
	fps,
}) => {
	const frame = useCurrentFrame()

	// Filter out invalid track items and validate required properties
	const validItems = trackItems.filter((item) => {
		// Basic validation
		if (!item || !item.id || !item.type) {
			console.warn('[VideoWithCaptions] Invalid track item (missing id or type):', JSON.stringify(item))
			return false
		}
		
		// Validate display property
		if (!item.display) {
			console.warn('[VideoWithCaptions] Track item missing display property:', { id: item.id, type: item.type })
			return false
		}
		
		// Validate display.from and display.to
		if (typeof item.display.from !== 'number' || typeof item.display.to !== 'number') {
			console.warn('[VideoWithCaptions] Track item has invalid display values:', {
				id: item.id,
				type: item.type,
				display: item.display
			})
			return false
		}
		
		// Validate display range
		if (item.display.from < 0 || item.display.to <= item.display.from) {
			console.warn('[VideoWithCaptions] Track item has invalid display range:', {
				id: item.id,
				type: item.type,
				from: item.display.from,
				to: item.display.to
			})
			return false
		}
		
		return true
	})

	// Log validation results
	console.log('[VideoWithCaptions] Validation:', {
		total: trackItems.length,
		valid: validItems.length,
		invalid: trackItems.length - validItems.length
	})

	// Sort track items by z-index (videos first, then images, then text/captions)
	const sortedItems = validItems.sort((a, b) => {
		const order = { video: 0, audio: 0, image: 1, text: 2, caption: 3 }
		return (order[a.type] || 99) - (order[b.type] || 99)
	})

	return (
		<AbsoluteFill
			style={{
				backgroundColor:
					background.type === 'color' ? background.value : 'transparent',
				backgroundImage:
					background.type === 'image' ? `url(${background.value})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			{sortedItems.map((item) => {
				const fromFrame = Math.floor((item.display.from / 1000) * fps)
				const toFrame = Math.floor((item.display.to / 1000) * fps)
				const durationInFrames = toFrame - fromFrame

				if (durationInFrames <= 0) {
					console.warn('Track item has invalid duration:', item.id)
					return null
				}

				return (
					<Sequence
						key={item.id}
						from={fromFrame}
						durationInFrames={durationInFrames}
						layout="none"
					>
						{renderItem(item, frame, fps)}
					</Sequence>
				)
			})}
		</AbsoluteFill>
	)
}

/**
 * Render individual track items based on their type
 */
function renderItem(item: TrackItem, frame: number, fps: number) {
	switch (item.type) {
		case 'video':
			return <RenderVideo item={item} frame={frame} fps={fps} />
		case 'caption':
			return <RenderCaption item={item} frame={frame} fps={fps} />
		case 'audio':
			return <RenderAudio item={item} frame={frame} fps={fps} />
		case 'image':
			return <RenderImage item={item} frame={frame} fps={fps} />
		case 'text':
			return <RenderText item={item} frame={frame} fps={fps} />
		default:
			return null
	}
}

