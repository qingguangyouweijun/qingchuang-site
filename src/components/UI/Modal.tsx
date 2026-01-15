"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {!title && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
