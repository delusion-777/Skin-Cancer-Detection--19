"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, User, Camera, Brain, RotateCcw, Home, CheckCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"

type Step = "info" | "upload" | "predict" | "result"

interface PatientInfo {
  name: string
  age: string
}

interface PredictionResult {
  confidence: number
  diagnosis: string
  recommendation: string
  description: string
  symptoms: string
  riskFactors: string
  treatment: string
  urgency: string
}

export default function SkinCancerDetection() {
  const [currentStep, setCurrentStep] = useState<Step>("info")
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ name: "", age: "" })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [analysisController, setAnalysisController] = useState<AbortController | null>(null)

  const handlePatientInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (patientInfo.name && patientInfo.age) {
      setCurrentStep("upload")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePredict = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    setCurrentStep("predict")

    const controller = new AbortController()
    setAnalysisController(controller)

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadedImage,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      setPredictionResult({
        confidence: result.confidence,
        diagnosis: result.diagnosis,
        recommendation: result.recommendation,
        description: result.description,
        symptoms: result.symptoms,
        riskFactors: result.risk_factors,
        treatment: result.treatment,
        urgency: result.urgency,
      })

      setIsAnalyzing(false)
      setCurrentStep("result")
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Analysis was stopped by user")
      } else {
        console.error("Error during prediction:", error)
        const mockResult = {
          confidence: 75,
          diagnosis: "Analysis Error",
          recommendation:
            "Unable to complete analysis. Please ensure you have a clear image and try again. If the problem persists, consult a dermatologist.",
          description: "The image analysis could not be completed due to a technical error.",
          symptoms: "N/A - Analysis incomplete",
          riskFactors: "N/A - Analysis incomplete",
          treatment: "Please try uploading the image again or consult a healthcare professional",
          urgency: "MODERATE - Try again or seek professional medical advice",
        }
        setPredictionResult(mockResult)
      }
      setIsAnalyzing(false)
      setCurrentStep("result")
    } finally {
      setAnalysisController(null)
    }
  }

  const resetToUpload = () => {
    setUploadedImage(null)
    setCurrentStep("upload")
    setPredictionResult(null)
  }

  const returnHome = () => {
    setCurrentStep("info")
    setPatientInfo({ name: "", age: "" })
    setUploadedImage(null)
    setPredictionResult(null)
  }

  const stopAnalysis = () => {
    if (analysisController) {
      analysisController.abort()
      setIsAnalyzing(false)
      setCurrentStep("upload")
      setAnalysisController(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">SkinAI Detector</h1>
              <p className="text-xs sm:text-sm text-gray-300">Advanced Skin Cancer Detection System</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {currentStep === "info" && (
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-gray-900 border-gray-700 shadow-2xl">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-white flex items-center justify-center space-x-2 text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Patient Information</span>
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Please provide your basic information to begin the analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <form onSubmit={handlePatientInfoSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base" htmlFor="name">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-black border-gray-600 text-white placeholder-gray-400 focus:border-red-500 h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base" htmlFor="age">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={patientInfo.age}
                      onChange={(e) => setPatientInfo((prev) => ({ ...prev, age: e.target.value }))}
                      required
                      min="1"
                      max="120"
                      className="bg-black border-gray-600 text-white placeholder-gray-400 focus:border-red-500 h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-10 sm:h-12 text-sm sm:text-base font-medium"
                  >
                    Continue to Image Upload
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "upload" && (
          <div className="w-full max-w-2xl mx-auto">
            <Card className="bg-gray-900 border-gray-700 shadow-2xl">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-white flex items-center justify-center space-x-2 text-lg sm:text-xl">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upload Skin Image</span>
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Patient: {patientInfo.name}, Age: {patientInfo.age}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-8 text-center bg-gray-800">
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2">Choose Skin Image</h3>
                    <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base px-2">
                      Upload a clear photo of the skin area you want to analyze
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer text-gray-300">
                      <Button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
                      >
                        Select Image
                      </Button>
                    </Label>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded skin image"
                        width={400}
                        height={300}
                        className="rounded-lg object-cover w-full h-48 sm:h-64 md:h-72"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center">
                      <Button
                        onClick={handlePredict}
                        className="bg-red-600 hover:bg-red-700 text-white h-10 sm:h-12 text-sm sm:text-base order-1"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Predict Skin Cancer
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent h-10 sm:h-12 text-sm sm:text-base order-2"
                        onClick={resetToUpload}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Upload Again
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "predict" && (
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-gray-900 border-gray-700 shadow-2xl">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-white text-lg sm:text-xl">Analyzing Image</CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Our AI is examining your skin image...
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
                <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">This may take a few moments</p>
                <Button
                  onClick={stopAnalysis}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent h-10 sm:h-12 text-sm sm:text-base"
                >
                  Stop Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "result" && predictionResult && (
          <div className="w-full max-w-6xl mx-auto">
            <Card className="bg-gray-900 border-gray-700 shadow-2xl">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-white flex items-center justify-center space-x-2 text-lg sm:text-xl">
                  {predictionResult.diagnosis === "Normal Skin" || predictionResult.diagnosis === "Benign Mole" ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  )}
                  <span>Analysis Complete</span>
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Patient: {patientInfo.name}, Age: {patientInfo.age}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="order-2 lg:order-1">
                    <Image
                      src={uploadedImage! || "/placeholder.svg"}
                      alt="Analyzed skin image"
                      width={300}
                      height={200}
                      className="rounded-lg object-cover w-full h-48 sm:h-56 md:h-64 border-2 border-red-600"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg mb-2 text-white">Diagnosis</h3>
                      <p className="text-xl sm:text-2xl font-bold text-red-400 break-words">
                        {predictionResult.diagnosis}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Confidence Level</h3>
                      <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-red-600 h-2 sm:h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${predictionResult.confidence}%` }}
                        ></div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">{predictionResult.confidence}% confidence</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Urgency Level</h3>
                      <p className="text-base sm:text-lg font-medium text-yellow-400 break-words">
                        {predictionResult.urgency}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Description</h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{predictionResult.description}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Symptoms</h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{predictionResult.symptoms}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Risk Factors</h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{predictionResult.riskFactors}</p>
                  </div>
                  <div className="bg-gray-800 border border-red-600 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Treatment Options</h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{predictionResult.treatment}</p>
                  </div>
                </div>

                <div className="bg-gray-800 border border-red-600 p-3 sm:p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">Medical Recommendation</h3>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{predictionResult.recommendation}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center pt-2">
                  <Button
                    onClick={resetToUpload}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent h-10 sm:h-12 text-sm sm:text-base order-2 sm:order-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Upload Again
                  </Button>
                  <Button
                    onClick={returnHome}
                    className="bg-red-600 hover:bg-red-700 text-white h-10 sm:h-12 text-sm sm:text-base order-1 sm:order-2"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Return Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 border-t border-gray-700 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-gray-400">
          <p className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-white">Disclaimer:</strong> This tool is for educational purposes only and should
            not replace professional medical advice. Always consult with a qualified dermatologist for proper diagnosis
            and treatment.
          </p>
        </div>
      </footer>
    </div>
  )
}
