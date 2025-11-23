/**
 * Render Caption Component for Remotion
 */

import { useCurrentFrame, continueRender, delayRender } from 'remotion'
import { loadFont } from '@remotion/fonts'
import type { Caption, CaptionWord } from '../types'
import { CSSProperties, useEffect, useState } from 'react'

interface RenderCaptionProps {
	item: Caption
	frame: number
	fps: number
}

export const RenderCaption: React.FC<RenderCaptionProps> = ({ item, frame, fps }) => {
	const currentFrame = useCurrentFrame()
	const { details, display } = item
	const [fontLoaded, setFontLoaded] = useState(false)
	const [handle] = useState(() => 
		details.fontUrl ? delayRender('Loading font for caption') : null
	)

	// Load custom font if provided
	useEffect(() => {
		if (details.fontUrl && handle !== null) {
			loadFont({
				family: details.fontFamily,
				url: details.fontUrl,
			})
				.then(() => {
					setFontLoaded(true)
					continueRender(handle)
				})
				.catch((err) => {
					console.error('Failed to load font:', err)
					setFontLoaded(true) // Continue with fallback
					continueRender(handle)
				})
		} else {
			setFontLoaded(true)
		}
	}, [details.fontUrl, details.fontFamily, handle])

	if (!fontLoaded) return null

	// Calculate current time in milliseconds
	const startFrame = Math.floor((display.from / 1000) * fps)
	const relativeFrame = currentFrame - startFrame
	const currentTime = display.from + (relativeFrame / fps) * 1000

	// Get styles for the caption container
	const containerStyles: CSSProperties = {
		position: 'absolute',
		left: details.x || '50%',
		top: details.y || '85%',
		transform: 'translate(-50%, -50%)',
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: details.textAlign || 'center',
		maxWidth: details.width || '90%',
		padding: '8px 16px',
		borderRadius: '16px',
		backgroundColor: details.backgroundColor || 'transparent',
		border:
			details.borderWidth && details.borderWidth > 0
				? `${details.borderWidth}px solid ${details.borderColor || '#000'}`
				: undefined,
		boxShadow: details.boxShadow
			? `${details.boxShadow.x}px ${details.boxShadow.y}px ${details.boxShadow.blur}px ${details.boxShadow.color}`
			: undefined,
	}

	// Get styles for each word
	const getWordStyle = (word: CaptionWord): CSSProperties => {
		const isActive = currentTime >= word.start && currentTime < word.end
		const hasAppeared = currentTime >= word.end

		let color = details.color
		if (isActive && details.activeColor) {
			color = details.activeColor
		} else if (hasAppeared && details.appearedColor) {
			color = details.appearedColor
		}

		// Handle keyword color
		if (word.is_keyword && details.isKeywordColor && !details.preservedColorKeyWord) {
			color = details.isKeywordColor
		}

		return {
			fontFamily: details.fontFamily,
			fontSize: details.fontSize || 48,
			color,
			backgroundColor: isActive && details.activeFillColor ? details.activeFillColor : 'transparent',
			WebkitTextStrokeWidth: details.WebkitTextStrokeWidth || '0px',
			WebkitTextStrokeColor: details.WebkitTextStrokeColor || 'transparent',
			marginRight: '8px',
			marginBottom: '4px',
			fontWeight: 'bold',
			transition: 'all 0.1s ease',
			whiteSpace: 'nowrap',
		}
	}

	return (
		<div style={containerStyles}>
			{details.words.map((word, index) => (
				<span key={index} style={getWordStyle(word)}>
					{word.word}
				</span>
			))}
		</div>
	)
}

