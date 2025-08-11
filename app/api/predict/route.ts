import { type NextRequest, NextResponse } from "next/server"

// Simulated skin cancer types with detailed medical information
const skinConditions = [
  {
    diagnosis: "Melanoma",
    description:
      "Melanoma is the most serious type of skin cancer that develops in melanocytes, the cells that produce melanin. It can appear anywhere on the body and may develop from an existing mole or appear as a new dark spot.",
    symptoms:
      "Asymmetrical moles, irregular borders, color variations (brown, black, red, white, blue), diameter larger than 6mm, evolving size/shape/color, itching, bleeding, or crusting.",
    risk_factors:
      "Fair skin, history of sunburns, excessive UV exposure, family history of melanoma, multiple moles, weakened immune system, age over 50.",
    treatment:
      "Surgical excision, lymph node biopsy, immunotherapy, targeted therapy, chemotherapy, radiation therapy depending on stage and spread.",
    urgency: "HIGH - Immediate dermatologist consultation required",
    recommendation:
      "Seek immediate medical attention from a dermatologist. Early detection and treatment are crucial for the best outcomes.",
  },
  {
    diagnosis: "Basal Cell Carcinoma",
    description:
      "Basal cell carcinoma is the most common form of skin cancer, arising from basal cells in the lower part of the epidermis. It rarely spreads but can cause significant local damage if untreated.",
    symptoms:
      "Pearly or waxy bumps, flat flesh-colored or brown scar-like lesions, bleeding or scabbing sores that heal and return, pink growths with raised edges.",
    risk_factors:
      "Chronic sun exposure, fair skin, male gender, age over 50, previous skin cancer, immunosuppression, radiation exposure.",
    treatment:
      "Mohs surgery, excisional surgery, electrodesiccation and curettage, cryotherapy, topical medications, radiation therapy for inoperable cases.",
    urgency: "MODERATE - Schedule dermatologist appointment within 2-4 weeks",
    recommendation:
      "Schedule an appointment with a dermatologist for proper evaluation and treatment planning. While rarely life-threatening, prompt treatment prevents complications.",
  },
  {
    diagnosis: "Squamous Cell Carcinoma",
    description:
      "Squamous cell carcinoma develops in the squamous cells that make up the middle and outer layers of the skin. It's more aggressive than basal cell carcinoma and can spread if untreated.",
    symptoms:
      "Red, scaly patches, open sores, elevated growths with central depression, wart-like growths, sores that don't heal, rough or scaly skin.",
    risk_factors:
      "Excessive sun exposure, fair skin, history of precancerous lesions, immunosuppression, chronic wounds, HPV infection, smoking.",
    treatment:
      "Surgical excision, Mohs surgery, electrodesiccation and curettage, cryotherapy, radiation therapy, topical chemotherapy for superficial lesions.",
    urgency: "MODERATE to HIGH - Schedule dermatologist appointment within 1-2 weeks",
    recommendation:
      "Prompt dermatological evaluation is recommended as this type can spread to lymph nodes and other organs if left untreated.",
  },
  {
    diagnosis: "Actinic Keratosis",
    description:
      "Actinic keratosis is a precancerous skin condition caused by prolonged sun exposure. These rough, scaly patches can potentially develop into squamous cell carcinoma if left untreated.",
    symptoms:
      "Rough, dry, scaly patches, pink, red, or brown coloration, flat or slightly raised, sandpaper-like texture, may be tender or itchy.",
    risk_factors:
      "Fair skin, frequent sun exposure, age over 40, male gender, immunosuppression, previous skin cancer, outdoor occupation.",
    treatment:
      "Cryotherapy, topical medications (5-fluorouracil, imiquimod), photodynamic therapy, chemical peels, laser therapy, surgical removal.",
    urgency: "LOW to MODERATE - Schedule routine dermatologist appointment",
    recommendation:
      "Monitor closely and have evaluated by a dermatologist. While precancerous, early treatment prevents progression to skin cancer.",
  },
  {
    diagnosis: "Seborrheic Keratosis",
    description:
      "Seborrheic keratosis is a common, benign skin growth that appears as brown, black, or light-colored growths. They are not cancerous but can sometimes be confused with melanoma.",
    symptoms:
      "Waxy, scaly, slightly raised growths, brown, black, or tan coloration, 'stuck-on' appearance, may have a rough surface, usually painless.",
    risk_factors:
      "Age over 50, genetics, sun exposure (though not the primary cause), fair skin, family history of seborrheic keratoses.",
    treatment:
      "Usually no treatment needed, cryotherapy for cosmetic removal, shave excision, electrocautery, laser removal if desired.",
    urgency: "LOW - Routine monitoring, consult if changes occur",
    recommendation:
      "Generally benign and require no treatment. Consult a dermatologist if the growth changes in appearance, becomes irritated, or bleeds.",
  },
  {
    diagnosis: "Benign Mole (Nevus)",
    description:
      "A benign mole is a common, non-cancerous skin growth made up of melanocytes. Most people have 10-40 moles that develop during childhood and adolescence.",
    symptoms:
      "Uniform color (brown, black, or flesh-colored), symmetrical shape, smooth borders, consistent size (usually less than 6mm), stable appearance over time.",
    risk_factors:
      "Genetics, sun exposure, fair skin, family history of moles, hormonal changes during puberty or pregnancy.",
    treatment:
      "No treatment necessary for typical moles, surgical removal if cosmetically bothersome or showing changes, regular self-examination recommended.",
    urgency: "LOW - Routine self-monitoring, annual skin checks",
    recommendation:
      "Continue regular self-examination using the ABCDE rule. Consult a dermatologist if you notice any changes in size, shape, color, or texture.",
  },
  {
    diagnosis: "Normal Skin",
    description:
      "The analyzed area appears to show normal, healthy skin without any concerning features or abnormalities that would suggest skin cancer or precancerous conditions.",
    symptoms:
      "Uniform skin tone, smooth texture, no unusual growths, consistent coloration, no irregular borders or asymmetry.",
    risk_factors:
      "Continue sun protection practices, maintain healthy skin care routine, be aware of family history of skin cancer.",
    treatment: "No treatment needed. Continue regular skin self-examinations and sun protection measures.",
    urgency: "NONE - Continue routine skin care and monitoring",
    recommendation:
      "Maintain good sun protection habits, perform monthly self-skin examinations, and schedule annual dermatological check-ups as preventive care.",
  },
  {
    diagnosis: "Dermatofibroma",
    description:
      "Dermatofibroma is a common benign skin nodule composed of fibrous tissue. These firm, small bumps are usually harmless and often result from minor skin trauma.",
    symptoms:
      "Small, firm nodules, brown or reddish color, dimples when pinched, usually less than 1cm, may be slightly itchy, commonly on legs.",
    risk_factors:
      "Minor skin trauma, insect bites, previous injury to the area, more common in women, typically appears in adulthood.",
    treatment:
      "Usually no treatment needed, surgical excision if bothersome, cryotherapy, steroid injections for symptomatic relief.",
    urgency: "LOW - Routine monitoring recommended",
    recommendation:
      "Generally benign and require no treatment. Consult a dermatologist if the nodule changes significantly, becomes painful, or grows rapidly.",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Randomly select a skin condition for demonstration
    const randomCondition = skinConditions[Math.floor(Math.random() * skinConditions.length)]

    // Generate a realistic confidence score
    const confidence = Math.floor(Math.random() * 30) + 70 // 70-99%

    const response = {
      confidence,
      diagnosis: randomCondition.diagnosis,
      description: randomCondition.description,
      symptoms: randomCondition.symptoms,
      risk_factors: randomCondition.risk_factors,
      treatment: randomCondition.treatment,
      urgency: randomCondition.urgency,
      recommendation: randomCondition.recommendation,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
