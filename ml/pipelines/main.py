from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipelines.entity_extraction import extract_entities
from pipelines.anomaly_detection import detect_anomaly

app = FastAPI(title="TraceX ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "TraceX ML API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


class TextInput(BaseModel):
    text: str


class ValuesInput(BaseModel):
    values: list[float]


@app.post("/extract-entities")
def extract_entities_endpoint(payload: TextInput):
    result = extract_entities(payload.text)
    return {"entities": result}


@app.post("/detect-anomaly")
def detect_anomaly_endpoint(payload: ValuesInput):
    result = detect_anomaly(payload.values)
    return result