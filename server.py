import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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

class CountReq(BaseModel):
    text: str
    model: str = "claude-3-5-haiku-20241022"   # pick a default
    # optional: include output length to account for likely generation
    expected_output_tokens: int | None = None

class CountRes(BaseModel):
    tokens_input: int
    tokens_output_estimate: int
    tokens_total_estimate: int

    # Optional derived KPIs (rough constants; tune later)
    wh_per_token: float | None = None
    kwh: float | None = None
    co2_kg: float | None = None
    water_l: float | None = None

ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages/count_tokens"

# rough constants (replace with your research defaults)
WH_PER_TOKEN = 0.05      # Wh/token (example placeholder)
KGCO2_PER_KWH = 0.40     # kg CO2 / kWh
WUE_L_PER_KWH = 1.8      # liters water / kWh (Water Usage Effectiveness)

@app.post("/count", response_model=CountRes)
async def count_tokens(req: CountReq):
    try:
        # 1) call Anthropic count endpoint for input text
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
            r = await client.post(ANTHROPIC_BASE, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
            tokens_input = data.get("input_tokens", 0)  # field name per Anthropic doc

        # 2) estimate output tokens (simple heuristic or from UI slider)
        out_est = req.expected_output_tokens or 200

        total_est = tokens_input + out_est

        # 3) convert to energy/CO2/water (very rough, user-configurable)
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
