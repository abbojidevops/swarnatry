"use client";

import { JewelryItem } from "@/data/mockJewelryCatalog";
import { FaceAnchors } from "@/lib/faceLandmarker";

export type FaceShape = "oval" | "round" | "heart" | "square";

export interface FaceAnalysisResult {
  shape: FaceShape;
  shapeLabel: string;
  shapeTeluguLabel: string;
  lengthToWidthRatio: number;
  jawToForeheadRatio: number;
  descriptionEn: string;
  descriptionTe: string;
}

export interface SuitabilityScore {
  score: number; // 60 - 99
  rating: "perfect" | "great" | "good" | "advisory";
  tagEn: string;
  tagTe: string;
  reasonEn: string;
  reasonTe: string;
  alternativeTipEn?: string;
  alternativeTipTe?: string;
  recommendedCategory?: string;
}

/**
 * Classifies face shape from anatomical facial landmarks
 */
export function analyzeFaceShape(
  anchors: FaceAnchors,
  rawLandmarks?: Array<{ x: number; y: number; z?: number }>
): FaceAnalysisResult {
  let lengthToWidthRatio = 1.35;
  let jawToForeheadRatio = 0.85;

  if (rawLandmarks && rawLandmarks.length >= 468) {
    // 10: Top forehead, 152: Chin bottom
    const topForehead = rawLandmarks[10];
    const chin = rawLandmarks[152];
    const faceHeight = Math.hypot(chin.x - topForehead.x, chin.y - topForehead.y);

    // 234: Left cheek arch, 454: Right cheek arch
    const leftCheek = rawLandmarks[234] || rawLandmarks[177];
    const rightCheek = rawLandmarks[454] || rawLandmarks[401];
    const faceWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);

    // 103, 332: Temples / Forehead width
    const leftTemple = rawLandmarks[103] || rawLandmarks[54];
    const rightTemple = rawLandmarks[332] || rawLandmarks[284];
    const foreheadWidth = Math.hypot(rightTemple.x - leftTemple.x, rightTemple.y - leftTemple.y);

    // 172, 397 (or 58, 288): Jawline width
    const leftJaw = rawLandmarks[172] || rawLandmarks[58];
    const rightJaw = rawLandmarks[397] || rawLandmarks[288];
    const jawWidth = Math.hypot(rightJaw.x - leftJaw.x, rightJaw.y - leftJaw.y);

    if (faceWidth > 0) {
      lengthToWidthRatio = faceHeight / faceWidth;
    }
    if (foreheadWidth > 0) {
      jawToForeheadRatio = jawWidth / foreheadWidth;
    }
  } else if (anchors.faceWidth > 0) {
    lengthToWidthRatio = anchors.faceHeight / anchors.faceWidth;
    jawToForeheadRatio = 0.82;
  }

  // Classification Logic:
  // Round: Height and width nearly identical (< 1.25), softer jaw
  // Square: Height and width balanced (< 1.30) with wide jaw (> 0.90)
  // Heart: Forehead significantly wider than jaw (< 0.76)
  // Oval: Balanced elongation (1.30 to 1.55) with gentle taper
  let shape: FaceShape = "oval";

  if (lengthToWidthRatio < 1.24) {
    if (jawToForeheadRatio > 0.88) {
      shape = "square";
    } else {
      shape = "round";
    }
  } else if (jawToForeheadRatio < 0.76) {
    shape = "heart";
  } else if (lengthToWidthRatio > 1.48) {
    shape = "oval";
  } else {
    shape = "oval";
  }

  const descriptions: Record<
    FaceShape,
    { label: string; te: string; descEn: string; descTe: string }
  > = {
    oval: {
      label: "Oval Face",
      te: "కోల ముఖం",
      descEn: "Balanced symmetry with naturally sculpted cheekbones and graceful chin taper.",
      descTe: "సహజమైన సమతుల్యత మరియు అందమైన దవడ వంపుతో కూడిన రాజరిక రూపం.",
    },
    round: {
      label: "Round Face",
      te: "గుండ్రని ముఖం",
      descEn: "Soft curved contours with youthful cheek fullness and gentle jawline.",
      descTe: "సున్నితమైన చెంపలు మరియు ఆకర్షణీయమైన గుండ్రటి రూపం.",
    },
    heart: {
      label: "Heart / V-Shape",
      te: "వి-షేప్ ముఖం",
      descEn: "Radiant broad forehead and high cheekbones tapering to a sculpted chin.",
      descTe: "విశాలమైన నుదురు మరియు కోలగా సాగే అందమైన దవడ ఆకృతి.",
    },
    square: {
      label: "Square / Defined Jaw",
      te: "విశాల దవడ ముఖం",
      descEn: "Regal presence with strong, photogenic cheekbones and royal jaw structure.",
      descTe: "గౌరవప్రదమైన విశాల దవడ మరియు రాజసం ఉట్టిపడే ముఖ నిర్మాణం.",
    },
  };

  const meta = descriptions[shape];

  return {
    shape,
    shapeLabel: meta.label,
    shapeTeluguLabel: meta.te,
    lengthToWidthRatio: Number(lengthToWidthRatio.toFixed(2)),
    jawToForeheadRatio: Number(jawToForeheadRatio.toFixed(2)),
    descriptionEn: meta.descEn,
    descriptionTe: meta.descTe,
  };
}

/**
 * Returns a complete FaceAnalysisResult for preset sample models or manual face shape selection
 */
export function getPresetFaceAnalysis(shape: FaceShape): FaceAnalysisResult {
  const presets: Record<
    FaceShape,
    { label: string; te: string; descEn: string; descTe: string; lw: number; jf: number }
  > = {
    oval: {
      label: "Oval Face",
      te: "కోల ముఖం",
      descEn: "Balanced symmetry with naturally sculpted cheekbones and graceful chin taper.",
      descTe: "సహజమైన సమతుల్యత మరియు అందమైన దవడ వంపుతో కూడిన రాజరిక రూపం.",
      lw: 1.38,
      jf: 0.82,
    },
    round: {
      label: "Round Face",
      te: "గుండ్రని ముఖం",
      descEn: "Soft curved contours with youthful cheek fullness and gentle jawline.",
      descTe: "సున్నితమైన చెంపలు మరియు ఆకర్షణీయమైన గుండ్రటి రూపం.",
      lw: 1.18,
      jf: 0.84,
    },
    heart: {
      label: "Heart / V-Shape",
      te: "వి-షేప్ ముఖం",
      descEn: "Radiant broad forehead and high cheekbones tapering to a sculpted chin.",
      descTe: "విశాలమైన నుదురు మరియు కోలగా సాగే అందమైన దవడ ఆకృతి.",
      lw: 1.34,
      jf: 0.72,
    },
    square: {
      label: "Square / Defined Jaw",
      te: "విశాల దవడ ముఖం",
      descEn: "Regal presence with strong, photogenic cheekbones and royal jaw structure.",
      descTe: "గౌరవప్రదమైన విశాల దవడ మరియు రాజసం ఉట్టిపడే ముఖ నిర్మాణం.",
      lw: 1.20,
      jf: 0.94,
    },
  };

  const meta = presets[shape];
  return {
    shape,
    shapeLabel: meta.label,
    shapeTeluguLabel: meta.te,
    lengthToWidthRatio: meta.lw,
    jawToForeheadRatio: meta.jf,
    descriptionEn: meta.descEn,
    descriptionTe: meta.descTe,
  };
}

/**
 * Expert Goldsmith & Stylist Matching Matrix:
 * Cross-references face shape with ornament anatomy, silhouette, length, and style.
 */
export function calculateSuitability(
  item: JewelryItem,
  face: FaceAnalysisResult
): SuitabilityScore {
  const cat = item.category;
  const nameLower = (item.name + " " + (item.description || "")).toLowerCase();
  const isChoker =
    nameLower.includes("choker") ||
    nameLower.includes("kanthi") ||
    nameLower.includes("collar") ||
    nameLower.includes("hasli") ||
    item.defaultOffsetY < 28;
  const isHaram =
    nameLower.includes("haram") ||
    nameLower.includes("kasu mala") ||
    nameLower.includes("long") ||
    item.defaultOffsetY >= 30;
  const isChandbali = nameLower.includes("chandbali") || nameLower.includes("round");
  const isJhumka = nameLower.includes("jhumka") || nameLower.includes("buttalu");

  // Default fallback baseline
  let score = 92;
  let rating: SuitabilityScore["rating"] = "great";
  let reasonEn = `Complements your ${face.shapeLabel} with classic heritage proportion.`;
  let reasonTe = `మీ ${face.shapeTeluguLabel}కు ఈ ఆభరణం సాంప్రదాయబద్ధంగా చక్కగా అమరుతుంది.`;
  let tipEn: string | undefined;
  let tipTe: string | undefined;

  switch (face.shape) {
    case "round":
      if (cat === "necklaces") {
        if (isChoker) {
          score = 76;
          rating = "advisory";
          reasonEn = "Tight chokers create horizontal lines that accentuate facial roundness.";
          reasonTe = "టైట్ చోకర్లు మెడను కొద్దిగా చిన్నగా చూపించవచ్చు.";
          tipEn = "Tip: Layer this choker with a long V-shaped Kasu Haram for a slimming 96% match!";
          tipTe = "సలహా: దీనికి పొడవైన కాసుల హారాన్ని జత చేస్తే ముఖం అందంగా కనిపిస్తుంది!";
        } else if (isHaram) {
          score = 98;
          rating = "perfect";
          reasonEn = "V-drop silhouette naturally elongates the neck, creating an enchanting royal profile.";
          reasonTe = "పొడవైన V-ఆకారపు హారం ముఖాన్ని మరింత కోలగా, ఆకర్షణీయంగా చూపుతుంది.";
        } else {
          score = 94;
          rating = "great";
          reasonEn = "Graceful cascade balances softer cheek contours.";
          reasonTe = "సున్నితమైన డిజైన్ ముఖానికి చక్కని అమరికను ఇస్తుంది.";
        }
      } else if (cat === "earrings") {
        if (isChandbali) {
          score = 80;
          rating = "good";
          reasonEn = "Circular chandbalis mirror cheek fullness.";
          reasonTe = "గుండ్రని చాంద్‌బాలీల కంటే పొడవాటి ఝుంకాలు మరింత అనుకూలం.";
          tipEn = "Tip: Prefer vertical hanging jhumkas or waterfall drops for higher slimming score.";
          tipTe = "సలహా: పొడవాటి డ్రాప్స్ లేదా బుట్టలు మరింత రాజసంగా ఉంటాయి.";
        } else {
          score = 97;
          rating = "perfect";
          reasonEn = "Vertical bell drops draw the eye downward, enhancing facial elegance.";
          reasonTe = "పొడవాటి ఝుంకాలు మీ ముఖానికి సంపూర్ణ సమతుల్యతను అందిస్తాయి.";
        }
      } else if (cat === "maang-tikka") {
        score = 95;
        rating = "great";
        reasonEn = "Vertical hairline chain draws vertical symmetry down the forehead.";
        reasonTe = "పాపిడి బిళ్ళ ముఖ మధ్యభాగానికి అందమైన వెలుగునిస్తుంది.";
      }
      break;

    case "oval":
      // The universally ideal canvas
      if (isChoker) {
        score = 99;
        rating = "perfect";
        reasonEn = "Your sculptured neck and jawline carry heavy royal chokers with majestic perfection!";
        reasonTe = "మీ కోల ముఖం మరియు మెడకు భారీ రాయల్ చోకర్లు అద్భుతమైన మహారాణి శోభను తెస్తాయి!";
      } else if (isHaram) {
        score = 97;
        rating = "perfect";
        reasonEn = "Harmonious length complements your natural proportions effortlessly.";
        reasonTe = "పొడవైన హారం మీ ముఖ ఆకృతికి అత్యంత సహజంగా అమరుతుంది.";
      } else if (isChandbali || isJhumka) {
        score = 98;
        rating = "perfect";
        reasonEn = "Flawless match! Both wide chandbalis and long drops highlight your cheekbones.";
        reasonTe = "చాంద్‌బాలీలు మరియు బుట్టలు రెండూ మీ ముఖానికి పరిపూర్ణంగా సరిపోతాయి.";
      } else {
        score = 96;
        rating = "perfect";
        reasonEn = "Exceptional compatibility with your balanced facial anatomy.";
        reasonTe = "మీ ముఖ నిర్మాణానికి ఈ ఆభరణం 100% నప్పుతుంది.";
      }
      break;

    case "heart":
      if (cat === "earrings") {
        if (isChandbali || isJhumka) {
          score = 98;
          rating = "perfect";
          reasonEn = "Flares outward at the jawline, creating breathtaking symmetry with a tapered chin.";
          reasonTe = "కిందిభాగంలో వెడల్పుగా ఉండే బుట్టలు దవడ భాగాన్ని నిండుగా చూపిస్తాయి.";
        }
      } else if (cat === "necklaces") {
        if (isChoker) {
          score = 95;
          rating = "great";
          reasonEn = "Round collar contour softens pointed chin geometry.";
          reasonTe = "గుండ్రని నెక్లెస్‌లు దవడ కొనను మృదువుగా బ్యాలెన్స్ చేస్తాయి.";
        } else if (isHaram) {
          score = 91;
          rating = "great";
          reasonEn = "Graceful drape complements broad forehead contours.";
          reasonTe = "హారం యొక్క ఆకృతి అందమైన రూప లావణ్యాన్ని తెస్తుంది.";
        }
      }
      break;

    case "square":
      if (cat === "necklaces") {
        if (isChoker && !nameLower.includes("round")) {
          score = 78;
          rating = "advisory";
          reasonEn = "Rigid angular collar chokers can emphasize jaw squareness.";
          reasonTe = "వెడల్పాటి పట్టా చోకర్లు దవడను మరింత విశాలంగా చూపించవచ్చు.";
          tipEn = "Tip: Look for rounded Kundan malas or curved pearl drops that soften angular lines.";
          tipTe = "సలహా: గుండ్రని ముత్యాల హారాలు లేదా వంపు డిజైన్లు ఎంచుకోండి.";
        } else {
          score = 96;
          rating = "perfect";
          reasonEn = "Curved, circular cascade softens cheek and jaw contours gracefully.";
          reasonTe = "వంపు తిరిగిన ఆభరణాల అమరిక దవడ రూపాన్ని మృదువుగా చూపుతుంది.";
        }
      } else if (cat === "earrings") {
        if (isChandbali) {
          score = 97;
          rating = "perfect";
          reasonEn = "Circular crescent curves soften the architectural angles of the jawline.";
          reasonTe = "గుండ్రని అర్ధచంద్రాకార చాంద్‌బాలీలు ముఖానికి చక్కని మార్దవత్వాన్ని ఇస్తాయి.";
        } else {
          score = 93;
          rating = "great";
          reasonEn = "Hanging drop design adds vertical grace to regal facial structure.";
          reasonTe = "హ్యాంగింగ్ బుట్టలు ముఖ సౌందర్యాన్ని రెట్టింపు చేస్తాయి.";
        }
      }
      break;
  }

  // Generate localized tags
  let tagEn = `${score}% Match for Your Face`;
  let tagTe = `మీ ముఖానికి ${score}% మ్యాచ్`;
  if (score >= 96) {
    tagEn = `✨ ${score}% Perfect Bridal Match`;
    tagTe = `✨ ${score}% పరిపూర్ణ రాయల్ మ్యాచ్`;
  } else if (score < 80) {
    tagEn = `💡 ${score}% Styling Advisory`;
    tagTe = `💡 ${score}% స్టైలింగ్ సలహా`;
  }

  return {
    score,
    rating,
    tagEn,
    tagTe,
    reasonEn,
    reasonTe,
    alternativeTipEn: tipEn,
    alternativeTipTe: tipTe,
  };
}
