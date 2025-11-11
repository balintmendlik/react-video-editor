import { useEffect } from 'react'
import { dispatch } from '@designcombo/events'
import { PLAYER_TOGGLE_PLAY } from '../constants/events'

const useKeyboardShortcuts = () => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Check if user is typing in an input field or contenteditable element
			const target = event.target as HTMLElement
			const isTyping =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable

			// If space bar is pressed and user is not typing
			if (event.code === 'Space' && !isTyping) {
				event.preventDefault() // Prevent page scroll
				dispatch(PLAYER_TOGGLE_PLAY)
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])
}

export default useKeyboardShortcuts

