// ============================
// MetaDress AR FASHION — shared data & types
// ============================

const defaultApi = import.meta.env.DEV ? "http://localhost:5000/api" : "/api";
export const API =
  (import.meta.env.VITE_API_URL as string | undefined) ?? defaultApi;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating?: number;
  arOutfitId?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OutfitType =
  | "gown"
  | "blazer"
  | "dress"
  | "sequin"
  | "top"
  | "maxi"
  | "velvet"
  | "linen"
  | "abaya";

export interface AROutfit {
  name: string;
  color: string;
  gradient: [string, string];
  type: OutfitType;
  emoji: string;
}

const beigeAbaya = new URL("../../assets/beige abaya.jpeg", import.meta.url).href;
const blackAbaya = new URL("../../assets/black abaya.jpeg", import.meta.url).href;
const greenAbaya = new URL("../../assets/Green abaya.jpeg", import.meta.url).href;
const greyAbaya = new URL("../../assets/grey abaya.jpeg", import.meta.url).href;
const maroonAbaya = new URL("../../assets/Mehroon abaya.jpeg", import.meta.url).href;
const mintGreenAbaya = new URL("../../assets/Green abaya.jpeg", import.meta.url).href;
const mochaAbaya = new URL("../../assets/mocha abaya.jpeg", import.meta.url).href;
const navyBlueAbaya = new URL("../../assets/zinc abaya.jpeg", import.meta.url).href;
const oliveGreenAbaya = new URL("../../assets/olive.jpeg", import.meta.url).href;

export function getDemoProducts(): Product[] {
  return [
    { id: "1", name: "Noor Beige Abaya", price: 289, category: "abayas", image: beigeAbaya, rating: 4.8, arOutfitId: "ar1" },
    { id: "2", name: "Midnight Black Abaya", price: 145, category: "abayas", image: blackAbaya, rating: 4.6, arOutfitId: "ar9" },
    { id: "3", name: "Emerald Green Abaya", price: 320, category: "abayas", image: greenAbaya, rating: 4.9, arOutfitId: "ar2" },
    { id: "4", name: "Slate Grey Abaya", price: 98, category: "abayas", image: greyAbaya, rating: 4.5, arOutfitId: "ar3" },
    { id: "5", name: "Maroon Embroidered Abaya", price: 175, category: "abaya", image: maroonAbaya, rating: 4.7, arOutfitId: "ar4" },
    { id: "6", name: "Mint Garden Abaya", price: 215, category: "abayas", image: mintGreenAbaya, rating: 4.8, arOutfitId: "ar7" },
    { id: "7", name: "Mocha Luxe Abaya", price: 130, category: "abayas", image: mochaAbaya, rating: 4.4, arOutfitId: "ar5" },
    { id: "8", name: "Navy Elegance Abaya", price: 189, category: "abayas", image: navyBlueAbaya, rating: 4.7, arOutfitId: "ar6" },
    { id: "9", name: "Olive Leaf Abaya", price: 245, category: "abayas", image: oliveGreenAbaya, rating: 4.9, arOutfitId: "ar9" },
  ];
}

// Outfit definitions for AR rendering
export const AR_OUTFITS: Record<string, AROutfit> = {
  ar1: { name: "Noor Abaya", color: "#2d2530", gradient: ["#4c3d5e", "#1b1224"], type: "abaya", emoji: "🧕" },
  ar2: { name: "Silk Shalwar", color: "#5c3b5f", gradient: ["#87678f", "#422545"], type: "dress", emoji: "🥻" },
  ar3: { name: "Chiffon Abaya", color: "#8a6b8f", gradient: ["#b48fbf", "#6a3f7e"], type: "abaya", emoji: "🧕" },
  ar4: { name: "Zari Kameez", color: "#d4af37", gradient: ["#f0d060", "#b8902a"], type: "sequin", emoji: "✨" },
  ar5: { name: "Classic Abaya", color: "#3f3b45", gradient: ["#5f5965", "#21202a"], type: "abaya", emoji: "🧕" },
  ar6: { name: "Lawn Kurta", color: "#94a36f", gradient: ["#cdd59d", "#7b8b50"], type: "linen", emoji: "🌿" },
  ar7: { name: "Velvet Abaya", color: "#3b1e43", gradient: ["#6c3e82", "#2a1630"], type: "abaya", emoji: "💜" },
  ar8: { name: "Summer Kurta", color: "#f3d9bf", gradient: ["#ffe2b8", "#c9a170"], type: "linen", emoji: "☀️" },
  ar9: { name: "Embroidered Abaya", color: "#6d3f50", gradient: ["#a37b8c", "#4e2b3f"], type: "abaya", emoji: "🧕" },
};

export interface ARRingOutfit {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
}

export function getDemoARRingOutfits(): ARRingOutfit[] {
  return [
    { id: "ar1", name: "Gown", emoji: "👗", gradient: "linear-gradient(180deg,#c9a96e,#8a6a3e)" },
    { id: "ar2", name: "Blazer", emoji: "🧥", gradient: "linear-gradient(180deg,#3c3c3c,#1a1a1a)" },
    { id: "ar3", name: "Floral", emoji: "🌸", gradient: "linear-gradient(180deg,#f5c6d8,#d4729a)" },
    { id: "ar4", name: "Party", emoji: "✨", gradient: "linear-gradient(180deg,#f0d060,#b8902a)" },
    { id: "ar5", name: "Casual", emoji: "👕", gradient: "linear-gradient(180deg,#5a7ab0,#2a4a7c)" },
    { id: "ar6", name: "Boho", emoji: "🌿", gradient: "linear-gradient(180deg,#e8b090,#b07040)" },
    { id: "ar9", name: "Abaya", emoji: "🧕", gradient: "linear-gradient(180deg,#6c5a78,#2e2440)" },
  ];
}
