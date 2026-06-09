import type { Metadata } from 'next';
import { Poppins, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/app/chat/page';
import Reveal from '@/components/Reveal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans-kr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '비타앤오리진 | 프리미엄 올리브오일',
  description: '세계 최고의 올리브오일을 선별하여 제공합니다. 웰니스 라이프스타일을 위한 프리미엄 올리브오일',
  keywords: '올리브오일, 프리미엄, 웰니스, 건강식품',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${poppins.variable} ${notoSansKr.variable}`}>
      <head>
        {/* Facebook Pixel */}
        <script
          async
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'YOUR_FACEBOOK_PIXEL_ID');
              fbq('track', 'PageView');
            `,
          }}
        />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=YOUR_GOOGLE_GA_ID"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'YOUR_GOOGLE_GA_ID');
            `,
          }}
        />

        {/* Naver Analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,c){w.wcs = w.wcs || [];w.wcs.push(['s','YOUR_NAVER_CONVERSION_ID',true]);
              var u=(c.location.protocol=='https:'?'https://wcs.naver.net/wcslog.js':'http://wcs1.naver.net/wcslog.js');
              var s=d.createElement('script');s.async=true;s.src=u;
              if(d.readyState!='loading')d.body.appendChild(s);
              else if(w.addEventListener)w.addEventListener('load',function(){d.body.appendChild(s)},false);
              })(window,document);
            `,
          }}
        />

        {/* Kakao Conversion Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              Kakao.init('YOUR_KAKAO_APP_ID');
              Kakao.Analytics.sendEvent('view', {
                key: 'value',
              });
            `,
          }}
        />

        {/* Iamport SDK */}
        <script src="https://cdn.iamport.kr/v1/iamport.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.IMP) {
                window.IMP.init('${process.env.NEXT_PUBLIC_IAMPORT_ID}');
              }
            `,
          }}
        />
      </head>
      <body>
        <Reveal />
        <Header />
        <main>{children}</main>
        <ChatWidget />
        <Footer />
      </body>
    </html>
  );
}
