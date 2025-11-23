/**
 * Remotion Root File
 * 
 * This is the entry point for Remotion compositions that will be deployed to AWS Lambda
 */

import { Composition, registerRoot } from 'remotion'
import { VideoWithCaptions } from './compositions/video-with-captions'
import type { VideoCompositionProps } from './types'

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="VideoWithCaptions"
				component={VideoWithCaptions}
				defaultProps={{
					videoUrl: '',
					captions: [],
					videoWidth: 1080,
					videoHeight: 1920,
					fps: 30,
					durationInSeconds: 10,
					trackItems: [],
					background: {
						type: 'color',
						value: 'transparent',
					},
				} as VideoCompositionProps}
				fps={30}
				width={1080}
				height={1920}
				durationInFrames={300}
				calculateMetadata={async ({ props }) => {
					const durationInFrames = Math.ceil(props.durationInSeconds * props.fps)
					
					return {
						fps: props.fps,
						width: props.videoWidth,
						height: props.videoHeight,
						durationInFrames,
						props,
					}
				}}
			/>
		</>
	)
}

// Register the root component with Remotion
registerRoot(RemotionRoot)

