import Hero from '@/components/Hero';
import Products from '@/components/Products';
import BrandStory from '@/components/BrandStory';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';

export default function Home() {
  return (
    <>
      <Hero />
      <Products />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </>
  );
}
