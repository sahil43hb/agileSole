"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/analytics";

export function Analytics() {
  const [enabled, setEnabled] = useState(false);
  const [ga4Id, setGa4Id] = useState("");
  const [pixelId, setPixelId] = useState("");

  useEffect(() => {
    function refresh() {
      setEnabled(hasMarketingConsent());
    }
    refresh();
    window.addEventListener("as-consent", refresh);
    fetch("/api/v1/settings/public")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) return;
        setGa4Id(json.data.ga4Id || "");
        setPixelId(json.data.metaPixelId || "");
      })
      .catch(() => {});
    return () => window.removeEventListener("as-consent", refresh);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {ga4Id ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(ga4Id)});
          `}</Script>
        </>
      ) : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(pixelId)});
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  );
}
