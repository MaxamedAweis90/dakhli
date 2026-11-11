import { useEffect } from 'react'
import { usePrivacyStore } from '@/stores/privacyStore'

/**
 * Window-level keyboard listener bound to the 'H' key to toggle global privacy shroud.
 * Guards against triggering when user is actively typing inside text inputs, textareas,
 * select dropdowns, or contenteditable fields.
 */
export function usePrivacyHotkey(): void {
  const togglePrivacy = usePrivacyStore((state) => state.togglePrivacy)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger only on plain 'h' or 'H' without Ctrl/Cmd/Alt modifiers
      if (e.key !== 'h' && e.key !== 'H') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Strict Input Guard
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.getAttribute('contenteditable') === 'true' ||
        (active as HTMLElement)?.isContentEditable
      ) {
        return
      }

      e.preventDefault()
      togglePrivacy()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePrivacy])
}

export default usePrivacyHotkey

