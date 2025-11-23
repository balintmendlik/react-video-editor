/**
 * Render Text Component for Remotion
 */

import { continueRender, delayRender } from 'remotion'
import { loadFont } from '@remotion/fonts'
import type { TextItem } from '../types'
import { CSSProperties, useEffect, useState } from 'react'

interface RenderTextProps {
	item: TextItem
	frame: number
	fps: number
}

export const RenderText: React.FC<RenderTextProps> = ({ item }) => {
	const { details } = item
	const [fontLoaded, setFontLoaded] = useState(false)
	const [handle] = useState(() => 
		details.fontUrl ? delayRender('Loading font for text') : null
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

	const textStyles: CSSProperties = {
		position: 'absolute',
		left: details.x || '50%',
		top: details.y || '50%',
		transform: 'translate(-50%, -50%)',
		fontFamily: details.fontFamily,
		fontSize: details.fontSize || 48,
		color: details.color || '#ffffff',
		textAlign: details.textAlign || 'center',
		width: details.width || 'auto',
		maxWidth: details.width || '90%',
		wordWrap: details.wordWrap as any || 'break-word',
		padding: '8px 16px',
		borderRadius: '8px',
		border:
			details.borderWidth && details.borderWidth > 0
				? `${details.borderWidth}px solid ${details.borderColor || '#000'}`
				: undefined,
		boxShadow: details.boxShadow
			? `${details.boxShadow.x}px ${details.boxShadow.y}px ${details.boxShadow.blur}px ${details.boxShadow.color}`
			: undefined,
	}

	return <div style={textStyles}>{details.text}</div>
}

