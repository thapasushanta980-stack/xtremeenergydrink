export type Ingredient = 'ice' | 'orange' | 'berry';

export interface Flavour {
  id: string;
  index: string;
  name: [string, string];
  note: string;
  desc: string;
  base: string;
  accent: string;
  glow: string;
  ingredient: Ingredient;
}

// One product, one can. The showcase offers pack formats of the Classic 330 ml; no flavours are invented.
const classic = { base: '#2b3a9e', accent: '#f6c026', glow: '60,80,230', ingredient: 'ice' as Ingredient };

export const FLAVOURS: Flavour[] = [
  { id: 'single', index: '01', name: ['SINGLE', 'CAN'], note: 'Classic · 330 ML', desc: 'Vitalize body and mind. One ice-cold can, zero hesitation.', ...classic },
  { id: 'six', index: '02', name: ['SIX', 'PACK'], note: 'Classic · 6 × 330 ML', desc: 'Share the rush, or keep it all. Built for the long night.', ...classic },
  { id: 'case', index: '03', name: ['THE', 'CASE'], note: 'Classic · 24 × 330 ML', desc: 'Stock the squad. Gym bag, game day, road trip.', ...classic },
];

export const NAV = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#story' },
  { label: 'Energy', href: '#energy' },
  { label: 'Products', href: '#products' },
  { label: 'Nepal', href: '#nepal' },
  { label: 'Videos', href: '#community' },
  { label: 'Contact', href: '#contact' },
];

export const SOCIAL = {
  instagram: 'https://www.instagram.com/xtreme_energydrink/',
  youtube: 'https://www.youtube.com/@XTREME_ENERGYDRINK/shorts',
};

/** Real Shorts from the official channel. Thumbnails/embeds are served by YouTube. */
export interface Short {
  id: string;
  title: string;
  tag: string;
}

export const SHORTS: Short[] = [
  { id: '9ImrN7xsQm4', title: 'Get ready to be Xtreme', tag: 'CAMPAIGN' },
  { id: 'Mvzykht_pD4', title: 'Karnali Yaks × Xtreme', tag: 'TEAM' },
  { id: 'Y8p-22OdwjQ', title: 'Xtreme × Chitwan Rhinos', tag: 'TEAM' },
  { id: 'SjZCldv6vNI', title: 'Kathmandu Gorkhas × Xtreme', tag: 'TEAM' },
  { id: '_DDXsspx2Kw', title: 'Lumbini Lions × Xtreme', tag: 'TEAM' },
  { id: '2AyuC8YpQ4M', title: 'Biratnagar Kings × Xtreme', tag: 'TEAM' },
  { id: 'p4mPoBwM9oY', title: 'Janakpur Bolts × Xtreme', tag: 'TEAM' },
  { id: 'jPFVFc9xBe0', title: 'Journey across Nepal', tag: 'JOURNEY' },
  { id: 'itBI5j48yBM', title: 'Lucky draw: win a gold football', tag: 'PROMO' },
];

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/oar2.jpg`;

/** Reels published on @xtreme_energydrink. Covers live in public/media/ig/<id>.jpg; playback uses Instagram's embed. */
export const REELS = ['DeBm4E2AgH-', 'Dd6BDhlASZe', 'Dd3_hmLT5lG', 'Dd3LzjLDAWn', 'DdwW3DjvAT4', 'DdvDu5MIha3', 'DdoEqqzlbLI', 'DdnyL65MryO', 'DdljhELi0BC', 'DdjjBDAiD7H', 'DdbWqkiiHyX', 'DdWf-iOqxWo'];
export const reelCover = (id: string) => `/media/ig/${id}.jpg`;
