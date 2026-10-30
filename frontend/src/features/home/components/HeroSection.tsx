import { useState } from 'react'
import { Link } from 'react-router'

const heroImages = [
  '/images/hero-bold-local-player.png',
  '/images/hero-bold-local-womens-tennis.png',
  '/images/hero-bold-local-coaching.png',
]

/** Introduces the marketplace with a user-controlled carousel of local tennis imagery. */
export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <section
      aria-label="Tennis-Xpress featured campaigns"
      aria-roledescription="carousel"
      className="relative isolate flex min-h-85 items-center overflow-hidden rounded-xl text-white sm:min-h-100 lg:min-h-110 -mx-2 sm:-mx-4 lg:-mx-6"
    >
      {heroImages.map((image, index) => (
        <img
          key={image}
          src={image}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full object-cover object-[68%_center] transition-opacity duration-700 sm:object-center ${
            index === activeSlide ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Keep the copy readable over each changing background image. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-emerald-950/90 via-emerald-950/65 to-emerald-950/10"
      />

      <div className="relative z-10 w-full px-6 py-12 sm:px-10 lg:px-12">
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-lime-300">
            Bold &amp; Local
          </p>

          <h1 className="text-4xl font-extrabold uppercase leading-[1.05] sm:text-5xl lg:text-6xl">
            Play tennis
            <br />
            <span className="text-lime-400">in Cameroon</span>
          </h1>

          <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">
            Quality new and used equipment from local sellers near you.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-lime-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
            >
              Shop Now
            </Link>

            <Link
              to="/stores"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/80 bg-emerald-950/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
            >
              Find Stores
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {heroImages.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`Show hero image ${index + 1}`}
            aria-pressed={activeSlide === index}
            onClick={() => setActiveSlide(index)}
            className={`size-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950 ${
              activeSlide === index ? 'bg-lime-400' : 'bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
