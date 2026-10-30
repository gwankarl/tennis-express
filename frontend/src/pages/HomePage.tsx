import FeaturedBrandsSection from '../features/brands/components/FeaturedBrandsSection'
import CategoryTilesSection from '../features/home/components/CategoryTilesSection'
import HeroSection from '../features/home/components/HeroSection'
import HomeBenefitsSection from '../features/home/components/HomeBenefitsSection'
import HomePromotionBannersSection from '../features/home/components/HomePromotionBannersSection'

/** Renders the public homepage. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HomeBenefitsSection />
      <HomePromotionBannersSection />
      <CategoryTilesSection />
      <FeaturedBrandsSection />
    </>
  )
}
