/**
 * Type definitions for Remotion compositions
 */

export interface CaptionWord {
	word: string
	start: number
	end: number
	is_keyword?: boolean
}

export interface CaptionSegment {
	id: string
	start: number
	end: number
	text: string
	words: CaptionWord[]
}

export interface CaptionDetails {
	words: CaptionWord[]
	fontSize: number
	fontFamily: string
	fontUrl?: string
	color: string
	activeColor?: string
	activeFillColor?: string
	appearedColor?: string
	backgroundColor?: string
	textAlign?: 'left' | 'center' | 'right'
	x?: number
	y?: number
	width?: number
	height?: number
	animation?: string
	WebkitTextStrokeWidth?: string
	WebkitTextStrokeColor?: string
	borderWidth?: number
	borderColor?: string
	boxShadow?: {
		x: number
		y: number
		blur: number
		color: string
	}
	showObject?: string
	linesPerCaption?: number
	isKeywordColor?: string
	preservedColorKeyWord?: boolean
}

export interface Caption {
	id: string
	type: 'caption'
	display: {
		from: number
		to: number
	}
	details: CaptionDetails
	animations?: any[]
}

export interface VideoItem {
	id: string
	type: 'video'
	display: {
		from: number
		to: number
	}
	details: {
		src: string
		width: number
		height: number
		volume?: number
		x?: number
		y?: number
		rotation?: number
		crop?: {
			x: number
			y: number
			width: number
			height: number
		}
	}
	trim?: {
		from: number
		to: number
	}
	playbackRate?: number
	animations?: any[]
}

export interface AudioItem {
	id: string
	type: 'audio'
	display: {
		from: number
		to: number
	}
	details: {
		src: string
		volume?: number
	}
	trim?: {
		from: number
		to: number
	}
	playbackRate?: number
}

export interface ImageItem {
	id: string
	type: 'image'
	display: {
		from: number
		to: number
	}
	details: {
		src: string
		width: number
		height: number
		x?: number
		y?: number
		rotation?: number
		crop?: {
			x: number
			y: number
			width: number
			height: number
		}
	}
	animations?: any[]
}

export interface TextItem {
	id: string
	type: 'text'
	display: {
		from: number
		to: number
	}
	details: {
		text: string
		fontSize: number
		fontFamily: string
		fontUrl?: string
		color: string
		x?: number
		y?: number
		width?: number
		height?: number
		textAlign?: 'left' | 'center' | 'right'
		wordWrap?: string
		borderWidth?: number
		borderColor?: string
		boxShadow?: {
			x: number
			y: number
			blur: number
			color: string
		}
	}
	animations?: any[]
}

export type TrackItem = VideoItem | AudioItem | ImageItem | TextItem | Caption

export interface VideoCompositionProps {
	videoUrl: string
	captions: Caption[]
	videoWidth: number
	videoHeight: number
	fps: number
	durationInSeconds: number
	trackItems: TrackItem[]
	background: {
		type: 'color' | 'image'
		value: string
	}
}

