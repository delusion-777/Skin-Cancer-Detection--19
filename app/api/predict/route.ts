import { NextRequest, NextResponse } from "next/server"
import * as tf from "@tensorflow/tfjs-node"
import fs from "fs"
import path from "path"

// ==========================
// Load model once at startup
// ==========================
let model: tf.LayersModel | null = null
const MODEL_PATH = path.join(process.cwd(), "models", "skin_cancer_classifier_model.h5")

async function loadModel() {
  if (!model) {
    try {
      model = await tf.loadLayersModel("file://" + MODEL_PATH)
      console.log("✅ Model loaded successfully")
    } catch (err) {
      console.error("❌ Failed to load model:", err)
    }
  }
  return model
}

// ==========================
// Classes from your dataset
// ==========================
// Reads class names from folder ABC/Train
const TRAIN_DIR = path.join(process.cwd(), "ABC", "Train")
const classNames = fs
  .readdirSync(TRAIN_DIR, { withFileTypes: true })
  .filter((dir) => dir.isDirectory())
  .map((dir) => dir.name)

console.log("Classes:", classNames)

// ==========================
// Preprocess Image
// ==========================
async function preprocessImage(base64Image: string) {
  // Remove "data:image..." prefix if present
  if (base64Image.startsWith("data:image")) {
    base64Image = base64Image.split(",")[1]
  }

  const buffer = Buffer.from(base64Image, "base64")
  const imageTensor = tf.node.decodeImage(buffer, 3) // force RGB
  const resized = tf.image.resizeBilinear(imageTensor, [180, 180]) // match training size
  const normalized = resized.div(255.0).expandDims(0) // [1, 180, 180, 3]

  return normalized
}

// ==========================
// API Route: POST /predict
// ==========================
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Load model
    const mdl = await loadModel()
    if (!mdl) {
      return NextResponse.json({ error: "Model not available" }, { status: 500 })
    }

    // Preprocess
    const tensor = await preprocessImage(image)

    // Predict
    const predictions = mdl.predict(tensor) as tf.Tensor
    const values = await predictions.data()
    const predictedIndex = values.indexOf(Math.max(...values))
    const confidence = Math.max(...values) * 100
    const predictedClass = classNames[predictedIndex]

    // Response
    return NextResponse.json({
      diagnosis: predictedClass,
      confidence: confidence.toFixed(2),
      classes: classNames,
    })
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
