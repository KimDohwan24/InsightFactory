import pandas as pd
from sklearn.preprocessing import OrdinalEncoder

def encode_categorical(X):
    """
    Encodes categorical features using OrdinalEncoder.
    Returns:
        X: DataFrame with encoded categorical features.
        encoder: Fitted OrdinalEncoder (or None if no object cols).
        object_cols: List of object column names.
    """
    object_cols = X.select_dtypes(include=['object']).columns.tolist()
    encoder = None
    if len(object_cols) > 0:
        encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        X[object_cols] = encoder.fit_transform(X[object_cols].astype(str))
    return X, encoder, object_cols
