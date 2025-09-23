'use client'

import { useState, useEffect } from 'react'
import { SPACE_COLOR_PALETTE } from '@/lib/utils/colors'
import { Input } from '@/components/ui/input'

interface ColorPaletteSelectorProps {
  defaultValue?: string
  onColorChange?: (color: string) => void
  inputId?: string
}

export function ColorPaletteSelector({
  defaultValue,
  onColorChange,
  inputId = 'color'
}: ColorPaletteSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(defaultValue || SPACE_COLOR_PALETTE[0])

  useEffect(() => {
    if (defaultValue !== undefined) {
      setSelectedColor(defaultValue || SPACE_COLOR_PALETTE[0])
    }
  }, [defaultValue])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)

    // Update the input field (for form-based usage)
    const colorInput = document.getElementById(inputId) as HTMLInputElement
    if (colorInput) {
      colorInput.value = color
      // Trigger change event for forms
      colorInput.dispatchEvent(new Event('change', { bubbles: true }))
    }

    // Call the callback if provided (for state-based usage)
    onColorChange?.(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setSelectedColor(color)
    onColorChange?.(color)
  }

  return (
    <div className="space-y-3">
      {/* Color Input */}
      <Input
        type="color"
        id={inputId}
        name="color"
        value={selectedColor}
        onChange={handleInputChange}
        className="w-20 h-10 p-1 rounded cursor-pointer"
      />

      {/* Color Palette */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Colores sugeridos:
        </p>
        <div className="flex flex-wrap gap-2">
          {SPACE_COLOR_PALETTE.map((color, index) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-colors ${
                selectedColor === color
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              title={`Color ${index + 1}: ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}