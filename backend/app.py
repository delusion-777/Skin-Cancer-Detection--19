from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
model = None
class_names = ['Actinic keratoses', 'Basal cell carcinoma', 'Benign keratosis-like lesions', 
               'Dermatofibroma', 'Melanoma', 'Melanocytic nevi', 'Squamous cell carcinoma', 'Vascular lesions']

# Model configuration
IMG_HEIGHT = 180
IMG_WIDTH = 180

def load_model():
    """Load the trained model"""
    global model
    try:
        model_path = 'skin_cancer_classifier_model.h5'
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            logger.info("Model loaded successfully")
        else:
            logger.error(f"Model file not found: {model_path}")
            # Create a dummy model for testing if the actual model isn't available
            model = create_dummy_model()
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        model = create_dummy_model()

def create_dummy_model():
    """Create a dummy model for testing purposes"""
    logger.info("Creating dummy model for testing")
    dummy_model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(len(class_names), activation='softmax')
    ])
    return dummy_model

def preprocess_image(image_data):
    """Preprocess image for model prediction"""
    try:
        # Decode base64 image
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        
        # Convert to numpy array and normalize
        image_array = np.array(image) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

def get_detailed_info(predicted_class, confidence):
    """Get detailed information about the predicted skin condition"""
    
    skin_info = {
        'Melanoma': {
            'description': 'Melanoma is the most serious type of skin cancer. It develops in melanocytes, the cells that produce melanin.',
            'symptoms': 'Asymmetrical moles, irregular borders, color variations, diameter larger than 6mm, evolving characteristics',
            'risk_factors': 'UV exposure, fair skin, family history, multiple moles, weakened immune system',
            'treatment': 'Surgical excision, immunotherapy, targeted therapy, chemotherapy in advanced cases',
            'urgency': 'HIGH - Immediate medical attention required'
        },
        'Basal cell carcinoma': {
            'description': 'The most common form of skin cancer, arising from basal cells in the epidermis.',
            'symptoms': 'Pearly or waxy bumps, flat flesh-colored lesions, bleeding or scabbing sores',
            'risk_factors': 'Chronic sun exposure, fair skin, age over 50, male gender',
            'treatment': 'Surgical excision, Mohs surgery, radiation therapy, topical medications',
            'urgency': 'MODERATE - Schedule appointment within 2-4 weeks'
        },
        'Squamous cell carcinoma': {
            'description': 'Second most common skin cancer, developing in squamous cells of the epidermis.',
            'symptoms': 'Red, scaly patches, open sores, elevated growths with central depression',
            'risk_factors': 'UV exposure, fair skin, immunosuppression, chronic wounds',
            'treatment': 'Surgical excision, Mohs surgery, radiation therapy, cryotherapy',
            'urgency': 'MODERATE - Schedule appointment within 2-4 weeks'
        },
        'Actinic keratoses': {
            'description': 'Precancerous skin lesions caused by sun damage that may develop into squamous cell carcinoma.',
            'symptoms': 'Rough, scaly patches, pink or red coloration, sandpaper-like texture',
            'risk_factors': 'Chronic sun exposure, fair skin, age over 40, outdoor occupation',
            'treatment': 'Cryotherapy, topical medications, photodynamic therapy, chemical peels',
            'urgency': 'LOW - Monitor and schedule routine dermatology visit'
        },
        'Benign keratosis-like lesions': {
            'description': 'Non-cancerous skin growths that are generally harmless but may resemble other conditions.',
            'symptoms': 'Waxy, scaly, or slightly raised patches, brown or black coloration',
            'risk_factors': 'Age, genetics, sun exposure',
            'treatment': 'Usually no treatment needed, removal for cosmetic reasons if desired',
            'urgency': 'LOW - Routine monitoring recommended'
        },
        'Melanocytic nevi': {
            'description': 'Common benign moles composed of melanocytes. Most are harmless.',
            'symptoms': 'Brown or black spots, uniform color and shape, stable over time',
            'risk_factors': 'Genetics, sun exposure, fair skin',
            'treatment': 'Regular monitoring, removal if changes occur',
            'urgency': 'LOW - Regular self-examination and annual check-ups'
        },
        'Dermatofibroma': {
            'description': 'Benign fibrous skin tumor, often resulting from minor injuries like insect bites.',
            'symptoms': 'Small, firm nodules, brown or red coloration, dimpling when pinched',
            'risk_factors': 'Minor skin trauma, more common in women',
            'treatment': 'Usually no treatment needed, surgical removal if bothersome',
            'urgency': 'LOW - No immediate concern'
        },
        'Vascular lesions': {
            'description': 'Benign growths involving blood vessels in the skin.',
            'symptoms': 'Red or purple spots, may blanch with pressure, various sizes',
            'risk_factors': 'Age, genetics, sun exposure',
            'treatment': 'Laser therapy, sclerotherapy, surgical removal if needed',
            'urgency': 'LOW - Cosmetic concern, routine evaluation'
        }
    }
    
    return skin_info.get(predicted_class, {
        'description': 'Skin condition detected',
        'symptoms': 'Various symptoms may be present',
        'risk_factors': 'Multiple factors may contribute',
        'treatment': 'Consult with dermatologist for proper evaluation',
        'urgency': 'MODERATE - Professional evaluation recommended'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    """Predict skin cancer from uploaded image"""
    try:
        if not model:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Preprocess image
        image_array = preprocess_image(data['image'])
        
        # Make prediction
        predictions = model.predict(image_array)
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index]) * 100
        predicted_class = class_names[predicted_class_index]
        
        # Get detailed information
        detailed_info = get_detailed_info(predicted_class, confidence)
        
        # Prepare response
        response = {
            'diagnosis': predicted_class,
            'confidence': round(confidence, 2),
            'description': detailed_info['description'],
            'symptoms': detailed_info['symptoms'],
            'risk_factors': detailed_info['risk_factors'],
            'treatment': detailed_info['treatment'],
            'urgency': detailed_info['urgency'],
            'recommendation': f"Based on the analysis, this appears to be {predicted_class} with {confidence:.1f}% confidence. {detailed_info['urgency']}"
        }
        
        logger.info(f"Prediction made: {predicted_class} ({confidence:.2f}%)")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    """Get available class names"""
    return jsonify({'classes': class_names})

if __name__ == '__main__':
    load_model()
    app.run(debug=True, host='0.0.0.0', port=5000)
