"use client";

import React, { useState } from 'react';
import { ChevronDown, Building2, Crown, Check } from 'lucide-react';
import { useCoworkSelection } from '@/contexts/cowork-selection-context';

export function CoworkSelector() {
  const {
    selectedCowork,
    availableCoworks,
    isSuperAdmin,
    isPlatformView,
    isLoadingCoworks,
    selectCowork,
    switchToPlatformView
  } = useCoworkSelection();

  const [isOpen, setIsOpen] = useState(false);

  // Don't render if not a super admin or if loading
  if (!isSuperAdmin || isLoadingCoworks) {
    return null;
  }

  // Options for the dropdown
  const options = [
    {
      id: 'platform',
      name: 'Vista General de la Plataforma',
      slug: 'platform',
      isPlatform: true,
      icon: Crown,
      description: 'Gestionar toda la plataforma SweetSpot'
    },
    ...availableCoworks.map(cowork => ({
      ...cowork,
      isPlatform: false,
      icon: Building2,
      description: `Gestionar ${cowork.name}`
    }))
  ];

  const currentSelection = isPlatformView 
    ? options[0] 
    : options.find(opt => opt.id === selectedCowork?.id);

  const handleSelect = (option: typeof options[0]) => {
    if (option.isPlatform) {
      switchToPlatformView();
    } else {
      selectCowork(option);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-3 px-2 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors min-w-[120px] sm:min-w-[280px] max-w-[200px] sm:max-w-none"
      >
        <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
          {currentSelection?.icon && (
            <currentSelection.icon className={`h-4 w-4 flex-shrink-0 ${
              currentSelection.isPlatform ? 'text-purple-600' : 'text-blue-600'
            }`} />
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
              <span className="hidden sm:inline">{currentSelection?.name || 'Seleccionar vista'}</span>
              <span className="sm:hidden">
                {currentSelection?.isPlatform ? 'Plataforma' : currentSelection?.name || 'Vista'}
              </span>
            </div>
            <div className="hidden sm:block text-xs text-gray-500 truncate">
              {currentSelection?.description || 'Elige cómo ver el sistema'}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform flex-shrink-0 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-auto">
            {/* Platform Option */}
            <div
              key="platform"
              onClick={() => handleSelect(options[0])}
              className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                isPlatformView ? 'bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900">Vista General de la Plataforma</div>
                  <div className="text-sm text-gray-500">
                    Estadísticas y gestión de toda la plataforma
                  </div>
                </div>
              </div>
              {isPlatformView && (
                <Check className="h-4 w-4 text-purple-600" />
              )}
            </div>

            {/* Coworks */}
            {availableCoworks.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  Coworks Disponibles ({availableCoworks.length})
                </div>
                {availableCoworks.map((cowork) => {
                  const isSelected = selectedCowork?.id === cowork.id;
                  return (
                    <div
                      key={cowork.id}
                      onClick={() => handleSelect(cowork)}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{cowork.name}</div>
                          <div className="text-sm text-gray-500">
                            {cowork.slug} • {cowork.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Empty State */}
            {availableCoworks.length === 0 && (
              <div className="px-4 py-6 text-center">
                <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  No hay coworks disponibles
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Crea el primer cowork desde la vista de plataforma
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CoworkSelector;