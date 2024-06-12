import json
import joblib
import os
import sys
from scipy.sparse import load_npz
from sklearn.metrics import jaccard_score

# Load the saved vectorizer
script_dir = os.path.dirname(os.path.abspath(__file__))
tfidf_vectorizer = joblib.load(os.path.join(script_dir, 'processedData', 'tfidf_vectorizer.joblib'))

# Load the library of strings (sparse matrix)
X_library = load_npz(os.path.join(script_dir, 'processedData', 'vectorized_data.npz'))

# User query
QUERY = sys.argv[1]
user_vector = tfidf_vectorizer.transform([QUERY])

# Binarize the vectors (convert to binary format)
user_vector_bin = user_vector.sign()
X_library_bin = X_library.sign()

# Calculate Jaccard similarity scores using matrix operations
intersection = user_vector_bin.multiply(X_library_bin).sum(axis=1).A.flatten()
union = user_vector_bin.sum() + X_library_bin.sum(axis=1).A.flatten() - intersection

# Calculate Jaccard similarity scores as ratios
similarity_scores = (intersection / union)

# Sort indices based on similarity scores in descending order
sorted_indices = sorted(range(len(similarity_scores)), key=lambda i: similarity_scores[i], reverse=True)

# Number of top results to return
top_results = 3

# Load the dataset
with open(os.path.join(script_dir, 'inputData.json'), 'r') as f:
    data = json.load(f)

# Return list of objects with highest similarity scores to the query
results = []
for index in sorted_indices[:top_results]:
    similarity_score = similarity_scores[index]
    # Retrieve the corresponding object from the library based on index
    object_data = data[index]
    result_object = {
        "id": object_data["id"],
        "designation": object_data["designation"],
        "similarity_score": similarity_score,
    }
    if similarity_score > 0.03: results.append(result_object)

# Print top results for Jaccard similarity
print(results)

