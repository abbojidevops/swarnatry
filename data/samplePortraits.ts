export interface SamplePortrait {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  earringsAnchor: { left: { x: number; y: number }; right: { x: number; y: number } };
  noseAnchor: { x: number; y: number };
  foreheadAnchor: { x: number; y: number };
  neckAnchor: { x: number; y: number };
}

export const SAMPLE_PORTRAITS: SamplePortrait[] = [
  {
    id: "portrait-bridal-1",
    name: "Aaradhya (Bridal Saree)",
    subtitle: "Front-facing bridal portrait with traditional silk drape",
    url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    earringsAnchor: { left: { x: 38, y: 55 }, right: { x: 62, y: 55 } },
    noseAnchor: { x: 50, y: 53 },
    foreheadAnchor: { x: 50, y: 28 },
    neckAnchor: { x: 50, y: 76 },
  },
  {
    id: "portrait-bridal-2",
    name: "Meera (Royal Heritage)",
    subtitle: "Studio lit portrait, ideal for Chokers & Chandbalis",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    earringsAnchor: { left: { x: 34, y: 56 }, right: { x: 66, y: 56 } },
    noseAnchor: { x: 50, y: 55 },
    foreheadAnchor: { x: 50, y: 26 },
    neckAnchor: { x: 50, y: 78 },
  },
  {
    id: "portrait-bridal-3",
    name: "Kavya (Festive Gold Glow)",
    subtitle: "Warm festive makeup, ideal for Harams & Papidi Billa",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    earringsAnchor: { left: { x: 36, y: 54 }, right: { x: 64, y: 54 } },
    noseAnchor: { x: 50, y: 52 },
    foreheadAnchor: { x: 50, y: 27 },
    neckAnchor: { x: 50, y: 74 },
  },
  {
    id: "portrait-bridal-4",
    name: "Diya (Neutral Studio)",
    subtitle: "High contrast clarity for jewelry screenshot testing",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    earringsAnchor: { left: { x: 35, y: 57 }, right: { x: 65, y: 57 } },
    noseAnchor: { x: 50, y: 54 },
    foreheadAnchor: { x: 50, y: 25 },
    neckAnchor: { x: 50, y: 77 },
  },
];
