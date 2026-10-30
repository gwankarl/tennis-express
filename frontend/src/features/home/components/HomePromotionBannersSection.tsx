import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router'

const promotions = [
  {
    firstLine: 'Rackets for',
    secondLine: 'Every Style',
    buttonLabel: 'Shop Rackets',
    searchTerm: 'rackets',
    image: '/images/promo-rackets-banner-v2.png',
  },
  {
    firstLine: 'Tennis Shoes',
    secondLine: 'On and Off Court',
    buttonLabel: 'Shop Shoes',
    searchTerm: 'tennis shoes',
    image: '/images/promo-tennis-shoes-banner-v2.png',
  },
]

/** Shows image-led links to popular tennis gear categories. */
export default function HomePromotionBannersSection() {
  return (
    <section
      aria-label="Featured tennis gear"
      className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {promotions.map((promotion) => (
        <article
          key={promotion.buttonLabel}
          className="group relative isolate min-h-47.5 overflow-hidden rounded-xl text-white sm:min-h-52.5"
        >
          <img
            src={promotion.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />

          <div className="relative z-10 flex min-h-47.5 items-center px-5 py-6 sm:min-h-52.5 sm:px-7">
            <div className="max-w-[65%]">
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                <span className="block">{promotion.firstLine}</span>
                <span className="block">{promotion.secondLine}</span>
              </h2>

              <Link
                to={`/products?q=${encodeURIComponent(promotion.searchTerm)}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
              >
                {promotion.buttonLabel}
                <FiArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
