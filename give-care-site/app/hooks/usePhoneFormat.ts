"use client"

import { useCallback, useState } from "react"

export function usePhoneFormat(initial = "") {
  const [value, setValue] = useState<string>(initial)

  const format = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }, [])

  const onChange = useCallback((next: string) => {
    setValue(format(next))
  }, [format])

  const getE164 = useCallback(() => {
    const digits = value.replace(/\D/g, "")
    if (digits.length === 10) return `+1${digits}`
    return `+${digits}`
  }, [value])

  return { value, setValue: onChange, getE164 }
}

