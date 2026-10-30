import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { FiSearch } from 'react-icons/fi'

/** Searches public products and navigates to the product results page. */
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
      className="flex h-12 min-w-0 w-full overflow-hidden rounded-lg border border-border bg-gray-100 focus-within:ring-2 focus-within:ring-primary"
    >
      <label htmlFor="product-search" className="sr-only">
        Search tennis products
      </label>

      <input
        id="product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for rackets, shoes, bags, apparel and more..."
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-supporting text-text-primary placeholder:text-text-secondary focus:outline-none sm:px-4"
      />

      <button
        type="submit"
        aria-label="Submit product search"
        className="inline-flex h-full w-12 shrink-0 items-center justify-center  cursor-pointer bg-primary text-white p-0  hover:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <FiSearch aria-hidden="true" className="size-5" />
      </button>
    </form>
  )
}
