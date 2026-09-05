import statistics


def detect_anomaly(values: list[float], threshold: float = 2.5) -> dict:
    """
    Simple z-score based anomaly detection over a list of numeric values
    (e.g. response times, request counts, error rates).
    Flags any point whose z-score exceeds `threshold` as an anomaly.
    """
    if len(values) < 2:
        return {"anomalies": [], "message": "Not enough data points to detect anomalies"}

    mean = statistics.mean(values)
    stdev = statistics.stdev(values)

    if stdev == 0:
        return {"anomalies": [], "message": "No variance in data"}

    anomalies = []
    for i, v in enumerate(values):
        z_score = (v - mean) / stdev
        if abs(z_score) > threshold:
            anomalies.append({"index": i, "value": v, "z_score": round(z_score, 2)})

    return {
        "mean": round(mean, 2),
        "stdev": round(stdev, 2),
        "anomalies": anomalies,
    }