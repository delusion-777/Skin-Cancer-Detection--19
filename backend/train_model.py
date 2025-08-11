import pathlib
import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import os
import PIL
from tensorflow.keras import layers, Sequential
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import SparseCategoricalCrossentropy
import seaborn as sns
import warnings

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

# GPU setup (optional)
gpus = tf.config.experimental.list_physical_devices('GPU')
print("GPUs available:", gpus)
try:
    if gpus:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
except Exception as e:
    print(e)

# Data paths
train_dir = pathlib.Path("ABC/Train")
test_dir = pathlib.Path("ABC/Test")

image_count_train = len(list(train_dir.glob('*/*.jpg')))
print(f"Training images: {image_count_train}")

image_count_test = len(list(test_dir.glob('*/*.jpg')))
print(f"Testing images: {image_count_test}")

# Parameters
batch_size = 32
img_height = 180
img_width = 180
seed = 123

# Create datasets
train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    train_dir,
    validation_split=0.2,
    subset="training",
    seed=seed,
    image_size=(img_height, img_width),
    batch_size=batch_size)

val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    train_dir,
    validation_split=0.2,
    subset="validation",
    seed=seed,
    image_size=(img_height, img_width),
    batch_size=batch_size)

test_ds = tf.keras.preprocessing.image_dataset_from_directory(
    test_dir,
    image_size=(img_height, img_width),
    batch_size=batch_size)

class_names = train_ds.class_names
print("Classes:", class_names)
num_classes = len(class_names)

# Visualize some images
plt.figure(figsize=(10, 10))
for i, class_name in enumerate(class_names):
    plt.subplot(3, 3, i + 1)
    image = plt.imread(str(list(train_dir.glob(f"{class_name}/*.jpg"))[0]))
    plt.title(class_name)
    plt.axis("off")
    plt.imshow(image)
plt.show()

# Build model
model = Sequential([
    layers.Rescaling(1./255, input_shape=(img_height, img_width, 3)),
    layers.Conv2D(32, 3, padding="same", activation='relu'),
    layers.MaxPooling2D(),
    layers.Conv2D(64, 3, padding="same", activation='relu'),
    layers.MaxPooling2D(),
    layers.Conv2D(128, 3, padding="same", activation='relu'),
    layers.MaxPooling2D(),
    layers.Conv2D(256, 3, padding="same", activation='relu'),
    layers.MaxPooling2D(),
    layers.Conv2D(512, 3, padding="same", activation='relu'),
    layers.MaxPooling2D(),
    layers.Flatten(),
    layers.Dense(1024, activation="relu"),
    layers.Dense(num_classes, activation='softmax')
])

# Compile model
opt = Adam(learning_rate=0.001)
model.compile(optimizer=opt,
              loss=SparseCategoricalCrossentropy(from_logits=False),
              metrics=['accuracy'])

model.summary()

# Train model
epochs = 25
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=epochs)

# Plot training history
acc = history.history['accuracy']
val_acc = history.history['val_accuracy']
loss = history.history['loss']
val_loss = history.history['val_loss']

plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.plot(range(epochs), acc, label='Training Accuracy')
plt.plot(range(epochs), val_acc, label='Validation Accuracy')
plt.legend(loc='lower right')
plt.title('Training and Validation Accuracy')

plt.subplot(1, 2, 2)
plt.plot(range(epochs), loss, label='Training Loss')
plt.plot(range(epochs), val_loss, label='Validation Loss')
plt.legend(loc='upper right')
plt.title('Training and Validation Loss')
plt.show()

# Evaluate model
eval_loss, eval_accuracy = model.evaluate(test_ds, verbose=1)
print(f"[INFO] Test accuracy: {eval_accuracy * 100:.2f}%")
print(f"[INFO] Test loss: {eval_loss:.4f}")

# Save model
model.save('skin_cancer_classifier_model.h5')
print("Model saved successfully as 'skin_cancer_classifier_model.h5'")
