from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import drafts, pdf

app = FastAPI(
    title="AI CV Maker API",
    description="Production-grade CV backend with pixel-perfect PDF parity",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(drafts.router)
app.include_router(pdf.router)

@app.get("/")
def health_check():
    return {"status": "online", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
