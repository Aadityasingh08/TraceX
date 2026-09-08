// signalController.js — serves "/api/records"
import pool from "../config/db.js";
import crypto from "crypto";
import { createRequire } from "module";
import { analyzeSignal } from "../services/signalDetectionService.js";
import { correlateSignal } from "../services/correlationService.js";
import { maybeCreateAlert } from "../services/alertGenerationService.js";
import { createEvidence } from "../services/evidenceService.js";
import logger from "../utils/logger.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export async function getRecords(req, res, next) {
  try {
    const { search, limit, offset } = req.query;
    let query = `
      SELECT id, entity_id AS "entityId", source_id AS "sourceId",
             source AS "sourceLabel",
             type, title, snippet, timestamp,
             COALESCE(confidence, 0) AS confidence,
             topic,
             person_name AS "personName",
             telegram_handle AS "telegramHandle",
             phone,
             email,
             location,
             wallet_address AS "walletAddress"
      FROM signals
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE title ILIKE $1 OR snippet ILIKE $1 OR source ILIKE $1 OR person_name ILIKE $1 OR phone ILIKE $1 OR telegram_handle ILIKE $1 OR email ILIKE $1 OR location ILIKE $1 OR wallet_address ILIKE $1`;
    }
    query += ` ORDER BY timestamp DESC`;

    if (limit) {
      params.push(parseInt(limit, 10));
      query += ` LIMIT $${params.length}`;
      if (offset) {
        params.push(parseInt(offset, 10));
        query += ` OFFSET $${params.length}`;
      }
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
}

export async function analyzeRecord(req, res, next) {
  try {
    const { id } = req.params;
    const sigRes = await pool.query(`SELECT snippet FROM signals WHERE id = $1`, [id]);
    if (sigRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Signal not found" });
    }
    const candidates = await analyzeSignal(id, sigRes.rows[0].snippet);
    res.json({ success: true, candidates });
  } catch (err) { next(err); }
}

export async function getRecordCandidates(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, signal_id, type, value, canonical_value AS "canonicalValue",
              confidence, status, matched_entity_id AS "matchedEntityId"
       FROM signal_candidates
       WHERE signal_id = $1
       ORDER BY confidence DESC`,
      [id]
    );
    res.json({ success: true, candidates: result.rows });
  } catch (err) { next(err); }
}

export async function reviewCandidate(req, res, next) {
  try {
    const { candidateId } = req.params;
    const { status, matchedEntityId } = req.body;
    if (!["CONFIRMED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be CONFIRMED or REJECTED" });
    }

    const updateRes = await pool.query(
      `UPDATE signal_candidates
       SET status = $1, matched_entity_id = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING id, signal_id AS "signalId", type, value, status, matched_entity_id AS "matchedEntityId"`,
      [status, matchedEntityId || null, req.user?.id || 1, candidateId]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    let correlation = null;
    let alertsCreated = [];
    if (status === "CONFIRMED") {
      const { signalId } = updateRes.rows[0];
      correlation = await correlateSignal(signalId);
      for (const entityId of correlation.entityIds) {
        const alertId = await maybeCreateAlert(entityId).catch((err) => {
          logger.error(`Alert generation failed for ${entityId}: ${err.message}`);
          return null;
        });
        if (alertId) alertsCreated.push(alertId);
      }
    }

    res.json({ success: true, correlation, alertsCreated });
  } catch (err) { next(err); }
}

export async function submitRecord(req, res, next) {
  try {
    const { title, snippet, sourceLabel, timestamp, type } = req.body;
    if (!snippet || typeof snippet !== "string" || snippet.trim().length === 0) {
      return res.status(400).json({ success: false, message: "snippet (the case text) is required" });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO signals (id, entity_id, source_id, source, type, title, snippet, timestamp, confidence, topic)
       VALUES ($1, NULL, NULL, $2, $3, $4, $5, $6, NULL, NULL)`,
      [
        id,
        sourceLabel || "manual_submission",
        type || "submission",
        title || "Untitled submission",
        snippet,
        timestamp || new Date().toISOString(),
      ]
    );

    const candidates = await analyzeSignal(id, snippet);
    res.status(201).json({ success: true, signalId: id, candidates });
  } catch (err) { next(err); }
}

export async function uploadRecord(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "file is required (field name: file)" });
    }

    const filename = req.file.originalname || "intelligence_data.json";
    const rawContent = req.file.buffer.toString("utf-8");
    const investigationId = req.body.investigationId ? parseInt(req.body.investigationId, 10) : null;
    let parsedRecords = [];

    // 1. Try parsing as PDF Dossier
    if (filename.toLowerCase().endsWith(".pdf")) {
      let extractedText = "";
      try {
        const pdfData = await pdf(req.file.buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr) {
        extractedText = req.file.buffer.toString("binary").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }

      const phoneRegex = /(\+91\d{10}|\+?\d[\d\s-]{8,13}\d)/g;
      const handleRegex = /@([a-zA-Z0-9_]{3,32})/g;
      const walletRegex = /(0x[a-fA-F0-9]{40}|bc1[a-zA-HJ-NP-Z0-9]{25,39})/g;
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

      const phones = Array.from(new Set(extractedText.match(phoneRegex) || []));
      const handles = Array.from(new Set(extractedText.match(handleRegex) || []));
      const wallets = Array.from(new Set(extractedText.match(walletRegex) || []));
      const emails = Array.from(new Set(extractedText.match(emailRegex) || []));

      const cleanSnippet = extractedText.trim().replace(/\s+/g, " ").slice(0, 4000) || `Uploaded PDF Dossier: ${filename}`;
      
      parsedRecords = [{
        title: `PDF Dossier - ${filename}`,
        snippet: cleanSnippet,
        source: `Investigator PDF Upload / ${filename}`,
        type: "PDF_DOSSIER",
        topic: "case_dossier",
        confidence: 0.95,
        phone: phones[0] || null,
        telegram_handle: handles[0] || null,
        wallet_address: wallets[0] || null,
        email: emails[0] || null,
      }];

      wallets.forEach((w) => {
        parsedRecords.push({
          title: `Crypto Wallet [${w.slice(0, 6)}...${w.slice(-4)}] (from ${filename})`,
          snippet: `Extracted cryptocurrency wallet from uploaded case dossier ${filename}. Linked to active investigation.`,
          source: `PDF Extract / ${filename}`,
          type: "CRYPTO_WALLET",
          topic: "crypto_tracking",
          confidence: 0.92,
          wallet_address: w
        });
      });

      handles.forEach((h) => {
        parsedRecords.push({
          title: `Telegram Handle ${h} (from ${filename})`,
          snippet: `Extracted encrypted messaging handle from uploaded case dossier ${filename}.`,
          source: `PDF Extract / ${filename}`,
          type: "COMMUNICATION_HANDLE",
          topic: "encrypted_comms",
          confidence: 0.90,
          telegram_handle: h
        });
      });

      phones.forEach((p) => {
        parsedRecords.push({
          title: `Burner / Phone Intercept ${p} (from ${filename})`,
          snippet: `Extracted telecommunication target from uploaded case dossier ${filename}.`,
          source: `PDF Extract / ${filename}`,
          type: "PHONE_TARGET",
          topic: "telecom_intercept",
          confidence: 0.92,
          phone: p
        });
      });
    }

    // 2. Try parsing as JSON
    if (parsedRecords.length === 0 && (filename.endsWith(".json") || rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{"))) {
      try {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed)) {
          parsedRecords = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          if (Array.isArray(parsed.records)) parsedRecords = parsed.records;
          else if (Array.isArray(parsed.signals)) parsedRecords = parsed.signals;
          else if (Array.isArray(parsed.data)) parsedRecords = parsed.data;
          else parsedRecords = [parsed];
        }
      } catch (_) {}
    }

    // 3. Try parsing as CSV
    if (parsedRecords.length === 0 && (filename.endsWith(".csv") || rawContent.includes(","))) {
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        for (let i = 1; i < lines.length; i++) {
          const rowVals = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = rowVals[idx] || "";
          });
          parsedRecords.push(rowObj);
        }
      }
    }

    // 4. Fallback: single or line-delimited records
    if (parsedRecords.length === 0) {
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1 && lines.length <= 10000) {
        parsedRecords = lines.map((line, idx) => ({
          title: `Line #${idx + 1} - ${filename}`,
          snippet: line,
        }));
      } else {
        parsedRecords = [{
          title: `File Upload - ${filename}`,
          snippet: rawContent.slice(0, 8000),
        }];
      }
    }

    // 4. Batch Ingest into PostgreSQL
    const BATCH_SIZE = 500;
    let totalInserted = 0;

    for (let i = 0; i < parsedRecords.length; i += BATCH_SIZE) {
      const chunk = parsedRecords.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const item of chunk) {
        const id = crypto.randomUUID();
        const title = item.title || item.name || `Intel Record #${totalInserted + values.length + 1} (${filename})`;
        const snippet = item.snippet || item.description || item.text || JSON.stringify(item);
        const source = item.source || item.sourceLabel || item.source_channel || `Upload / ${filename}`;
        const topic = item.topic || item.category || "surveillance";
        const type = item.type || "bulk_intel";
        const confidence = typeof item.confidence === "number" ? item.confidence : 0.85;
        const timestamp = item.timestamp || item.date || new Date().toISOString();
        const personName = item.person_name || item.personName || item.operative || item.name || null;
        const phone = item.phone || item.mobile || item.contact || null;
        const telegram = item.telegram_handle || item.telegramHandle || item.telegram || item.handle || null;
        const email = item.email || null;
        const location = item.location || item.city || null;
        const wallet = item.wallet_address || item.walletAddress || item.wallet || null;

        values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, $${pIdx+12}, $${pIdx+13}, $${pIdx+14}, 'VERIFIED')`);
        params.push(
          id,
          title,
          snippet,
          source,
          investigationId,
          topic,
          type,
          confidence,
          timestamp,
          personName,
          location,
          phone,
          email,
          telegram,
          wallet
        );
        pIdx += 15;
      }

      const insertSql = `
        INSERT INTO signals (
          id, title, snippet, source, investigation_id, topic, type, confidence,
          timestamp, person_name, location, phone, email, telegram_handle, wallet_address,
          verification_status
        ) VALUES ${values.join(", ")}
      `;

      await pool.query(insertSql, params);
      totalInserted += chunk.length;
    }

    // If this is a PDF case dossier linked to an investigation, create cryptographic evidence record
    if (filename.toLowerCase().endsWith(".pdf") && investigationId) {
      try {
        await createEvidence({
          source: `Investigator PDF Dossier / ${filename}`,
          content: rawContent || filename,
          confidence: 0.95,
          finding: `Case dossier ${filename} uploaded. Extracted and indexed ${totalInserted} signal nodes (Telecom, Crypto, Encrypted Comms).`,
          investigationId,
        });
      } catch (evErr) {
        logger.warn(`Could not create evidence record for PDF: ${evErr.message}`);
      }
    }

    // Run first record extraction analysis if single or small upload
    let candidates = [];
    if (parsedRecords.length === 1 && parsedRecords[0].snippet) {
      candidates = await analyzeSignal(crypto.randomUUID(), parsedRecords[0].snippet).catch(() => []);
    }

    res.status(201).json({
      success: true,
      count: totalInserted,
      filename,
      isPdf: filename.toLowerCase().endsWith(".pdf"),
      message: filename.toLowerCase().endsWith(".pdf")
        ? `Successfully ingested PDF dossier '${filename}' — extracted and indexed ${totalInserted} intelligence signals.`
        : `Successfully ingested ${totalInserted.toLocaleString()} intelligence records from ${filename}`,
      candidates,
    });
  } catch (err) { next(err); }
}