"use client"
import { useEffect } from "react"

const IGNORED_PATTERNS: RegExp[] = [
  /Error occurred in video\b/i,
  /Could not play video due to following error/i,
]

export default function InterceptConsoleError () {
  useEffect(() => {
    const original = console.error
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === "string" ? args[0] : ""
      if (IGNORED_PATTERNS.some((re) => re.test(msg))) {
        // downgrade to warn to reduce noise during dev
        console.warn(...args)
        return
      }
      original(...args)
    }
    return () => {
      console.error = original
    }
  }, [])
  return null
}


