"use client";

import React, { useEffect, useRef } from "react";
import * as jdenticon from "jdenticon";
import Image from "next/image";

interface UserAvatarProps {
  address: string;
  size?: number;
}

export function UserAvatar({ address, size }: UserAvatarProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      jdenticon.update(svgRef.current, address);
    }
  }, [address]);

  return (
    <div className="relative inline-flex items-center justify-center object-left-top">
      <Image
        src="/avater.png"
        alt="Avatar background"
        width={54}
        height={54}
        className="rounded-full object-fill items-center justify-center"
      />
      <svg
        ref={svgRef}
        width={size}
        height={size}
        data-jdenticon-value={address}
        className="rounded-full absolute"
      />
    </div>
  );
}
