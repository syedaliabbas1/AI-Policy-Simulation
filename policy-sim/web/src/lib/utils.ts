// Tremor Raw cx [v0.0.0]

import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args))
}

// Alias for code that expects `cn` from shadcn-style utils
export const cn = cx

export const focusInput = [
  "focus:ring-2",
  "focus:ring-indigo-200 focus:dark:ring-indigo-700/30",
  "focus:border-indigo-500 focus:dark:border-indigo-700",
]

export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-indigo-500 dark:outline-indigo-500",
]

export const hasErrorInput = [
  "ring-2",
  "border-red-500 dark:border-red-700",
  "ring-red-200 dark:ring-red-700/30",
]

export const usNumberformatter = (number: number, decimals = 0) =>
  Intl.NumberFormat("us", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(number)).toString()

export const percentageFormatter = (number: number, decimals = 1) => {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
  const symbol = number > 0 && number !== Infinity ? "+" : ""
  return `${symbol}${formattedNumber}`
}

export const millionFormatter = (number: number, decimals = 1) => {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
  return `${formattedNumber}M`
}

export const formatters: { [key: string]: (...args: any[]) => string } = {
  currency: (number: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(number),
  unit: (number: number) => `${usNumberformatter(number)}`,
  usNumberformatter,
  percentageFormatter,
  millionFormatter,
}