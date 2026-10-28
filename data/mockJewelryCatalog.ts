export type JewelryCategory =
  | "earrings"
  | "necklaces"
  | "nose-rings"
  | "maang-tikka"
  | "bangles"
  | "rings"
  | "vaddanam";

export type JewelryStyle =
  | "Temple"
  | "Nakshi"
  | "Kundan"
  | "Plain Gold"
  | "Antique"
  | "22K Hallmark";

export interface JewelryItem {
  id: string;
  name: string;
  teluguName?: string;
  hindiName?: string;
  category: JewelryCategory;
  categoryLabel: string;
  style: JewelryStyle;
  minGrams: number;
  maxGrams: number;
  defaultGrams: number;
  purity: "22K" | "24K" | "18K";
  wastagePercent: number;
  makingChargePerGram: number;
  stoneWeightGrams?: number; // Stone deduction
  stoneCostFlat?: number; // Flat gemstone charges
  description: string;
  craftsmanshipNote: string;
  gemstones: string;
  anchorType: "earrings" | "necklace" | "nose" | "forehead" | "wrist" | "waist";
  // AR Transform Defaults
  defaultScale: number;
  defaultOffsetY: number;
  defaultOffsetX: number;
  aspectRatio: number; // width / height
  svgContent: string; // Scalable vector graphic or transparent PNG data URI
  isCustom?: boolean; // Flag if created in Admin Studio
  isSingleEarring?: boolean; // Mirror pair automatically
  createdAt?: string;
}

// Helper to encode SVG or return clean Data URI
export function svgToDataUri(svgOrUri: string): string {
  if (
    svgOrUri.startsWith("data:image/") ||
    svgOrUri.startsWith("http://") ||
    svgOrUri.startsWith("https://")
  ) {
    return svgOrUri;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgOrUri.trim())}`;
}

export function getJewelryImageUri(item: JewelryItem): string {
  return svgToDataUri(item.svgContent);
}

export const MOCK_JEWELRY_CATALOG: JewelryItem[] = [
  // 1. Padmavathi Nakshi Grand Haram (Necklaces)
  {
    id: "SW-HRM-104",
    name: "Padmavathi Nakshi Royal Haram",
    teluguName: "పద్మావతి నక్షి పెద్ద హారం",
    hindiName: "पद्मावती नक्शी भव्य हार",
    category: "necklaces",
    categoryLabel: "Necklaces (Harams)",
    style: "Nakshi",
    minGrams: 48,
    maxGrams: 72,
    defaultGrams: 56,
    purity: "22K",
    wastagePercent: 14.5,
    makingChargePerGram: 480,
    stoneWeightGrams: 2.5,
    stoneCostFlat: 4500,
    description: "Masterpiece bridal haram handcrafted by senior goldsmiths featuring embossed Gajalakshmi center medallion, flanked by sculpted peacocks and cascading Basra pearl droplets.",
    craftsmanshipNote: "Solid 22K die-cast with hand-chiseled Nakshi embossing. Gram weight variation adjusts the thickness of the floral side-mesh and size of the Lakshmi pendant.",
    gemstones: "Burmese Pigeon Blood Rubies (1.8 cts), South Sea Natural Pearls, Emerald Accents",
    anchorType: "necklace",
    defaultScale: 1.15,
    defaultOffsetY: 40,
    defaultOffsetX: 0,
    aspectRatio: 1.1,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
      <defs>
        <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF5C2" />
          <stop offset="35%" stop-color="#E5C158" />
          <stop offset="70%" stop-color="#C59B27" />
          <stop offset="100%" stop-color="#7A560B" />
        </linearGradient>
        <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F25875" />
          <stop offset="60%" stop-color="#A6122D" />
          <stop offset="100%" stop-color="#5E0617" />
        </linearGradient>
        <radialGradient id="pearlGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="70%" stop-color="#EBE3D5" />
          <stop offset="100%" stop-color="#A89E8D" />
        </radialGradient>
        <filter id="goldGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#goldGlow)">
        <path d="M 60 70 C 90 280, 410 280, 440 70" fill="none" stroke="url(#goldGrad1)" stroke-width="14" stroke-linecap="round" />
        <path d="M 80 85 C 110 260, 390 260, 420 85" fill="none" stroke="#684A07" stroke-width="2" stroke-dasharray="4 6" />
        <path d="M 95 95 C 120 235, 380 235, 405 95" fill="none" stroke="url(#goldGrad1)" stroke-width="8" />
        <g fill="url(#goldGrad1)" stroke="#8A630A" stroke-width="1.5">
          <circle cx="120" cy="180" r="10" />
          <circle cx="145" cy="215" r="11" />
          <circle cx="175" cy="242" r="12" />
          <circle cx="210" cy="260" r="13" />
          <circle cx="290" cy="260" r="13" />
          <circle cx="325" cy="242" r="12" />
          <circle cx="355" cy="215" r="11" />
          <circle cx="380" cy="180" r="10" />
        </g>
        <g fill="url(#rubyGrad)">
          <circle cx="120" cy="180" r="4.5" />
          <circle cx="145" cy="215" r="5" />
          <circle cx="175" cy="242" r="5.5" />
          <circle cx="210" cy="260" r="6" />
          <circle cx="290" cy="260" r="6" />
          <circle cx="325" cy="242" r="5.5" />
          <circle cx="355" cy="215" r="5" />
          <circle cx="380" cy="180" r="4.5" />
        </g>
        <g fill="url(#pearlGrad)">
          <circle cx="120" cy="198" r="5" />
          <circle cx="145" cy="235" r="5.5" />
          <circle cx="175" cy="265" r="6" />
          <circle cx="210" cy="285" r="6.5" />
          <circle cx="290" cy="285" r="6.5" />
          <circle cx="325" cy="265" r="6" />
          <circle cx="355" cy="235" r="5.5" />
          <circle cx="380" cy="198" r="5" />
        </g>
        <g transform="translate(250, 290)">
          <path d="M -55 -20 C -55 -60, 55 -60, 55 -20 C 65 15, 30 55, 0 65 C -30 55, -65 15, -55 -20 Z" fill="url(#goldGrad1)" stroke="#593E07" stroke-width="2.5" />
          <ellipse cx="0" cy="10" rx="36" ry="32" fill="#5E0B19" stroke="url(#goldGrad1)" stroke-width="2" />
          <circle cx="0" cy="-2" r="8" fill="url(#goldGrad1)" />
          <path d="M -16 26 C -14 12, 14 12, 16 26 Z" fill="url(#goldGrad1)" />
          <path d="M -22 18 C -18 6, -10 10, -8 18" stroke="url(#goldGrad1)" stroke-width="3" fill="none" />
          <path d="M 22 18 C 18 6, 10 10, 8 18" stroke="url(#goldGrad1)" stroke-width="3" fill="none" />
          <circle cx="-38" cy="8" r="4.5" fill="#0E5C42" />
          <circle cx="38" cy="8" r="4.5" fill="#0E5C42" />
          <circle cx="-25" cy="-28" r="4" fill="url(#rubyGrad)" />
          <circle cx="25" cy="-28" r="4" fill="url(#rubyGrad)" />
          <circle cx="0" cy="-35" r="5" fill="url(#rubyGrad)" />
          <line x1="-30" y1="50" x2="-30" y2="72" stroke="url(#goldGrad1)" stroke-width="2" />
          <circle cx="-30" cy="78" r="6" fill="url(#pearlGrad)" />
          <line x1="0" y1="65" x2="0" y2="92" stroke="url(#goldGrad1)" stroke-width="2.5" />
          <circle cx="0" cy="100" r="8" fill="url(#pearlGrad)" />
          <line x1="30" y1="50" x2="30" y2="72" stroke="url(#goldGrad1)" stroke-width="2" />
          <circle cx="30" cy="78" r="6" fill="url(#pearlGrad)" />
        </g>
      </g>
    </svg>`,
  },

  // 2. Mayura Temple Choker (Necklaces)
  {
    id: "SW-CHK-108",
    name: "Mayura Heritage Temple Choker",
    teluguName: "మయూర టెంపుల్ చోకర్",
    hindiName: "मयूरा हेरिटेज टेम्पल चोकर",
    category: "necklaces",
    categoryLabel: "Necklaces (Chokers)",
    style: "Temple",
    minGrams: 28,
    maxGrams: 42,
    defaultGrams: 34,
    purity: "22K",
    wastagePercent: 12.0,
    makingChargePerGram: 450,
    stoneWeightGrams: 1.8,
    stoneCostFlat: 3200,
    description: "Regal close-fit choker designed with twin dancing peacocks facing an emerald cabochon, framed by delicate mesh filigree and suspended golden ghungroos.",
    craftsmanshipNote: "Reinforced flexi-backplate for snug collarbone contouring. Suitable for high neck silk bridal sarees and lehengas.",
    gemstones: "Zambian Emerald Cabochon, Polki Cut Stones, Ruby Beads",
    anchorType: "necklace",
    defaultScale: 0.98,
    defaultOffsetY: 15,
    defaultOffsetX: 0,
    aspectRatio: 1.25,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 280" width="100%" height="100%">
      <defs>
        <linearGradient id="chokerGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFBE3" />
          <stop offset="30%" stop-color="#ECC657" />
          <stop offset="70%" stop-color="#C2941F" />
          <stop offset="100%" stop-color="#73510A" />
        </linearGradient>
        <radialGradient id="emeraldGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#34D399" />
          <stop offset="50%" stop-color="#059669" />
          <stop offset="100%" stop-color="#064E3B" />
        </radialGradient>
        <radialGradient id="rubyGlow" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF758F" />
          <stop offset="60%" stop-color="#C9184A" />
          <stop offset="100%" stop-color="#590D22" />
        </radialGradient>
        <filter id="chokerDrop" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.55"/>
        </filter>
      </defs>
      <g filter="url(#chokerDrop)">
        <path d="M 60 70 C 140 130, 320 130, 400 70" fill="none" stroke="url(#chokerGold)" stroke-width="14" stroke-linecap="round" />
        <path d="M 68 85 C 145 145, 315 145, 392 85" fill="none" stroke="url(#chokerGold)" stroke-width="8" stroke-linecap="round" />
        <g stroke="url(#chokerGold)" stroke-width="3">
          <line x1="110" y1="84" x2="114" y2="99" />
          <line x1="150" y1="98" x2="153" y2="113" />
          <line x1="190" y1="108" x2="192" y2="123" />
          <line x1="230" y1="111" x2="230" y2="126" />
          <line x1="270" y1="108" x2="268" y2="123" />
          <line x1="310" y1="98" x2="307" y2="113" />
          <line x1="350" y1="84" x2="346" y2="99" />
        </g>
        <circle cx="112" cy="91" r="3.5" fill="url(#rubyGlow)" />
        <circle cx="151" cy="105" r="3.5" fill="url(#emeraldGrad)" />
        <circle cx="191" cy="115" r="4" fill="url(#rubyGlow)" />
        <circle cx="269" cy="115" r="4" fill="url(#rubyGlow)" />
        <circle cx="308" cy="105" r="3.5" fill="url(#emeraldGrad)" />
        <circle cx="348" cy="91" r="3.5" fill="url(#rubyGlow)" />
        <g transform="translate(230, 135)">
          <path d="M -40 -10 C -40 -35, 40 -35, 40 -10 C 45 25, 20 48, 0 55 C -20 48, -45 25, -40 -10 Z" fill="url(#chokerGold)" stroke="#684807" stroke-width="2" />
          <ellipse cx="0" cy="12" rx="14" ry="18" fill="url(#emeraldGrad)" stroke="#FFE89E" stroke-width="1.5" />
          <path d="M -24 4 C -20 -15, -10 -15, -6 -5" stroke="url(#chokerGold)" stroke-width="3" fill="none" />
          <circle cx="-24" cy="5" r="3" fill="url(#rubyGlow)" />
          <path d="M 24 4 C 20 -15, 10 -15, 6 -5" stroke="url(#chokerGold)" stroke-width="3" fill="none" />
          <circle cx="24" cy="5" r="3" fill="url(#rubyGlow)" />
          <g fill="url(#chokerGold)" stroke="#6B4D08" stroke-width="1">
            <circle cx="-25" cy="58" r="4.5" />
            <circle cx="-12" cy="65" r="5" />
            <circle cx="0" cy="72" r="6" />
            <circle cx="12" cy="65" r="5" />
            <circle cx="25" cy="58" r="4.5" />
          </g>
        </g>
      </g>
    </svg>`,
  },

  // 3. Kalyani Antique Bell Jhumkas (Earrings)
  {
    id: "SW-JHM-201",
    name: "Kalyani Antique Bell Jhumkas",
    teluguName: "కళ్యాణి సాంప్రదాయ జుంకాలు",
    hindiName: "कल्याणी पारम्परिक झुमके",
    category: "earrings",
    categoryLabel: "Earrings (Jhumkas)",
    style: "Nakshi",
    minGrams: 16,
    maxGrams: 26,
    defaultGrams: 20,
    purity: "22K",
    wastagePercent: 13.0,
    makingChargePerGram: 460,
    stoneWeightGrams: 1.2,
    stoneCostFlat: 1800,
    description: "Iconic three-tier South Indian bell jhumkas with floral ruby studs, antique matte nakshi dome, and swinging pearl fringe that catches light with every step.",
    craftsmanshipNote: "Crafted with screw-back and support hook (mati/kaan chain) provision to support heavy earlobe comfort across long bridal functions.",
    gemstones: "Natural Rice Pearls, Uncut Oval Rubies, Emerald accents",
    anchorType: "earrings",
    defaultScale: 0.85,
    defaultOffsetY: -5,
    defaultOffsetX: 0,
    aspectRatio: 0.55,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 360" width="100%" height="100%">
      <defs>
        <linearGradient id="jhumkaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF6CC" />
          <stop offset="40%" stop-color="#E2BE51" />
          <stop offset="80%" stop-color="#B88A1A" />
          <stop offset="100%" stop-color="#6E4D07" />
        </linearGradient>
        <radialGradient id="rubyStud" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF5C7A" />
          <stop offset="60%" stop-color="#B31232" />
          <stop offset="100%" stop-color="#540716" />
        </radialGradient>
        <radialGradient id="smallPearl" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="70%" stop-color="#EDE6D8" />
          <stop offset="100%" stop-color="#9C907C" />
        </radialGradient>
        <filter id="jhumkaShadow" x="-20%" y="-15%" width="140%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#jhumkaShadow)">
        <g transform="translate(100, 50)">
          <circle cx="0" cy="-22" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="19" cy="-11" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="19" cy="11" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="0" cy="22" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="-19" cy="11" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="-19" cy="-11" r="10" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <circle cx="0" cy="0" r="14" fill="url(#rubyStud)" stroke="#FFEAA7" stroke-width="2" />
        </g>
        <rect x="96" y="80" width="8" height="24" rx="4" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
        <g transform="translate(100, 105)">
          <ellipse cx="0" cy="5" rx="18" ry="7" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="1.5" />
          <path d="M -55 75 C -55 15, 55 15, 55 75 Z" fill="url(#jhumkaGold)" stroke="#684906" stroke-width="2" />
          <path d="M -35 75 C -35 30, 35 30, 35 75" fill="none" stroke="#946C0F" stroke-width="2" stroke-dasharray="3 4" />
          <path d="M -20 75 C -20 40, 20 40, 20 75" fill="none" stroke="#684906" stroke-width="2" />
          <ellipse cx="0" cy="75" rx="55" ry="12" fill="url(#jhumkaGold)" stroke="#593E07" stroke-width="2" />
          <circle cx="-40" cy="75" r="3.5" fill="url(#rubyStud)" />
          <circle cx="-20" cy="77" r="3.5" fill="#0E5C42" />
          <circle cx="0" cy="78" r="4" fill="url(#rubyStud)" />
          <circle cx="20" cy="77" r="3.5" fill="#0E5C42" />
          <circle cx="40" cy="75" r="3.5" fill="url(#rubyStud)" />
          <g>
            <line x1="-48" y1="84" x2="-48" y2="105" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="-48" cy="111" r="5" fill="url(#smallPearl)" />
            <line x1="-32" y1="87" x2="-32" y2="114" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="-32" cy="120" r="5.5" fill="url(#smallPearl)" />
            <line x1="-16" y1="89" x2="-16" y2="120" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="-16" cy="126" r="6" fill="url(#smallPearl)" />
            <line x1="0" y1="90" x2="0" y2="126" stroke="url(#jhumkaGold)" stroke-width="2" />
            <circle cx="0" cy="134" r="7" fill="url(#smallPearl)" />
            <line x1="16" y1="89" x2="16" y2="120" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="16" cy="126" r="6" fill="url(#smallPearl)" />
            <line x1="32" y1="87" x2="32" y2="114" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="32" cy="120" r="5.5" fill="url(#smallPearl)" />
            <line x1="48" y1="84" x2="48" y2="105" stroke="url(#jhumkaGold)" stroke-width="1.5" />
            <circle cx="48" cy="111" r="5" fill="url(#smallPearl)" />
          </g>
        </g>
      </g>
    </svg>`,
  },

  // 4. Kundan Chandbali Earring (Earrings)
  {
    id: "SW-BAL-208",
    name: "Rajputana Polki Kundan Chandbali",
    teluguName: "రాజపుతానా చాంద్‌బాలి కమ్మలు",
    hindiName: "राजपूताना पोलकी कुंदन चांदबाली",
    category: "earrings",
    categoryLabel: "Earrings (Chandbalis)",
    style: "Kundan",
    minGrams: 22,
    maxGrams: 34,
    defaultGrams: 26,
    purity: "22K",
    wastagePercent: 15.0,
    makingChargePerGram: 520,
    stoneWeightGrams: 3.5,
    stoneCostFlat: 6800,
    description: "Crescent moon-shaped bridal chandbali set with jadau polki kundan gemstones, red meenakari enamel on reverse, and seed pearl cluster ladi.",
    craftsmanshipNote: "Pure 24K gold foil (daak) packing under uncut stones gives brilliant candlelight luminescence.",
    gemstones: "Polki Jadau Kundan, Hand-beaded Seed Pearls, Green Enamel",
    anchorType: "earrings",
    defaultScale: 0.9,
    defaultOffsetY: -5,
    defaultOffsetX: 0,
    aspectRatio: 0.65,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" width="100%" height="100%">
      <defs>
        <linearGradient id="kundanGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF8D6" />
          <stop offset="45%" stop-color="#DFBA4E" />
          <stop offset="85%" stop-color="#AC7E15" />
          <stop offset="100%" stop-color="#614406" />
        </linearGradient>
        <radialGradient id="polkiStone" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="60%" stop-color="#F2EFE9" />
          <stop offset="100%" stop-color="#D1C8B4" />
        </radialGradient>
        <filter id="baliShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#baliShadow)">
        <g transform="translate(120, 50)">
          <ellipse cx="0" cy="0" rx="28" ry="24" fill="url(#kundanGold)" stroke="#5B3E05" stroke-width="1.5" />
          <ellipse cx="0" cy="0" rx="18" ry="14" fill="url(#polkiStone)" stroke="#E5C158" stroke-width="1.5" />
          <circle cx="0" cy="0" r="5" fill="#8E182A" />
        </g>
        <circle cx="120" cy="85" r="5" fill="url(#kundanGold)" />
        <g transform="translate(120, 190)">
          <path d="M 0 -80 C 85 -80, 85 65, 0 85 C -85 65, -85 -80, 0 -80 Z" fill="url(#kundanGold)" stroke="#5B3E05" stroke-width="2" />
          <path d="M 0 -62 C 60 -62, 60 40, 0 52 C -60 40, -60 -62, 0 -62 Z" fill="#0B0B0E" opacity="0.9" />
          <ellipse cx="-48" cy="-5" rx="8" ry="10" fill="url(#polkiStone)" stroke="url(#kundanGold)" stroke-width="1.5" />
          <ellipse cx="-32" cy="30" rx="9" ry="11" fill="url(#polkiStone)" stroke="url(#kundanGold)" stroke-width="1.5" />
          <ellipse cx="0" cy="46" rx="10" ry="12" fill="url(#polkiStone)" stroke="url(#kundanGold)" stroke-width="1.5" />
          <ellipse cx="32" cy="30" rx="9" ry="11" fill="url(#polkiStone)" stroke="url(#kundanGold)" stroke-width="1.5" />
          <ellipse cx="48" cy="-5" rx="8" ry="10" fill="url(#polkiStone)" stroke="url(#kundanGold)" stroke-width="1.5" />
          <circle cx="0" cy="-5" r="9" fill="#8E182A" stroke="url(#kundanGold)" stroke-width="1.5" />
          <circle cx="-55" cy="40" r="5.5" fill="#FAF8F5" />
          <circle cx="-35" cy="72" r="6" fill="#FAF8F5" />
          <circle cx="-18" cy="90" r="6.5" fill="#FAF8F5" />
          <circle cx="0" cy="98" r="7.5" fill="#FAF8F5" />
          <circle cx="18" cy="90" r="6.5" fill="#FAF8F5" />
          <circle cx="35" cy="72" r="6" fill="#FAF8F5" />
          <circle cx="55" cy="40" r="5.5" fill="#FAF8F5" />
        </g>
      </g>
    </svg>`,
  },

  // 5. Chandramukhi Polki Papidi Billa / Maang Tikka
  {
    id: "SW-TIK-301",
    name: "Chandramukhi Polki Papidi Billa",
    teluguName: "చంద్రముఖి పాపిడి బిళ్ళ / మాంగ్ టిక్కా",
    hindiName: "चंद्रमुखी पोलकी मांग टीका",
    category: "maang-tikka",
    categoryLabel: "Maang Tikka (Papidi Billa)",
    style: "Kundan",
    minGrams: 12,
    maxGrams: 20,
    defaultGrams: 15,
    purity: "22K",
    wastagePercent: 12.5,
    makingChargePerGram: 460,
    stoneWeightGrams: 1.5,
    stoneCostFlat: 2500,
    description: "Bridal forehead ornament with delicately linked gold chain (chainka) and an ornate medallion inset with royal polki stones and teardrop emerald.",
    craftsmanshipNote: "Specially calibrated hair hook anchor and anti-slip silicone lined back to sit seamlessly flush against bridal hairline.",
    gemstones: "Polki Diamonds, Emerald Drop, Basra Seed Pearls",
    anchorType: "forehead",
    defaultScale: 0.9,
    defaultOffsetY: -35,
    defaultOffsetX: 0,
    aspectRatio: 0.45,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 360" width="100%" height="100%">
      <defs>
        <linearGradient id="tikkaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF8DC" />
          <stop offset="40%" stop-color="#E5C158" />
          <stop offset="80%" stop-color="#B88A1A" />
          <stop offset="100%" stop-color="#6B4D06" />
        </linearGradient>
        <radialGradient id="tikkaEmerald" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#34D399" />
          <stop offset="60%" stop-color="#059669" />
          <stop offset="100%" stop-color="#064E3B" />
        </radialGradient>
        <filter id="tikkaShadow" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#tikkaShadow)">
        <path d="M 80 15 C 75 10, 85 5, 80 0" stroke="url(#tikkaGold)" stroke-width="3" fill="none" />
        <g stroke="url(#tikkaGold)" stroke-width="2.5" fill="none">
          <circle cx="80" cy="25" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="45" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="65" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="85" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="105" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="125" r="5" fill="url(#tikkaGold)" />
          <circle cx="80" cy="145" r="6" fill="#8E182A" stroke="url(#tikkaGold)" stroke-width="2" />
        </g>
        <g transform="translate(80, 220)">
          <circle cx="0" cy="0" r="46" fill="url(#tikkaGold)" stroke="#684B08" stroke-width="1.5" />
          <circle cx="0" cy="0" r="38" fill="#5E0B19" />
          <circle cx="0" cy="0" r="26" fill="url(#tikkaGold)" stroke="#FFEAA7" stroke-width="1.5" />
          <circle cx="0" cy="0" r="14" fill="#FFFFFF" opacity="0.9" />
          <circle cx="0" cy="0" r="7" fill="#8E182A" />
          <circle cx="-42" cy="-15" r="4.5" fill="#FAF8F5" />
          <circle cx="-42" cy="15" r="4.5" fill="#FAF8F5" />
          <circle cx="-25" cy="-36" r="4.5" fill="#FAF8F5" />
          <circle cx="25" cy="-36" r="4.5" fill="#FAF8F5" />
          <circle cx="42" cy="-15" r="4.5" fill="#FAF8F5" />
          <circle cx="42" cy="15" r="4.5" fill="#FAF8F5" />
          <circle cx="-25" cy="36" r="4.5" fill="#FAF8F5" />
          <circle cx="25" cy="36" r="4.5" fill="#FAF8F5" />
          <path d="M 0 52 C -15 75, -12 105, 0 115 C 12 105, 15 75, 0 52 Z" fill="url(#tikkaEmerald)" stroke="url(#tikkaGold)" stroke-width="2" />
          <circle cx="0" cy="124" r="5.5" fill="#FAF8F5" />
        </g>
      </g>
    </svg>`,
  },

  // 6. Maharashtrian Peshwai Pearl Nath (Nose Rings)
  {
    id: "SW-NTH-401",
    name: "Maharashtrian Peshwai Pearl Nath",
    teluguName: "మహారాష్ట్రీయన్ ముక్కు పుడక / నత్",
    hindiName: "महाराष्ट्रीयन पेशवाई मोती नथ",
    category: "nose-rings",
    categoryLabel: "Nose Rings (Nath)",
    style: "Plain Gold",
    minGrams: 5,
    maxGrams: 9,
    defaultGrams: 6.5,
    purity: "22K",
    wastagePercent: 11.0,
    makingChargePerGram: 420,
    stoneWeightGrams: 0.6,
    stoneCostFlat: 1100,
    description: "Classic cashew-shaped traditional Maharashtrian bridal nath studded with natural Basra pearls, ruby centerpiece, and emerald floral bud.",
    craftsmanshipNote: "Available in both non-pierced press-on clip mechanism and traditional pierced wire loop.",
    gemstones: "Natural Rice Pearls, Natural Teardrop Ruby, Emerald Bead",
    anchorType: "nose",
    defaultScale: 0.75,
    defaultOffsetY: -5,
    defaultOffsetX: 10,
    aspectRatio: 0.9,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 200" width="100%" height="100%">
      <defs>
        <linearGradient id="nathGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF9DE" />
          <stop offset="40%" stop-color="#ECC657" />
          <stop offset="85%" stop-color="#B88A1A" />
          <stop offset="100%" stop-color="#6B4D06" />
        </linearGradient>
        <radialGradient id="nathRuby" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF5C7A" />
          <stop offset="60%" stop-color="#B31232" />
          <stop offset="100%" stop-color="#540716" />
        </radialGradient>
        <filter id="nathShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.55"/>
        </filter>
      </defs>
      <g filter="url(#nathShadow)">
        <path d="M 35 75 C 20 40, 50 20, 75 35" fill="none" stroke="url(#nathGold)" stroke-width="3" stroke-linecap="round" />
        <g transform="translate(85, 95)">
          <path d="M -40 -30 C -10 -60, 50 -45, 50 15 C 50 55, -5 70, -25 50 C -45 30, -55 0, -40 -30 Z" fill="url(#nathGold)" stroke="#684B08" stroke-width="2" />
          <circle cx="-35" cy="-25" r="6" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="-15" cy="-45" r="6.5" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="15" cy="-45" r="7" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="42" cy="-25" r="7" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="50" cy="5" r="7.5" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="42" cy="35" r="7" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="20" cy="55" r="6.5" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <circle cx="-10" cy="55" r="6" fill="#FFFFFF" stroke="#D1C8B4" stroke-width="1" />
          <ellipse cx="2" cy="5" rx="14" ry="18" fill="url(#nathRuby)" stroke="#FFEAA7" stroke-width="1.5" />
          <circle cx="22" cy="5" r="5" fill="#0E5C42" />
          <circle cx="-18" cy="5" r="5" fill="#0E5C42" />
          <circle cx="10" cy="75" r="6.5" fill="#FFFFFF" />
          <circle cx="-5" cy="72" r="5.5" fill="#FFFFFF" />
        </g>
      </g>
    </svg>`,
  },

  // 7. Andhra Mukku Pudaka Single Diamond & Ruby Pin (Nose Rings)
  {
    id: "SW-PUD-408",
    name: "Andhra Mukku Pudaka Ruby Stud",
    teluguName: "ఆంధ్రా సాంప్రదాయ ముక్కు పుడక",
    hindiName: "आंध्रा मुक्कू पुडाका नोज पिन",
    category: "nose-rings",
    categoryLabel: "Nose Rings (Stud Pin)",
    style: "Plain Gold",
    minGrams: 2.2,
    maxGrams: 4.5,
    defaultGrams: 3.0,
    purity: "22K",
    wastagePercent: 10.0,
    makingChargePerGram: 380,
    stoneWeightGrams: 0.2,
    stoneCostFlat: 1500,
    description: "Traditional Telugu heritage nose flower pin featuring seven prong-set brilliant rubies encircling a diamond center, with screw-back lock.",
    craftsmanshipNote: "Ultra-light daily wear or festive wear stud designed with smooth rounded prongs that won't snag on dupattas.",
    gemstones: "Fine Natural Rubies, VVS Solitaire Center",
    anchorType: "nose",
    defaultScale: 0.5,
    defaultOffsetY: -2,
    defaultOffsetX: 8,
    aspectRatio: 1.0,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="pudakaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF9DE" />
          <stop offset="50%" stop-color="#ECC657" />
          <stop offset="100%" stop-color="#8F6A0F" />
        </linearGradient>
        <radialGradient id="pudakaRuby" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FF5C7A" />
          <stop offset="70%" stop-color="#A6122D" />
          <stop offset="100%" stop-color="#4E0513" />
        </radialGradient>
        <radialGradient id="pudakaDiamond" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="50%" stop-color="#E2F1FF" />
          <stop offset="100%" stop-color="#9BC7F5" />
        </radialGradient>
        <filter id="pudakaShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g filter="url(#pudakaShadow)" transform="translate(50, 50)">
        <circle cx="0" cy="0" r="38" fill="url(#pudakaGold)" stroke="#684B08" stroke-width="1.5" />
        <circle cx="0" cy="-22" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="19" cy="-11" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="19" cy="11" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="0" cy="22" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="-19" cy="11" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="-19" cy="-11" r="10" fill="url(#pudakaRuby)" stroke="url(#pudakaGold)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="11" fill="url(#pudakaDiamond)" stroke="#FFFFFF" stroke-width="1.5" />
        <polygon points="0,-8 7,0 0,8 -7,0" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>`,
  },

  // 8. Kasu Mala Heritage Long Necklace (Necklaces)
  {
    id: "SW-KAS-112",
    name: "Veera Kasu Mala Heritage Coin Chain",
    teluguName: "వీర కాసుల పేరు / కాసుల దండ",
    hindiName: "वीर कासू माला हेरिटेज कॉइन हार",
    category: "necklaces",
    categoryLabel: "Necklaces (Kasu Mala)",
    style: "Temple",
    minGrams: 36,
    maxGrams: 52,
    defaultGrams: 42,
    purity: "22K",
    wastagePercent: 12.0,
    makingChargePerGram: 440,
    stoneWeightGrams: 0,
    stoneCostFlat: 0,
    description: "Sacred South Indian coin necklace embossed with Goddess Lakshmi seated on a lotus on each coin, interconnected by braided gold rope with ruby floral spacer stations.",
    craftsmanshipNote: "Each coin is individually struck with crisp high-relief dies and securely soldered without stiff joints for fluid movement against silk.",
    gemstones: "Fine Cabochon Rubies, Untreated 22K Solid Gold Coins",
    anchorType: "necklace",
    defaultScale: 1.1,
    defaultOffsetY: 45,
    defaultOffsetX: 0,
    aspectRatio: 1.15,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" width="100%" height="100%">
      <defs>
        <linearGradient id="kasuGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFAD9" />
          <stop offset="35%" stop-color="#ECC657" />
          <stop offset="75%" stop-color="#B88A1A" />
          <stop offset="100%" stop-color="#6B4D06" />
        </linearGradient>
        <radialGradient id="coinFace" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFEAA7" />
          <stop offset="60%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#8F6A0F" />
        </radialGradient>
        <filter id="kasuGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#kasuGlow)">
        <path d="M 70 80 C 110 280, 370 280, 410 80" fill="none" stroke="url(#kasuGold)" stroke-width="12" stroke-linecap="round" />
        <path d="M 85 95 C 120 265, 360 265, 395 95" fill="none" stroke="#7A560B" stroke-width="2" stroke-dasharray="4 5" />
        <circle cx="105" cy="150" r="16" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="105" cy="150" r="10" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="105" cy="150" r="4" fill="#8E182A" />
        <circle cx="130" cy="185" r="17" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="130" cy="185" r="11" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="130" cy="185" r="4.5" fill="#8E182A" />
        <circle cx="160" cy="215" r="18" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="160" cy="215" r="12" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="160" cy="215" r="5" fill="#8E182A" />
        <circle cx="198" cy="238" r="19" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="198" cy="238" r="13" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="198" cy="238" r="5" fill="#8E182A" />
        <g transform="translate(240, 260)">
          <circle cx="0" cy="0" r="28" fill="url(#coinFace)" stroke="#593E07" stroke-width="2.5" />
          <circle cx="0" cy="0" r="20" fill="#5E0B19" stroke="url(#kasuGold)" stroke-width="1.5" />
          <circle cx="0" cy="-4" r="5.5" fill="url(#kasuGold)" />
          <path d="M -10 12 C -8 4, 8 4, 10 12 Z" fill="url(#kasuGold)" />
          <circle cx="-14" cy="36" r="4.5" fill="#FFFFFF" />
          <circle cx="0" cy="42" r="6" fill="#FFFFFF" />
          <circle cx="14" cy="36" r="4.5" fill="#FFFFFF" />
        </g>
        <circle cx="282" cy="238" r="19" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="282" cy="238" r="13" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="282" cy="238" r="5" fill="#8E182A" />
        <circle cx="320" cy="215" r="18" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="320" cy="215" r="12" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="320" cy="215" r="5" fill="#8E182A" />
        <circle cx="350" cy="185" r="17" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="350" cy="185" r="11" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="350" cy="185" r="4.5" fill="#8E182A" />
        <circle cx="375" cy="150" r="16" fill="url(#coinFace)" stroke="#7A560B" stroke-width="1.5" />
        <circle cx="375" cy="150" r="10" fill="none" stroke="#FFEAA7" stroke-width="1" />
        <circle cx="375" cy="150" r="4" fill="#8E182A" />
      </g>
    </svg>`,
  },

  // 9. Gajalakshmi Nakshi Royal Kada Bangles (Bangles)
  {
    id: "SW-BNG-401",
    name: "Gajalakshmi Nakshi Royal Kada Bangles",
    teluguName: "గజలక్ష్మి నక్షి రాజ కడియాలు / గాజులు",
    hindiName: "गजलक्ष्मी नक्षी रॉयल कड़ा कंगन",
    category: "bangles",
    categoryLabel: "Bangles (Kadiyalu)",
    style: "Nakshi",
    minGrams: 28,
    maxGrams: 48,
    defaultGrams: 36,
    purity: "22K",
    wastagePercent: 12.5,
    makingChargePerGram: 460,
    stoneWeightGrams: 1.2,
    stoneCostFlat: 4500,
    description: "Solid antique 22K gold kada pair featuring twin roaring Gajalakshmi lion-head terminals, hand-chiseled floral vines, and cabochon ruby accents with a screw-pipe lock.",
    craftsmanshipNote: "Crafted with internal hinge and safety screw-catch. Gram weight scales dynamically with standard Indian bangle sizes (2.2, 2.4, 2.6, 2.8, 2.10).",
    gemstones: "Natural Cabochon Rubies, Untreated 22K Solid Gold",
    anchorType: "wrist",
    defaultScale: 1.0,
    defaultOffsetY: 0,
    defaultOffsetX: 0,
    aspectRatio: 1.0,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="bangleGold" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#FFF5C2" />
          <stop offset="45%" stop-color="#D4AF37" />
          <stop offset="85%" stop-color="#8F6A0F" />
          <stop offset="100%" stop-color="#4A3403" />
        </radialGradient>
        <radialGradient id="bangleRuby" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF5277" />
          <stop offset="60%" stop-color="#9E0B2B" />
          <stop offset="100%" stop-color="#4A000E" />
        </radialGradient>
        <filter id="bangleShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
      </defs>
      <g filter="url(#bangleShadow)">
        <!-- Outer Bangle Ring -->
        <circle cx="200" cy="200" r="140" fill="none" stroke="url(#bangleGold)" stroke-width="32" stroke-linecap="round" />
        <circle cx="200" cy="200" r="156" fill="none" stroke="#5E4204" stroke-width="2" />
        <circle cx="200" cy="200" r="124" fill="none" stroke="#5E4204" stroke-width="2" />

        <!-- Intricate Nakshi Embossed Floral Beads -->
        <circle cx="200" cy="60" r="14" fill="url(#bangleRuby)" stroke="#FFEAA7" stroke-width="1.5" />
        <circle cx="200" cy="340" r="14" fill="url(#bangleRuby)" stroke="#FFEAA7" stroke-width="1.5" />
        <circle cx="60" cy="200" r="14" fill="url(#bangleRuby)" stroke="#FFEAA7" stroke-width="1.5" />
        <circle cx="340" cy="200" r="14" fill="url(#bangleRuby)" stroke="#FFEAA7" stroke-width="1.5" />

        <circle cx="100" cy="100" r="10" fill="url(#bangleGold)" stroke="#3B2801" stroke-width="1" />
        <circle cx="300" cy="100" r="10" fill="url(#bangleGold)" stroke="#3B2801" stroke-width="1" />
        <circle cx="100" cy="300" r="10" fill="url(#bangleGold)" stroke="#3B2801" stroke-width="1" />
        <circle cx="300" cy="300" r="10" fill="url(#bangleGold)" stroke="#3B2801" stroke-width="1" />

        <!-- Twin Terminal Medallion -->
        <g transform="translate(200, 50)">
          <rect x="-24" y="-12" width="48" height="24" rx="8" fill="url(#bangleGold)" stroke="#5E4204" stroke-width="2" />
          <circle cx="0" cy="0" r="8" fill="url(#bangleRuby)" />
          <circle cx="0" cy="0" r="4" fill="#FFFFFF" opacity="0.8" />
        </g>
      </g>
    </svg>`,
  },

  // 10. Navaratna Royal Emperor Signet Ring (Rings)
  {
    id: "SW-RNG-501",
    name: "Navaratna Royal Emperor Signet Ring",
    teluguName: "నవరత్న రాజముద్రిక ఉంగరం",
    hindiName: "नवरत्न राजसी अंगूठी",
    category: "rings",
    categoryLabel: "Rings (Ungaralu)",
    style: "Kundan",
    minGrams: 8,
    maxGrams: 18,
    defaultGrams: 12,
    purity: "22K",
    wastagePercent: 11.5,
    makingChargePerGram: 490,
    stoneWeightGrams: 1.5,
    stoneCostFlat: 6500,
    description: "Astrologically aligned royal Navaratna gold signet ring featuring untreated Ruby center surrounded by Diamond, Pearl, Red Coral, Emerald, Yellow Sapphire, Blue Sapphire, Hessonite, and Cat's Eye in 24K pure gold bezel settings.",
    craftsmanshipNote: "Open backplate setting ensures gemstones make authentic skin contact for astrological potency while maintaining water-tight gold prongs.",
    gemstones: "Ruby, Diamond, Pearl, Coral, Emerald, Yellow Sapphire, Blue Sapphire, Hessonite, Cat's Eye",
    anchorType: "wrist",
    defaultScale: 0.7,
    defaultOffsetY: 0,
    defaultOffsetX: 0,
    aspectRatio: 1.0,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
      <defs>
        <radialGradient id="ringBandGold" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FFF2A3" />
          <stop offset="50%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#6B4F09" />
        </radialGradient>
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#ringGlow)">
        <!-- Circular Ring Shank -->
        <ellipse cx="160" cy="210" rx="95" ry="65" fill="none" stroke="url(#ringBandGold)" stroke-width="22" />
        <ellipse cx="160" cy="210" rx="106" ry="76" fill="none" stroke="#5E4204" stroke-width="1.5" />

        <!-- Octagonal Top Crest -->
        <g transform="translate(160, 115)">
          <rect x="-55" y="-55" width="110" height="110" rx="20" fill="url(#ringBandGold)" stroke="#4A3403" stroke-width="3" />
          <rect x="-46" y="-46" width="92" height="92" rx="15" fill="#1C1405" stroke="#FFEAA7" stroke-width="1.5" />

          <!-- Center Ruby (Sun) -->
          <circle cx="0" cy="0" r="16" fill="#B91C1C" stroke="#FFEAA7" stroke-width="2" />
          <circle cx="0" cy="0" r="8" fill="#EF4444" opacity="0.8" />

          <!-- 8 Surrounding Gemstones -->
          <!-- Diamond (East) -->
          <circle cx="30" cy="0" r="9" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1" />
          <!-- Blue Sapphire (South-East) -->
          <circle cx="22" cy="22" r="9" fill="#1D4ED8" stroke="#FFEAA7" stroke-width="1" />
          <!-- Cat's Eye (South) -->
          <circle cx="0" cy="30" r="9" fill="#713F12" stroke="#FFEAA7" stroke-width="1" />
          <!-- Yellow Sapphire (South-West) -->
          <circle cx="-22" cy="22" r="9" fill="#FACC15" stroke="#FFEAA7" stroke-width="1" />
          <!-- Emerald (West) -->
          <circle cx="-30" cy="0" r="9" fill="#047857" stroke="#FFEAA7" stroke-width="1" />
          <!-- Coral (North-West) -->
          <circle cx="-22" cy="-22" r="9" fill="#EA580C" stroke="#FFEAA7" stroke-width="1" />
          <!-- Pearl (North) -->
          <circle cx="0" cy="-30" r="9" fill="#FFFBEB" stroke="#E2E8F0" stroke-width="1" />
          <!-- Hessonite (North-East) -->
          <circle cx="22" cy="-22" r="9" fill="#7C2D12" stroke="#FFEAA7" stroke-width="1" />
        </g>
      </g>
    </svg>`,
  },

  // 11. Mayura Temple Heritage Bridal Vaddanam (Waist Belt)
  {
    id: "SW-VDN-601",
    name: "Mayura Temple Heritage Bridal Vaddanam",
    teluguName: "మయూర టెంపుల్ రాజ వడ్డాణం / ఒడ్డాణం",
    hindiName: "मयूरा हेरिटेज ब्राइडल कमरबंद (वड्डाणम)",
    category: "vaddanam",
    categoryLabel: "Vaddanam (Waist Belt)",
    style: "Temple",
    minGrams: 75,
    maxGrams: 140,
    defaultGrams: 98,
    purity: "22K",
    wastagePercent: 13.5,
    makingChargePerGram: 520,
    stoneWeightGrams: 3.5,
    stoneCostFlat: 12000,
    description: "Grand royal South Indian bridal waist belt sculpted with Dancing Peacocks, Goddess Lakshmi enthroned under a five-headed Sheshanaga arch, framed by kempu rubies and swinging bell ghungroos.",
    craftsmanshipNote: "Engineered with triple-reinforcement solid links and adjustable hook extension chain to fit waist sizes from 26 inches to 40 inches comfortably.",
    gemstones: "Burmese Cabochon Rubies, Zambian Emeralds, Fresh Water Pearl Drops",
    anchorType: "waist",
    defaultScale: 1.25,
    defaultOffsetY: 90,
    defaultOffsetX: 0,
    aspectRatio: 1.8,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="100%" height="100%">
      <defs>
        <linearGradient id="vaddanamGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6E4D07" />
          <stop offset="20%" stop-color="#ECC657" />
          <stop offset="50%" stop-color="#FFF2A3" />
          <stop offset="80%" stop-color="#ECC657" />
          <stop offset="100%" stop-color="#6E4D07" />
        </linearGradient>
        <radialGradient id="vaddanamRuby" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF5277" />
          <stop offset="65%" stop-color="#9E0B2B" />
          <stop offset="100%" stop-color="#4A000E" />
        </radialGradient>
        <filter id="vaddanamGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#vaddanamGlow)">
        <!-- Belt Arc Band -->
        <path d="M 40 110 Q 300 160, 560 110" fill="none" stroke="url(#vaddanamGold)" stroke-width="26" stroke-linecap="round" />
        <path d="M 45 110 Q 300 160, 555 110" fill="none" stroke="#5E4204" stroke-width="2" stroke-dasharray="6 6" />

        <!-- Flanking Floral Stations -->
        <circle cx="120" cy="122" r="14" fill="url(#vaddanamRuby)" stroke="#FFEAA7" stroke-width="1.5" />
        <circle cx="190" cy="132" r="15" fill="url(#vaddanamGold)" stroke="#5E4204" stroke-width="2" />
        <circle cx="410" cy="132" r="15" fill="url(#vaddanamGold)" stroke="#5E4204" stroke-width="2" />
        <circle cx="480" cy="122" r="14" fill="url(#vaddanamRuby)" stroke="#FFEAA7" stroke-width="1.5" />

        <!-- Grand Central Temple Medallion -->
        <g transform="translate(300, 150)">
          <!-- Royal Arch -->
          <path d="M -60 20 C -60 -60, 60 -60, 60 20 Z" fill="url(#vaddanamGold)" stroke="#4A3403" stroke-width="3" />
          <path d="M -48 18 C -48 -45, 48 -45, 48 18 Z" fill="#6B0B1D" stroke="#FFEAA7" stroke-width="1.5" />

          <!-- Goddess Lakshmi Center Emboss -->
          <circle cx="0" cy="-14" r="14" fill="url(#vaddanamGold)" stroke="#382502" stroke-width="1.5" />
          <path d="M -16 12 C -10 -4, 10 -4, 16 12 Z" fill="url(#vaddanamGold)" />

          <!-- Flanking Peacocks -->
          <path d="M -75 -10 Q -55 -30, -50 -8 Z" fill="url(#vaddanamGold)" stroke="#382502" stroke-width="1" />
          <path d="M 75 -10 Q 55 -30, 50 -8 Z" fill="url(#vaddanamGold)" stroke="#382502" stroke-width="1" />

          <!-- Hanging Pearl & Golden Jhumki Ghungroos -->
          <circle cx="-36" cy="36" r="6" fill="#FFFDF2" stroke="#D4AF37" stroke-width="1" />
          <circle cx="-18" cy="42" r="7" fill="#FFFDF2" stroke="#D4AF37" stroke-width="1" />
          <circle cx="0" cy="48" r="9" fill="url(#vaddanamRuby)" stroke="#FFEAA7" stroke-width="1.5" />
          <circle cx="18" cy="42" r="7" fill="#FFFDF2" stroke="#D4AF37" stroke-width="1" />
          <circle cx="36" cy="36" r="6" fill="#FFFDF2" stroke="#D4AF37" stroke-width="1" />
        </g>
      </g>
    </svg>`,
  },
];
