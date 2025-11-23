/**
 * Render Image Component for Remotion
 */

import { Img, staticFile } from 'remotion'
import type { ImageItem } from '../types'

interface RenderImageProps {
	item: ImageItem
	frame: number
	fps: number
}

export const RenderImage: React.FC<RenderImageProps> = ({ item }) => {
	const { details } = item
	const { src, width, height, x = 0, y = 0, rotation = 0, crop } = details

	// Calculate crop values
	const cropArea = crop || { x: 0, y: 0, width, height }

	// Determine image source
	const imageSrc = src.startsWith('http') ? src : staticFile(src)

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
			<Img
				src={imageSrc}
				style={{
					width,
					height,
					marginLeft: -cropArea.x,
					marginTop: -cropArea.y,
					objectFit: 'cover',
				}}
			/>
		</div>
	)
}

