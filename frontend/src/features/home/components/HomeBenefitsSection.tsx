import { FiMapPin, FiSearch, FiShoppingBag, FiUsers } from 'react-icons/fi'

const benefits = [
  {
    title: 'Local Sellers',
    description: 'Across Cameroon',
    Icon: FiMapPin,
  },
  {
    title: 'New and Used Gear',
    description: 'For every budget',
    Icon: FiShoppingBag,
  },
  {
    title: 'Compare Options',
    description: 'Find the right fit',
    Icon: FiSearch,
  },
  {
    title: 'Growing Community',
    description: 'Tennis players and clubs',
    Icon: FiUsers,
  },
]

/** Highlights the local marketplace benefits for shoppers. */
export default function HomeBenefitsSection() {
  return (
    <section
      aria-labelledby="home-benefits-title"
      className="mt-3 rounded-xl bg-gray-50 px-4 py-4 sm:px-6"
    >
      <h2 id="home-benefits-title" className="sr-only">
        Why shop with Tennis-Xpress?
      </h2>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-5 md:gap-y-0">
        {benefits.map(({ title, description, Icon }) => (
          <li key={title} className="flex min-w-0 items-center gap-2.5">
            <Icon aria-hidden="true" className="size-9 shrink-0 text-primary" />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary sm:text-sm">{title}</p>
              <p className="text-[11px] leading-snug text-text-secondary sm:text-xs">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
