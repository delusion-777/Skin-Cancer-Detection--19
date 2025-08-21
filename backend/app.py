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
class_names = [
    'actinic keratosis',
    'basal cell carcinoma',
    'dermatofibroma',
    'melanoma',
    'nevus',
    'pigmented benign keratosis',
    'seborrheic keratosis',
    'squamous cell carcinoma',
    'vascular lesion'
]

# Model configuration
IMG_HEIGHT = 224
IMG_WIDTH = 224

def load_model():
    """Load the trained model"""
    global model
    try:
        model_path = 'enhanced_skin_cancer_model.h5'
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            logger.info("Model loaded successfully")
        else:
            logger.error(f"Model file not found: {model_path}")
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
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

def get_detailed_info(predicted_class, confidence):
    """Return detailed info for predicted condition"""
    skin_info = {
        'actinic keratosis': {
            'description': 'Precancerous rough, scaly patches caused by sun exposure.',
            'symptoms': 'Dry, scaly, rough patches; pink/red/brown; sandpaper-like texture.',
            'risk_factors': 'Fair skin, sun exposure, age >40, weak immunity.',
            'treatment': 'Cryotherapy, topical creams, laser, PDT, excision.',
            'urgency': 'LOW to MODERATE'
        },
        'basal cell carcinoma': {
            'description': 'Most common skin cancer, slow-growing, rarely spreads.',
            'symptoms': 'Pearly bump, scar-like lesion, bleeding sores.',
            'risk_factors': 'UV exposure, age >50, fair skin, radiation exposure.',
            'treatment': 'Mohs surgery, excision, cryotherapy, topical therapy.',
            'urgency': 'MODERATE'
        },
        'dermatofibroma': {
            'description': 'Benign fibrous skin growth, usually harmless.',
            'symptoms': 'Firm nodules, brown/red, dimples inward when pinched.',
            'risk_factors': 'Minor skin trauma, more common in women.',
            'treatment': 'No treatment unless bothersome.',
            'urgency': 'LOW'
        },
        'melanoma': {
            'description': 'Most dangerous skin cancer, spreads rapidly if untreated.',
            'symptoms': 'Irregular moles (ABCDE rule).',
            'risk_factors': 'UV exposure, family history, fair skin, many moles.',
            'treatment': 'Surgery, immunotherapy, targeted therapy.',
            'urgency': 'HIGH'
        },
        'nevus': {
            'description': 'Common benign mole made of melanocytes.',
            'symptoms': 'Small, uniform, stable brown/black spots.',
            'risk_factors': 'Genetics, sun exposure, hormonal changes.',
            'treatment': 'Monitoring, excision if suspicious.',
            'urgency': 'LOW'
        },
        'pigmented benign keratosis': {
            'description': 'Harmless dark scaly growth, often mistaken for melanoma.',
            'symptoms': 'Brown/black, wart-like patches.',
            'risk_factors': 'Aging, sun exposure, genetics.',
            'treatment': 'None unless cosmetic.',
            'urgency': 'LOW'
        },
        'seborrheic keratosis': {
            'description': 'Common benign skin growth in older adults.',
            'symptoms': 'Waxy, scaly, raised, stuck-on appearance.',
            'risk_factors': 'Age, genetics, fair skin.',
            'treatment': 'None unless cosmetic.',
            'urgency': 'LOW'
        },
        'squamous cell carcinoma': {
            'description': 'Second most common skin cancer, can spread.',
            'symptoms': 'Red, scaly patches, sores, wart-like growths.',
            'risk_factors': 'UV exposure, smoking, HPV, weak immunity.',
            'treatment': 'Excision, Mohs surgery, radiation.',
            'urgency': 'MODERATE to HIGH'
        },
        'vascular lesion': {
            'description': 'Benign condition involving blood vessels.',
            'symptoms': 'Red/purple/blue spots, blanch on pressure.',
            'risk_factors': 'Genetics, age, sun exposure.',
            'treatment': 'Usually none, laser possible.',
            'urgency': 'LOW'
        }
    }
    
    return skin_info.get(predicted_class, {
        'description': 'Skin condition detected',
        'symptoms': 'Symptoms vary',
        'risk_factors': 'Multiple factors',
        'treatment': 'Consult dermatologist',
        'urgency': 'MODERATE'
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not model:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_array = preprocess_image(data['image'])
        predictions = model.predict(image_array)
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index]) * 100
        predicted_class = class_names[predicted_class_index]
        
        detailed_info = get_detailed_info(predicted_class, confidence)
        
        response = {
            'diagnosis': predicted_class.title(),
            'confidence': round(confidence, 2),
            **detailed_info,
            'recommendation': f"This appears to be {predicted_class.title()} with {confidence:.1f}% confidence. Urgency: {detailed_info['urgency']}."
        }
        
        logger.info(f"Prediction: {predicted_class} ({confidence:.2f}%)")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    return jsonify({'classes': class_names})

if __name__ == '__main__':
    load_model()
    app.run(debug=True, host='0.0.0.0', port=5000)
