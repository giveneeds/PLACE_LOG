from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Place Log Pro API",
    description="네이버 플레이스 키워드/순위 데이터 분석 플랫폼",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Place Log Pro API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}