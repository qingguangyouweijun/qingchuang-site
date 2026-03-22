"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number
  max?: number
  step?: number
  value?: number
  onValueChange?: (value: number) => void
}

export function Slider({ className, min = 0, max = 100, step = 1, value, onValueChange, ...props }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(Number(e.target.value))
  }

  const percentage = ((Number(value) - min) / (max - min)) * 100

  return (
    <div className="relative w-full h-6 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className={cn(
          "w-full h-2 rounded-lg appearance-none cursor-pointer z-10 bg-transparent focus:outline-none",
          className
        )}
        {...props}
      />

      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-2 bg-gray-200 rounded-lg overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-500 transition-all duration-150 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <style jsx>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #0ea5e9;
          cursor: pointer;
          margin-top: -8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
