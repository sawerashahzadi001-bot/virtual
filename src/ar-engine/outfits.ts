import beigeAbaya from "@/assets/overlays/beige-abaya.png";
import blackAbaya from "@/assets/overlays/black-abaya.png";
import greenAbaya from "@/assets/overlays/green-abaya.png";
import greyAbaya from "@/assets/overlays/grey-abaya.png";
import maroonAbaya from "@/assets/overlays/mehroon-abaya.png";
import mintGreenAbaya from "@/assets/overlays/green-abaya.png";
import mochaAbaya from "@/assets/overlays/mocha-abaya.png";
import navyBlueAbaya from "@/assets/overlays/zinc-abaya.png";
import oliveGreenAbaya from "@/assets/overlays/olive.png";

/**
 * Outfits are flat image textures rendered as a plane that follows the pose.
 * Each entry tells the renderer where the shoulders + collar sit inside the
 * source image so the plane can be aligned to the body.
 *
 *   shoulderRatio  = horizontal distance between shoulder seams / image width
 *   collarYRatio   = y position of the collar (top of shoulder line) / image height
 *   hemYRatio      = y position of the shirt hem / image height
 */
export type Outfit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  image: string;
  shoulderRatio: number;
  collarYRatio: number;
  hemYRatio: number;
  // optional per-outfit fine-tune multiplier applied to the computed scale
  scaleAdjust?: number;
};

export const OUTFITS: Outfit[] = [
  {
    id: "ar1",
    name: "Noor Beige Abaya",
    emoji: "🧕",
    color: "#bfa78e",
    image: beigeAbaya,
    shoulderRatio: 0.38,
    collarYRatio: 0.16,
    hemYRatio: 0.86,
    scaleAdjust: 1.12,
  },
  {
    id: "ar2",
    name: "Emerald Green Abaya",
    emoji: "🧕",
    color: "#3b5f4b",
    image: greenAbaya,
    shoulderRatio: 0.4,
    collarYRatio: 0.18,
    hemYRatio: 0.9,
    scaleAdjust: 1.12,
  },
  {
    id: "ar3",
    name: "Slate Grey Abaya",
    emoji: "🧕",
    color: "#6d7581",
    image: greyAbaya,
    shoulderRatio: 0.38,
    collarYRatio: 0.16,
    hemYRatio: 0.86,
    scaleAdjust: 1.12,
  },
  {
    id: "ar4",
    name: "Maroon Embroidered Abaya",
    emoji: "🧕",
    color: "#794049",
    image: maroonAbaya,
    shoulderRatio: 0.4,
    collarYRatio: 0.18,
    hemYRatio: 0.9,
    scaleAdjust: 1.12,
  },
  {
    id: "ar5",
    name: "Mocha Luxe Abaya",
    emoji: "🧕",
    color: "#8c6c56",
    image: mochaAbaya,
    shoulderRatio: 0.38,
    collarYRatio: 0.16,
    hemYRatio: 0.86,
    scaleAdjust: 1.12,
  },
  {
    id: "ar6",
    name: "Navy Elegance Abaya",
    emoji: "🧕",
    color: "#2b3f5f",
    image: navyBlueAbaya,
    shoulderRatio: 0.4,
    collarYRatio: 0.18,
    hemYRatio: 0.9,
    scaleAdjust: 1.12,
  },
  {
    id: "ar7",
    name: "Mint Garden Abaya",
    emoji: "🧕",
    color: "#7bb294",
    image: mintGreenAbaya,
    shoulderRatio: 0.38,
    collarYRatio: 0.16,
    hemYRatio: 0.86,
    scaleAdjust: 1.12,
  },
  {
    id: "ar8",
    name: "Olive Leaf Abaya",
    emoji: "🧕",
    color: "#7c8b5d",
    image: oliveGreenAbaya,
    shoulderRatio: 0.4,
    collarYRatio: 0.18,
    hemYRatio: 0.9,
    scaleAdjust: 1.12,
  },
  {
    id: "ar9",
    name: "Midnight Black Abaya",
    emoji: "🧕",
    color: "#121212",
    image: blackAbaya,
    shoulderRatio: 0.38,
    collarYRatio: 0.16,
    hemYRatio: 0.86,
    scaleAdjust: 1.12,
  },
];
