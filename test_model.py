import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os

# Load the model
model = tf.keras.models.load_model("trained_model.keras")

# Path to a test image
img_path = r"C:\Users\vinee\OneDrive\skin_cancer\Skin-Cancer-Detection-\dataset\Skin cancer ISIC The International Skin Imaging Collaboration\Test\actinic keratosis\ISIC_0010512.jpg"

# Preprocess the image
img = image.load_img(img_path, target_size=(224, 224))  # adjust size to your model
img_array = image.img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# Make prediction
pred = model.predict(img_array)
class_idx = np.argmax(pred)
print("Predicted Class Index:", class_idx)
