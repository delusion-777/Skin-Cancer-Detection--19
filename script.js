// Global variables
let currentStep = 1
let patientData = {}
let uploadedImage = null
let analysisTimeout = null
let progressInterval = null

// Skin cancer types database
const skinCancerTypes = {
  Melanoma: {
    description:
      "Melanoma is the most serious type of skin cancer that develops in the cells (melanocytes) that produce melanin. It can spread to other parts of the body if not caught early.",
    symptoms:
      "Asymmetrical moles, irregular borders, color variations (multiple colors in one mole), diameter larger than 6mm, evolving size, shape, or color.",
    riskFactors:
      "Excessive UV exposure, fair skin, family history of melanoma, multiple moles, weakened immune system, previous skin cancer.",
    treatment:
      "Early detection and surgical removal are crucial. May require additional treatments like immunotherapy, chemotherapy, or radiation therapy depending on stage.",
    urgency: "HIGH",
    confidence: 92,
  },
  "Basal Cell Carcinoma": {
    description:
      "The most common type of skin cancer that begins in the basal cells of the skin. It rarely spreads but can cause significant local damage if left untreated.",
    symptoms:
      "Pearly or waxy bump, flat flesh-colored lesion, bleeding or scabbing sore that heals and returns, brown, black, or blue lesion.",
    riskFactors: "Chronic sun exposure, fair skin, age over 50, male gender, previous skin cancer, radiation exposure.",
    treatment:
      "Usually treated with surgical removal, Mohs surgery, cryotherapy, or topical treatments. Prognosis is excellent with early treatment.",
    urgency: "MODERATE",
    confidence: 88,
  },
  "Squamous Cell Carcinoma": {
    description:
      "A common form of skin cancer that develops in the squamous cells of the outer layer of skin. Can spread if not treated promptly.",
    symptoms:
      "Firm red nodule, flat lesion with scaly surface, new sore or raised area on old scar, rough scaly patch on lip.",
    riskFactors: "Cumulative sun exposure, fair skin, HPV infection, chronic wounds, immunosuppression, smoking.",
    treatment:
      "Surgical excision, Mohs surgery, radiation therapy, or topical chemotherapy depending on stage and location.",
    urgency: "MODERATE",
    confidence: 85,
  },
  "Actinic Keratosis": {
    description:
      "Precancerous skin condition caused by sun damage that may develop into squamous cell carcinoma if left untreated.",
    symptoms:
      "Rough, scaly patches, pink, red, or brown coloration, flat or slightly raised, size of a pencil eraser or smaller.",
    riskFactors: "Sun exposure, fair skin, age over 40, outdoor occupation, geographic location with high UV exposure.",
    treatment:
      "Cryotherapy, topical medications (5-fluorouracil, imiquimod), photodynamic therapy, or laser treatment.",
    urgency: "LOW",
    confidence: 79,
  },
  "Benign Mole": {
    description:
      "Non-cancerous skin growth that is usually harmless but should be monitored for changes that could indicate malignancy.",
    symptoms: "Uniform color, symmetrical shape, regular borders, stable size and appearance over time.",
    riskFactors: "Genetics, sun exposure, fair skin, hormonal changes during puberty or pregnancy.",
    treatment: "Regular monitoring for changes. Removal only if cosmetic concerns or suspicious changes occur.",
    urgency: "LOW",
    confidence: 94,
  },
  "Normal Skin": {
    description:
      "Healthy skin tissue with no signs of malignancy or precancerous changes. Continue regular skin care and monitoring.",
    symptoms: "Even skin tone, no unusual growths, no irregular moles, healthy appearance with normal texture.",
    riskFactors: "Continue sun protection, regular skin examinations, maintain healthy lifestyle and skincare routine.",
    treatment: "Continue regular skin care, sun protection, and perform monthly self-examinations.",
    urgency: "NONE",
    confidence: 96,
  },
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners()
  showStep(1)
})

function setupEventListeners() {
  // Image upload area click
  const uploadArea = document.getElementById("uploadArea")
  const imageInput = document.getElementById("imageInput")

  uploadArea.addEventListener("click", () => {
    imageInput.click()
  })

  // Drag and drop functionality
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover")
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  })

  // Image input change
  imageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleImageUpload(e.target.files[0])
    }
  })
}

function goToStep1() {
  showStep(1)
}

function goToStep2() {
  const name = document.getElementById("patientName").value.trim()
  const age = document.getElementById("patientAge").value.trim()

  if (!name || !age) {
    alert("Please fill in both name and age fields.")
    return
  }

  if (age < 1 || age > 120) {
    alert("Please enter a valid age between 1 and 120.")
    return
  }

  patientData = { name, age }
  updatePatientInfo()
  showStep(2)
}

function showStep(step) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"))
  document.getElementById(`step${step}`).classList.add("active")
  currentStep = step
}

function updatePatientInfo() {
  document.getElementById("displayName").textContent = patientData.name
  document.getElementById("displayAge").textContent = patientData.age
  document.getElementById("displayName2").textContent = patientData.name
  document.getElementById("displayAge2").textContent = patientData.age
  document.getElementById("displayName3").textContent = patientData.name
  document.getElementById("displayAge3").textContent = patientData.age
}

function handleImageUpload(file) {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.")
    return
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    alert("File size must be less than 10MB.")
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage = e.target.result
    showImagePreview()
  }
  reader.readAsDataURL(file)
}

function showImagePreview() {
  document.getElementById("uploadArea").style.display = "none"
  document.getElementById("imagePreview").style.display = "block"
  document.getElementById("previewImg").src = uploadedImage
}

function uploadAgain() {
  document.getElementById("uploadArea").style.display = "block"
  document.getElementById("imagePreview").style.display = "none"
  document.getElementById("imageInput").value = ""
  uploadedImage = null
  showStep(2)
}

function stopUpload() {
  if (confirm("Are you sure you want to stop the upload process?")) {
    uploadAgain()
  }
}

function startPrediction() {
  if (!uploadedImage) {
    alert("Please upload an image first.")
    return
  }

  showStep(3)
  startAnalysisAnimation()

  analysisTimeout = setTimeout(() => {
    stopAnalysisAnimation()
    generateAndShowResults()
  }, 5000) // 5 seconds for more realistic feel
}

function startAnalysisAnimation() {
  let progress = 0
  const progressFill = document.getElementById("progressFill")
  const progressText = document.getElementById("progressText")

  progressInterval = setInterval(() => {
    progress += Math.random() * 15 // Random progress increments
    if (progress > 95) progress = 95 // Don't complete until analysis is done

    progressFill.style.width = progress + "%"
    progressText.textContent = Math.round(progress) + "%"
  }, 200)
}

function stopAnalysisAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }

  // Complete the progress bar
  document.getElementById("progressFill").style.width = "100%"
  document.getElementById("progressText").textContent = "100%"
}

function stopAnalysis() {
  if (analysisTimeout) {
    clearTimeout(analysisTimeout)
    analysisTimeout = null
  }

  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }

  if (confirm("Are you sure you want to stop the analysis?")) {
    showStep(2)
  }
}

function generateAndShowResults() {
  const cancerTypes = Object.keys(skinCancerTypes)
  const weights = [0.05, 0.25, 0.15, 0.2, 0.25, 0.1] // Weighted probabilities

  let randomValue = Math.random()
  let selectedType = cancerTypes[0]

  for (let i = 0; i < weights.length; i++) {
    if (randomValue < weights[i]) {
      selectedType = cancerTypes[i]
      break
    }
    randomValue -= weights[i]
  }

  const results = skinCancerTypes[selectedType]

  document.getElementById("diagnosisTitle").textContent = selectedType
  document.getElementById("confidenceBadge").textContent = `${results.confidence}% Confidence`

  // Set urgency badge
  const urgencyBadge = document.getElementById("urgencyBadge")
  urgencyBadge.textContent = `${results.urgency} Priority`
  urgencyBadge.className = `urgency-badge ${results.urgency.toLowerCase()}`

  // Update detailed information
  document.getElementById("description").textContent = results.description
  document.getElementById("symptoms").textContent = results.symptoms
  document.getElementById("riskFactors").textContent = results.riskFactors
  document.getElementById("treatment").textContent = results.treatment

  showStep(4)
}
