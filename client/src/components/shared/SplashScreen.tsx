import React from "react";

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = "Loading...",
}) => {
  return (
    <div
      role="status"
      aria-label={message}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0E12] text-white select-none transition-opacity duration-300"
    >
      {/* Brand Emblem with Ambient Amber Glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-[#E5A855]/12 blur-2xl animate-pulse" />
        <div className="relative w-14 h-14 rounded-2xl bg-[#13151B] border border-white/10 flex items-center justify-center shadow-2xl">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-current text-[#E5A855] animate-pulse"
            aria-hidden="true"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      </div>

      {/* Brand Name */}
      <h1 className="text-xl font-bold tracking-tight text-white mt-5">
        Dakhli
      </h1>

      {/* Dynamic Status / Caption */}
      <p className="text-[12px] text-[#70727a] mt-1.5 font-medium tracking-wide">
        {message}
      </p>

      {/* Minimalist Progress Hairline */}
      <div className="w-24 h-[2px] bg-white/[0.06] rounded-full overflow-hidden mt-6">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-[#E5A855] to-transparent animate-pulse" />
      </div>
    </div>
  );
};

export default SplashScreen;
