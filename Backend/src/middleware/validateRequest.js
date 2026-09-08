/**
 * Request Body Validation Middleware for TraceX API Endpoints
 * Prevents invalid/untrusted payloads from crashing endpoints or polluting database.
 */

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "Valid email address is required" });
  }
  if (!password || typeof password !== "string" || !password.trim()) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }
  next();
}

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Full name is required" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Valid email address is required" });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
  }
  next();
}

export function validateCreateEntity(req, res, next) {
  const { name } = req.body || {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Entity name or identifier is required" });
  }
  next();
}

export function validateCreateRelationship(req, res, next) {
  const { sourceId, targetId } = req.body || {};
  if (sourceId === undefined || sourceId === null || isNaN(Number(sourceId))) {
    return res.status(400).json({ success: false, message: "Valid numeric sourceId is required" });
  }
  if (targetId === undefined || targetId === null || isNaN(Number(targetId))) {
    return res.status(400).json({ success: false, message: "Valid numeric targetId is required" });
  }
  next();
}

export function validateSubmitRecord(req, res, next) {
  const { snippet } = req.body || {};
  if (!snippet || typeof snippet !== "string" || !snippet.trim()) {
    return res.status(400).json({ success: false, message: "Snippet text is required" });
  }
  next();
}

export function validateReviewCandidate(req, res, next) {
  const { status } = req.body || {};
  if (!["CONFIRMED", "REJECTED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be either CONFIRMED or REJECTED" });
  }
  next();
}
