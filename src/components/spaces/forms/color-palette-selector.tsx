'use client'

import { SPACE_COLOR_PALETTE } from '@/lib/utils/colors'
import { Input } from '@/components/ui/input'

interface ColorPaletteSelectorProps {
  defaultValue?: string
}

export function ColorPaletteSelector({ defaultValue }: ColorPaletteSelectorProps) {
  const handleColorSelect = (color: string) => {
    const colorInput = document.getElementById('color') as HTMLInputElement
    if (colorInput) {
      colorInput.value = color
    }
  }

  return (
    <div className="space-y-3">
      {/* Color Input */}
      <Input
        type="color"
        id="color"
        name="color"
        defaultValue={defaultValue || SPACE_COLOR_PALETTE[0]}
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
              className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
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