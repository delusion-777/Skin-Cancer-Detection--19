# Skin Cancer Detection Backend

This backend API integrates your TensorFlow model with the frontend application.

## Setup Instructions

1. **Install Python Dependencies**:
   \`\`\`bash
   cd backend
   pip install -r requirements.txt
   \`\`\`

2. **Add Your Trained Model**:
   - Place your `skin_cancer_classifier_model.h5` file in the `backend/` directory
   - Or run the training script: `python train_model.py`

3. **Start the Backend Server**:
   \`\`\`bash
   python app.py
   \`\`\`
   The server will run on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /predict` - Predict skin cancer from image
- `GET /classes` - Get available class names

## Model Classes

The model can detect 8 types of skin conditions:
1. Actinic keratoses
2. Basal cell carcinoma  
3. Benign keratosis-like lesions
4. Dermatofibroma
5. Melanoma
6. Melanocytic nevi
7. Squamous cell carcinoma
8. Vascular lesions

## Usage

Send a POST request to `/predict` with JSON body:
\`\`\`json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
\`\`\`

The API will return detailed medical information including diagnosis, confidence, symptoms, risk factors, treatment options, and urgency level.
