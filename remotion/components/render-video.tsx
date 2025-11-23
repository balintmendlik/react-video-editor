/**
 * Render Video Component for Remotion
 */

import { Video as RemotionVideo, staticFile } from 'remotion'
import type { VideoItem } from '../types'

interface RenderVideoProps {
	item: VideoItem
	frame: number
	fps: number
}

export const RenderVideo: React.FC<RenderVideoProps> = ({ item, frame, fps }) => {
	const { details, trim, playbackRate = 1 } = item
	const { src, width, height, volume = 100, x = 0, y = 0, rotation = 0, crop } = details

	// Calculate crop values
	const cropArea = crop || { x: 0, y: 0, width, height }

	// Determine video source (handle both local and remote URLs)
	const videoSrc = src.startsWith('http') ? src : staticFile(src)

	// Calculate trim points in frames
	// startFrom and endAt specify which frames of the SOURCE video to play
	// If no trim is specified, calculate based on the display duration
	let startFromFrame: number | undefined
	let endAtFrame: number | undefined

	if (trim?.from !== undefined || trim?.to !== undefined) {
		// Use trim if specified
		startFromFrame = trim.from ? Math.floor((trim.from / 1000) * fps) : 0
		endAtFrame = trim.to ? Math.floor((trim.to / 1000) * fps) : undefined
	} else {
		// If no trim, calculate from display duration
		// This ensures we only play the video for the duration it appears on the timeline
		const displayDuration = item.display.to - item.display.from
		const displayDurationInFrames = Math.floor((displayDuration / 1000) * fps)
		startFromFrame = 0
		endAtFrame = displayDurationInFrames
	}

	// Log for debugging
	if (typeof window === 'undefined') {
		console.log('[RenderVideo]', {
			id: item.id,
			src: videoSrc,
			display: item.display,
			trim,
			startFromFrame,
			endAtFrame,
			playbackRate
		})
	}

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: cropArea.width,
				height: cropArea.height,
				overflow: 'hidden',
				transform: `rotate(${rotation}deg)`,
			}}
		>
			<div
				style={{
					width,
					height,
					marginLeft: -cropArea.x,
					marginTop: -cropArea.y,
				}}
			>
				<RemotionVideo
					src={videoSrc}
					volume={volume / 100}
					playbackRate={playbackRate}
					startFrom={startFromFrame}
					endAt={endAtFrame}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
					onError={(e) => {
						console.error('[RenderVideo] Error loading video:', {
							src: videoSrc,
							error: e,
							item: item.id
						})
					}}
				/>
			</div>
		</div>
	)
}

