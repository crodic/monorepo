import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'file-manager:starred-ids'
const STAR_EVENT = 'file-manager:starred-change'

function getInitialStarred(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

export function useStarredFiles() {
  const [starredIds, setStarredIds] = useState<Set<string>>(getInitialStarred)

  useEffect(() => {
    // Initial sync
    setStarredIds(getInitialStarred())

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setStarredIds(getInitialStarred())
      }
    }

    const handleCustom = () => {
      setStarredIds(getInitialStarred())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STAR_EVENT, handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STAR_EVENT, handleCustom)
    }
  }, [])

  const toggleStar = useCallback((publicId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev)
      if (next.has(publicId)) {
        next.delete(publicId)
      } else {
        next.add(publicId)
      }

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(Array.from(next))
          )
          window.dispatchEvent(new Event(STAR_EVENT))
        } catch {
          // ignore localStorage error
        }
      }
      return next
    })
  }, [])

  const isStarred = useCallback(
    (publicId?: string | null) => {
      if (!publicId) return false
      return starredIds.has(publicId)
    },
    [starredIds]
  )

  return {
    starredIds,
    starredCount: starredIds.size,
    isStarred,
    toggleStar,
  }
}
