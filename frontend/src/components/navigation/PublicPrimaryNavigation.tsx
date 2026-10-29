import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FiMenu, FiX } from 'react-icons/fi'
import type { PublicCategory } from '../../features/categories/types'

interface PublicPrimaryNavigationProps {
  categories: PublicCategory[]
}

/** Shows a horizontal category row on desktop and a disclosure menu on mobile. */
export default function PublicPrimaryNavigation({ categories }: PublicPrimaryNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const rootCategories = categories
    .filter((category) => category.parentId === null)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))

  const closeMenu = () => setIsMenuOpen(false)

  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <>
      <nav
        aria-label="Product categories"
        className="hidden items-center gap-5 overflow-x-auto py-3 sm:flex"
      >
        <span className="shrink-0 text-supporting font-semibold text-text-primary">
          Shop by category
        </span>

        {rootCategories.map((category) => (
          <Link
            key={category.id}
            to={`/products?categoryId=${encodeURIComponent(category.id)}`}
            className="shrink-0 text-supporting font-medium text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <div className="py-2 sm:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-category-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-supporting font-semibold text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          <span>Shop by category</span>
        </button>

        {isMenuOpen && (
          <nav
            id="mobile-category-navigation"
            aria-label="Product categories"
            className="mt-2 grid gap-1 border-t border-border pt-2"
          >
            {rootCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?categoryId=${encodeURIComponent(category.id)}`}
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-supporting font-medium text-text-secondary hover:bg-page hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </>
  )
}
