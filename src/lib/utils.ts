import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  // using clsx only; without Tailwind, twMerge is unnecessary
  return clsx(inputs)
}
