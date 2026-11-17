"use client";
import { signIn } from "next-auth/react";

function DiscordGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M6.5 5h11A3.500 3.500 0 0 1 21 8.500v6a3.500 3.500 0 0 1-3.500 3.500H15l-1.500 2h-3L9 18H6.500A3.500 3.500 0 0 1 3 14.500v-6A3.500 3.500 0 0 1 6.500 5Zm2.800 5a1.500 1.700 0 1 0 0 3.400 1.500 1.700 0 0 0 0-3.400Zm5.400 0a1.500 1.700 0 1 0 0 3.400 1.500 1.700 0 0 0 0-3.400Z" />
    </svg>
  );
}

export function DiscordLoginButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/" })}
      className="btn mt-5 flex w-full items-center justify-center gap-2 bg-[#5865f2] py-3 text-base text-white hover:bg-[#4752c4]"
    >
      <DiscordGlyph /> Continuă cu Discord
    </button>
  );
}
