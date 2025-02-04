"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const logos = [
  { src: "/PlatON-NETWORK.png", alt: "PlatON", href: "https://www.platon.network/" },
  { src: "/DeworkHub.jpg", alt: "DeworkHub", href: "https://payment.deworkhub.com/" },
  { src: "/NiftyIN.png", alt: "NiftyIN", href: "https://www.niftyin.xyz/" },
  { src: "/ATON.png", alt: "ATON", href: "https://www.platon.network/wallet" },
  { src: "/DipoleSwap.jpg", alt: "DipoleSwap", href: "https://dipoleswap.exchange/" },
  { src: "/topwallet.png", alt: "topwallet", href: "https://www.paytop.io/" },
];

export default function ScrollingLogoBanner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden bg-gray-100 py-4">
      <div className="flex animate-scroll">
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-10 flex justify-center items-center"
            style={{ width: "240px", height: "90px" }}
          >
            <Link
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-opacity duration-300 w-full h-full flex items-center justify-center"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={200}
                height={100}
                className="object-contain filter transition-all duration-300 max-w-full max-h-full"
                style={{
                  width: "auto",
                  height: "auto",
                }}
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
