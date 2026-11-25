"""
RETURNSIGHT AI - Enterprise FastAPI Main Application
Author: Senior Software Architect
Description: Boots the FastAPI application, initializes database schemas, enables CORS,
and mounts documented REST API routers.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import engine, Base, SessionLocal
from backend.database.models import PredictionEntity
from backend.routes.api import router as api_router, sync_platform_orders

# Auto-create SQLite database tables if not existing
Base.metadata.create_all(bind=engine)

# Auto-score initial e-commerce orders if predictions table is empty
with SessionLocal() as _db:
    if _db.query(PredictionEntity).count() == 0:
        sync_platform_orders(_db, limit=30)

app = FastAPI(
    title="RETURNSIGHT AI — Retail Returns Intelligence API",
    description="Enterprise API powering retail return prediction, root-cause analytics, explainability, and financial impact simulation.",
    version="1.0.0-enterprise",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enterprise CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local Vite dev and containerized deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core API router
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "platform": "RETURNSIGHT AI",
        "tagline": "Predict Returns. Understand Behaviour. Protect Revenue.",
        "documentation": "/docs",
        "api_health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
