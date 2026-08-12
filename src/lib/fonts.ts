import { Unbounded, Golos_Text, Caveat } from "next/font/google";

export const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-unbounded",
});

export const golosText = Golos_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-golos",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});
