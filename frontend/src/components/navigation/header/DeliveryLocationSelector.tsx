import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiMapPin } from 'react-icons/fi'
import { sellerStoreRegions, type SellerStoreRegion } from '../../../features/sellers/store/types'

const deliveryRegionStorageKey = 'tennis-xpress.delivery-region'
const regionOptionsId = 'delivery-region-options'

function getSavedDeliveryRegion(): SellerStoreRegion | '' {
  const savedRegion = window.localStorage.getItem(deliveryRegionStorageKey)

  return sellerStoreRegions.find((region) => region === savedRegion) ?? ''
}

/** Lets a visitor choose and remember a checkout-supported delivery region. */
export default function DeliveryLocationSelector() {
  const [selectedRegion, setSelectedRegion] = useState<SellerStoreRegion | ''>(
    getSavedDeliveryRegion,
  )
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleRegionSelect = (region: SellerStoreRegion) => {
    setSelectedRegion(region)
    window.localStorage.setItem(deliveryRegionStorageKey, region)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      ref={dropdownRef}
      className="relative inline-flex min-h-11 shrink-0 items-center rounded-md px-2 py-1"
    >
      <FiMapPin aria-hidden="true" className="mr-2 size-5 shrink-0 text-text-primary" />

      <div className="grid leading-tight">
        <span className="text-xs text-text-secondary">Deliver to</span>

        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={regionOptionsId}
          aria-label={`Choose delivery region. Current region: ${selectedRegion || 'not selected'}`}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex w-fit cursor-pointer items-center gap-1 text-left text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>{selectedRegion || 'Select region'}</span>
          <FiChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-text-secondary transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div
        id={regionOptionsId}
        role="group"
        aria-label="Choose a delivery region"
        hidden={!isOpen}
        className="absolute left-0 top-full z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg"
      >
        {sellerStoreRegions.map((region) => (
          <button
            key={region}
            type="button"
            aria-pressed={selectedRegion === region}
            onClick={() => handleRegionSelect(region)}
            className="w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {region}
          </button>
        ))}
      </div>
    </div>
  )
}
