import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiMenu } from 'react-icons/fi'
import { Link } from 'react-router'
import type { PublicCategory } from '../../../features/categories/types'

interface ShopByCategoryMenuProps {
  categories: PublicCategory[]
}

const categoryMenuId = 'header-category-menu'

/** Opens a compact list of top-level product categories. */
export default function ShopByCategoryMenu({ categories }: ShopByCategoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const rootCategories = categories
    .filter((category) => category.parentId === null)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
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

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={categoryMenuId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FiMenu aria-hidden="true" className="size-5" />
        <span className="whitespace-nowrap">All Categories</span>
        <FiChevronDown
          aria-hidden="true"
          className={`size-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <nav
        id={categoryMenuId}
        aria-label="All Categories"
        hidden={!isOpen}
        className="absolute left-0 z-50 mt-2 grid max-h-80 w-64 gap-1 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg"
      >
        {rootCategories.map((category) => (
          <Link
            key={category.id}
            to={`/products?categoryId=${encodeURIComponent(category.id)}`}
            onClick={() => setIsOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
