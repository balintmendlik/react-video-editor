/**
 * Render Audio Component for Remotion
 */

import { Audio as RemotionAudio, staticFile } from 'remotion'
import type { AudioItem } from '../types'

interface RenderAudioProps {
	item: AudioItem
	frame: number
	fps: number
}

export const RenderAudio: React.FC<RenderAudioProps> = ({ item, frame, fps }) => {
	const { details, trim, playbackRate = 1 } = item
	const { src, volume = 100 } = details

	// Determine audio source
	const audioSrc = src.startsWith('http') ? src : staticFile(src)

	// Calculate trim points in frames
	// startFrom and endAt specify which frames of the SOURCE audio to play
	// If no trim is specified, calculate based on the display duration
	let startFromFrame: number | undefined
	let endAtFrame: number | undefined

	if (trim?.from !== undefined || trim?.to !== undefined) {
		// Use trim if specified
		startFromFrame = trim.from ? Math.floor((trim.from / 1000) * fps) : 0
		endAtFrame = trim.to ? Math.floor((trim.to / 1000) * fps) : undefined
	} else {
		// If no trim, calculate from display duration
		// This ensures we only play the audio for the duration it appears on the timeline
		const displayDuration = item.display.to - item.display.from
		const displayDurationInFrames = Math.floor((displayDuration / 1000) * fps)
		startFromFrame = 0
		endAtFrame = displayDurationInFrames
	}

	return (
		<RemotionAudio
			src={audioSrc}
			volume={volume / 100}
			playbackRate={playbackRate}
			startFrom={startFromFrame}
			endAt={endAtFrame}
		/>
	)
}

