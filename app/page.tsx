import Hero from '@/components/Hero';
import VarietyShowcase from '@/components/VarietyShowcase';
import Products from '@/components/Products';
import BrandStory from '@/components/BrandStory';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';

export default function Home() {
  return (
    <>
      <Hero />
      <VarietyShowcase />
      <Products />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </>
  );
}
