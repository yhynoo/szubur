import json
import joblib
from scipy.sparse import save_npz
from sklearn.feature_extraction.text import TfidfVectorizer

# File paths
INPUT_FILE = 'processedData.json'
OUTPUT_FILE = 'processedData_with_vectors.json'
SPARSE_MATRIX_FILE = 'vectorized_data.npz'
VECTORIZER_FILE = 'tfidf_vectorizer.joblib'

# Load the dataset
with open(INPUT_FILE, 'r') as f:
    data = json.load(f)

# Extract the transliterationNoStopWords texts
texts = [item['transliterationNoStopWords'] for item in data]

# Initialize the vectorizer and fit it on the texts
tfidf_vectorizer = TfidfVectorizer(token_pattern=r"(?u)\S+", ngram_range=(1, 2))
X = tfidf_vectorizer.fit_transform(texts)

# Save the vectorizer for future use
joblib.dump(tfidf_vectorizer, VECTORIZER_FILE)

# Save the vectorized data in sparse matrix format
save_npz(SPARSE_MATRIX_FILE, X)

# Add the sparse matrix file path to the original data
for item in data:
    item['vector'] = SPARSE_MATRIX_FILE

# Save the modified data back to a JSON file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(data, f, indent=4)

print("Vectorization complete and saved to processedData_with_vectors.json.")
