import React from "react"

interface PlanCardProps {
  name: string
  priceText: string
  description?: string
  popular?: boolean
  children?: React.ReactNode
}

export function PlanCard({ name, priceText, description, popular, children }: PlanCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${popular ? "border-primary" : "border-base-300"}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{name}</h3>
        {popular ? <span className="badge badge-primary">Popular</span> : null}
      </div>
      <div className="text-2xl font-bold">{priceText}</div>
      {description ? <p className="mt-2 text-sm opacity-80">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  )
}

