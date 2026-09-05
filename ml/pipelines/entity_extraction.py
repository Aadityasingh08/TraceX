import spacy

# Load the model once when the module is imported
nlp = spacy.load("en_core_web_sm")


def extract_entities(text: str) -> list[dict]:
    """
    Extracts named entities (people, orgs, locations, dates, etc.) from text.
    Returns a list of dicts: [{"text": ..., "label": ..., "start": ..., "end": ...}]
    """
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
        })
    return entities