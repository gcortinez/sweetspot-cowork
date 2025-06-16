"use client"

import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-[420px] flex-col gap-2">
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <div
            key={id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105",
              variant === "destructive"
                ? "border-red-200 bg-red-50 text-red-900"
                : variant === "warning"
                ? "border-yellow-200 bg-yellow-50 text-yellow-900"
                : "border-green-200 bg-green-50 text-green-900"
            )}
            {...props}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(variant)}
            </div>
            <div className="flex-1 grid gap-1">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            <button
              className="flex-shrink-0 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
              onClick={() => dismiss(id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}