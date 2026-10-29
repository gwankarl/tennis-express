import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { FiSearch } from 'react-icons/fi'

export default function ProductSearchForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedQuery = query.trim()

    if (!normalizedQuery) return

    const nextParams = new URLSearchParams({ q: normalizedQuery })

    navigate({
      pathname: '/products',
      search: `?${nextParams.toString()}`,
    })
  }

  return (
    <form
      role="search"
      aria-label="Search products"
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-1"
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>

      <input
        id="product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tennis products"
        className="min-h-11 min-w-0 flex-1 rounded-l-lg border border-border bg-surface px-3 text-body text-text-primary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      <button
        type="submit"
        aria-label="Search products"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-r-lg bg-primary px-4 text-surface hover:brightness-95 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <FiSearch aria-hidden="true" />
      </button>
    </form>
  )
}
