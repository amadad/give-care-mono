"use client"

import mermaid from "mermaid"
// Minimal SVG sanitizer to prevent script injection
function sanitizeSVG(svg: string): string {
  // Remove script tags and on* event handlers
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on[a-zA-Z]+\s*=\s*"[^"]*"/g, "")
    .replace(/on[a-zA-Z]+\s*=\s*'[^']*'/g, "")
    .replace(/on[a-zA-Z]+\s*=\s*[^\s>]+/g, "")
}
import {  useRef } from "react"

mermaid.initialize({
  startOnLoad: true,
  theme: "neutral",
  // Use strict security; we sanitize rendered SVG as an extra safeguard
  securityLevel: "strict",
  fontFamily: "inherit",
})

export interface MermaidProps {
  chart: string
}

export default function Mermaid({ chart }: MermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mermaidRef.current) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
      mermaid.render(id, chart).then(({ svg }) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = sanitizeSVG(svg)
        }
      })
    }
  }, [chart])

  return <div className="mermaid" ref={mermaidRef} />
}
