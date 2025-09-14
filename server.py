import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import re
from typing import Optional, List, Dict, Any

load_dotenv()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
PORT = int(os.getenv("PORT", "8080"))
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")  # tighten later

if not ANTHROPIC_API_KEY:
    raise RuntimeError("Missing ANTHROPIC_API_KEY")

app = FastAPI(title="PromptImpact Proxy")

@app.get("/health")
def health():
    return {"ok": True}

# --- CORS: allow your extension/content-script to call this API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN, "chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# ------------------------
# Count Endpoint
# ------------------------
class CountReq(BaseModel):
    text: str
    model: str = "claude-3-5-haiku-20241022"   # pick a default
    expected_output_tokens: int | None = None  # optional

class CountRes(BaseModel):
    tokens_input: int
    tokens_output_estimate: int
    tokens_total_estimate: int
    wh_per_token: float | None = None
    kwh: float | None = None
    co2_kg: float | None = None
    water_l: float | None = None

ANTHROPIC_BASE_COUNT = "https://api.anthropic.com/v1/messages/count_tokens"

# rough constants
WH_PER_TOKEN = 0.05
KGCO2_PER_KWH = 0.40
WUE_L_PER_KWH = 1.8

@app.post("/count", response_model=CountRes)
async def count_tokens(req: CountReq):
    try:
        payload = {
            "model": req.model,
            "messages": [{"role": "user", "content": req.text}],
        }
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(ANTHROPIC_BASE_COUNT, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
            tokens_input = data.get("input_tokens", 0)

        out_est = req.expected_output_tokens or 200
        total_est = tokens_input + out_est

        kwh = (total_est * WH_PER_TOKEN) / 1000.0
        co2 = kwh * KGCO2_PER_KWH
        water = kwh * WUE_L_PER_KWH

        return CountRes(
            tokens_input=tokens_input,
            tokens_output_estimate=out_est,
            tokens_total_estimate=total_est,
            wh_per_token=WH_PER_TOKEN,
            kwh=round(kwh, 6),
            co2_kg=round(co2, 6),
            water_l=round(water, 6),
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------
# Rewrite Endpoint
# ------------------------
class RewriteReq(BaseModel):
    text: str
    model: str = "claude-3-5-haiku-20241022"
    max_tokens: int = 220

class RewriteRes(BaseModel):
    issues: list[str]
    revised_prompt: str

ANTHROPIC_BASE_MESSAGES = "https://api.anthropic.com/v1/messages"

@app.post("/rewrite", response_model=RewriteRes)
async def rewrite_prompt(req: RewriteReq):
    system = (
        "You are a prompt editor focused on clarity, brevity, and sustainability.\n"
        "Return EXACTLY TWO SECTIONS:\n"
        "Issues:\n"
        "- 2 to 4 short bullets about problems (verbosity, ambiguity, missing constraints).\n"
        "Revised:\n"
        "- A single concise prompt (≤ 150 tokens)."
    )

    payload = {
        "model": req.model,
        "max_tokens": min(max(req.max_tokens, 100), 250),
        "system": system,
        "messages": [{"role": "user", "content": req.text}],
    }

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(ANTHROPIC_BASE_MESSAGES, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

        full_text = "".join(
            c.get("text", "") for c in data.get("content", []) if c.get("type") == "text"
        )

        issues, revised = [], ""
        if "Issues:" in full_text and "Revised:" in full_text:
            parts = full_text.split("Revised:")
            issues_text = parts[0].split("Issues:", 1)[1].strip()
            revised = parts[1].strip()
            issues = [line.strip(" -•\t") for line in issues_text.splitlines() if line.strip()]
        else:
            revised = full_text.strip() or req.text

        return RewriteRes(issues=issues[:4], revised_prompt=revised)

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ScoreReq(BaseModel):
    # Accept either raw text or a messages[] array (last user turn is scored)
    text: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None

class ScoreRes(BaseModel):
    score: int                # 1..5
    signals: Dict[str, bool]  # feature flags: has_task, has_format, etc.
    suggestions: List[str]    # top, actionable edits
    details: Dict[str, Any]   # extra info: lengths, detected items

ACTION_VERBS = [
    "summarize","classify","extract","rewrite","translate","compare","convert",
    "list","identify","explain","generate","draft","plan","analyze","answer",
    "compute","count","map","rank","sort","validate","fix","refactor"
]
FORMAT_HINTS = [
    "json","csv","yaml","markdown","md","table","bulleted","bullet points",
    "key:value","schema","fields","columns","rows","array","list of",
    "return only","output only"
]
FLUFF = [
    "kindly","please","very","as soon as possible","if you can","i would like",
    "long answer","in a detailed manner","extremely","really","just","basically"
]
CONSTRAINT_LEX = [
    "no more than","at most","limit to","max","maximum","exactly","between",
    "must include","must not","exclude","only include","step-by-step","steps",
    "criteria","acceptance criteria","requirements"
]
DOMAIN_HINTS = [
    "api","endpoint","dataset","schema","sql","financial","invoice","customer",
    "climate","emissions","policy","medical","diagnosis","error","stack trace",
    "log","http","jsonl","csv","kpi","metric","latency","token","prompt"
]

def _choose_text(req: ScoreReq) -> str:
    if req.text:
        return req.text
    if req.messages and isinstance(req.messages, list):
        # score the last user turn if present; else concatenate all
        user_msgs = [m.get("content","") for m in req.messages if (m.get("role") == "user" and m.get("content"))]
        if user_msgs:
            return str(user_msgs[-1])
        # fallback: join all content strings
        parts = [str(m.get("content","")) for m in req.messages if m.get("content")]
        return "\n".join(parts)
    return ""

def _has_action_verb(s: str) -> bool:
    head = s.strip().lower()
    # check first ~8 words for an action verb
    words = head.split()
    head8 = " ".join(words[:8])
    return any(re.search(rf"\b{re.escape(v)}\b", head8) for v in ACTION_VERBS)

def _has_output_format(s: str) -> bool:
    low = s.lower()
    # explicit patterns like "Output JSON", code fences, braces, "return only X"
    if re.search(r"```(json|csv|yaml|markdown)?", low): return True
    if re.search(r"\{[^}]{3,}\}", s): return True   # looks like a JSON skeleton
    if re.search(r"\b(return|output)\s+only\b", low): return True
    return any(f in low for f in FORMAT_HINTS)

def _has_length_limit(s: str) -> bool:
    low = s.lower()
    if re.search(r"\b\d+\s*(words?|tokens?|characters?|chars?|sentences?|bullets?)\b", low): return True
    return any(p in low for p in ["no more than","at most","limit to","maximum","max "])

def _has_constraints(s: str) -> bool:
    low = s.lower()
    return any(p in low for p in CONSTRAINT_LEX)

def _too_long(s: str) -> bool:
    # rough: > 1200 chars (~300 tokens) counts as long
    return len(s) > 1200

def _fluff_count(s: str) -> int:
    low = s.lower()
    return sum(low.count(w) for w in FLUFF)

def _has_domain_context(s: str) -> bool:
    low = s.lower()
    # hint of specificity: numbers/dates/file types or domain terms
    if re.search(r"\b(19|20)\d{2}\b", s): return True
    if re.search(r"\b\d{2,}\b", s): return True
    return any(w in low for w in DOMAIN_HINTS)

def _build_suggestions(sig: Dict[str,bool], is_long: bool, fluff: int) -> List[str]:
    tips = []
    if not sig["has_task"]:
        tips.append("Start with a clear action verb (e.g., “Summarize”, “Classify”, “Extract”).")
    if not sig["has_format"]:
        tips.append("Specify the output format (e.g., JSON with keys, bullet list, or a table).")
    if not sig["has_length_limit"]:
        tips.append("Add a length limit (e.g., “≤120 words” or “return ≤10 bullets”).")
    if not sig["has_constraints"]:
        tips.append("Add constraints or acceptance criteria (what to include/exclude).")
    if not sig["has_context"]:
        tips.append("Add 1–2 pieces of domain context or examples to reduce ambiguity.")
    if is_long:
        tips.append("Cut filler and redundancy; keep instructions concise.")
    if fluff >= 2:
        tips.append("Remove vague fillers (e.g., “kindly”, “very”, “long answer”).")
    # prioritize top 3
    return tips[:3]

def _score(sig: Dict[str,bool], is_long: bool, fluff: int) -> int:
    # Base 1; add positives; subtract penalties; clamp 1..5
    pts = 1
    pts += 1 if sig["has_task"] else 0
    pts += 1 if sig["has_format"] else 0
    pts += 1 if sig["has_length_limit"] or sig["has_constraints"] else 0
    pts += 1 if sig["has_context"] else 0
    if is_long: pts -= 1
    if fluff >= 3: pts -= 1
    return max(1, min(5, pts))

@app.post("/score", response_model=ScoreRes)
async def score_prompt(req: ScoreReq):
    text = _choose_text(req)
    text_norm = " ".join(text.split())  # collapse whitespace

    has_task        = _has_action_verb(text_norm)
    has_format      = _has_output_format(text_norm)
    has_len_limit   = _has_length_limit(text_norm)
    has_constraints = _has_constraints(text_norm)
    has_context     = _has_domain_context(text_norm)
    is_long         = _too_long(text_norm)
    fluff           = _fluff_count(text_norm)

    signals = {
    "has_task": has_task,
    "has_format": has_format,
    "has_length_limit": has_len_limit,
    "has_constraints": has_constraints,
    "has_context": has_context,
    "too_long": is_long,
}

    score = _score(signals, is_long, fluff)
    suggestions = _build_suggestions(signals, is_long, fluff)

    details = {
        "text_length_chars": len(text_norm),
        "approx_tokens": max(1, len(text_norm) // 4),
        "fluff_count": fluff,
        "detected": {
            "format_hints": any(h in text_norm.lower() for h in FORMAT_HINTS),
            "constraint_keywords_found": [w for w in CONSTRAINT_LEX if w in text_norm.lower()],
            "domain_terms_found": [w for w in DOMAIN_HINTS if w in text_norm.lower()],
        }
    }


    return ScoreRes(
        score=score,
        signals=signals,
        suggestions=suggestions,
        details=details
    )
