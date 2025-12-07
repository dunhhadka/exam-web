import os
import json
import time
from typing import Optional, List
from sqlalchemy import create_engine, String, Integer, LargeBinary, DateTime, func, Text, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.exc import SQLAlchemyError

DB_HOST = os.getenv("MYSQL_HOST", "localhost")
DB_PORT = os.getenv("MYSQL_PORT", "3306")
DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
DB_NAME = os.getenv("MYSQL_DB", "exam_proctor")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"  # noqa: E501

# Whitelist DB Connection (Separate DB)
WHITELIST_DB_URL = os.getenv("WHITELIST_DB_URL", "mysql+pymysql://root:@localhost:3306/exam?charset=utf8mb4")

_engine = None
_SessionLocal = None
_whitelist_engine = None
_WhitelistSessionLocal = None

class Base(DeclarativeBase):
    pass

class KYCProfile(Base):
    __tablename__ = "kyc_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    # Use Text for large JSON (512 floats ~ >4KB as string)
    embedding_json: Mapped[str] = mapped_column(Text)
    image_path: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[int] = mapped_column(Integer, default=lambda: int(time.time()))

class Whitelist(Base):
    __tablename__ = "whitelists"
    # Updated based on actual DB schema
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    exam_session_id: Mapped[int] = mapped_column(Integer, index=True)
    avatar_urls: Mapped[str] = mapped_column(Text) 

class CheatingLog(Base):
    __tablename__ = "cheating_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_session_id: Mapped[str] = mapped_column(String(64), index=True)
    candidate_id: Mapped[str] = mapped_column(String(64), index=True)
    incident_type: Mapped[str] = mapped_column(String(10))  # A1, A2...
    severity_level: Mapped[str] = mapped_column(String(10)) # S1, S2...
    description: Mapped[str] = mapped_column(Text, nullable=True)
    proof_path: Mapped[str] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[int] = mapped_column(Integer) # Unix timestamp
    created_at: Mapped[int] = mapped_column(Integer, default=lambda: int(time.time()))

def init_db():
    global _engine, _SessionLocal, _whitelist_engine, _WhitelistSessionLocal
    if _engine is None:
        try:
            _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            _SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
            Base.metadata.create_all(_engine)
            # Ensure column type can store large JSON; migrate if needed
            try:
                with _engine.connect() as conn:
                    # MySQL-specific alteration; ignore if already applied or using other DB
                    conn.execute(text("ALTER TABLE kyc_profiles MODIFY embedding_json LONGTEXT"))
            except Exception:
                # Safe to ignore (already correct type or non-MySQL dialect)
                pass
        except SQLAlchemyError as e:
            print(f"[KYC] DB init error: {e}")
            _engine = None
            _SessionLocal = None
            
    # Init Whitelist DB
    if _whitelist_engine is None:
        try:
            _whitelist_engine = create_engine(WHITELIST_DB_URL, pool_pre_ping=True)
            _WhitelistSessionLocal = sessionmaker(bind=_whitelist_engine, autoflush=False, autocommit=False)
            # We do NOT create tables for whitelist as it exists in another DB
        except SQLAlchemyError as e:
            print(f"[KYC] Whitelist DB init error: {e}")
            _whitelist_engine = None
            _WhitelistSessionLocal = None


def get_session():
    if _SessionLocal is None:
        init_db()
    if _SessionLocal is None:
        return None
    return _SessionLocal()

def get_whitelist_session():
    if _WhitelistSessionLocal is None:
        init_db()
    if _WhitelistSessionLocal is None:
        return None
    return _WhitelistSessionLocal()


def save_kyc_profile(candidate_id: str, embedding: List[float], image_path: str) -> bool:
    sess = get_session()
    if sess is None:
        return False
    try:
        existing = sess.query(KYCProfile).filter_by(candidate_id=candidate_id).first()
        if existing:
            existing.embedding_json = json.dumps(embedding)
            existing.image_path = image_path
        else:
            profile = KYCProfile(
                candidate_id=candidate_id,
                embedding_json=json.dumps(embedding),
                image_path=image_path
            )
            sess.add(profile)
        sess.commit()
        return True
    except SQLAlchemyError as e:
        sess.rollback()
        print(f"[KYC] Save error: {e}")
        return False
    finally:
        sess.close()


def get_kyc_embedding(candidate_id: str) -> Optional[List[float]]:
    sess = get_session()
    if sess is None:
        return None
    try:
        profile = sess.query(KYCProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            return None
        try:
            return json.loads(profile.embedding_json)
        except json.JSONDecodeError as e:
            print(f"[KYC] JSON decode error for {candidate_id}: {e}")
            return None
    except SQLAlchemyError as e:
        print(f"[KYC] Fetch error: {e}")
        return None
    finally:
        sess.close()


def delete_kyc_profile(candidate_id: str) -> bool:
    sess = get_session()
    if sess is None:
        return False
    try:
        profile = sess.query(KYCProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            return False
        sess.delete(profile)
        sess.commit()
        return True
    except SQLAlchemyError as e:
        sess.rollback()
        print(f"[KYC] Delete error: {e}")
        return False
    finally:
        sess.close()


def get_whitelist_images(email: str, session_id: int) -> List[str]:
    """
    Fetch whitelist image URLs for a given email and session_id from the exam database.
    """
    sess = get_whitelist_session()
    if sess is None:
        print("[KYC] Whitelist session is None")
        return []
    try:
        # Query the whitelist table
        results = sess.query(Whitelist.avatar_urls).filter(
            Whitelist.email == email,
            Whitelist.exam_session_id == session_id
        ).all()
        
        urls = []
        for r in results:
            val = r[0]
            if not val:
                continue

            # 1. Try JSON parsing (handles ["url1", "url2"])
            try:
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    urls.extend([str(u).strip() for u in parsed])
                    continue
                if isinstance(parsed, str):
                    urls.append(parsed.strip())
                    continue
            except (json.JSONDecodeError, TypeError):
                pass

            # 2. Fallback: Comma separated or raw string
            # Remove brackets if they exist (simple cleanup)
            cleaned = val.strip()
            if cleaned.startswith('[') and cleaned.endswith(']'):
                cleaned = cleaned[1:-1]
            
            # Split by comma
            parts = [p.strip() for p in cleaned.split(',')]
            
            # Clean quotes from parts
            for p in parts:
                p = p.strip()
                if (p.startswith('"') and p.endswith('"')) or (p.startswith("'") and p.endswith("'")):
                    p = p[1:-1]
                if p:
                    urls.append(p)
                    
        return [u for u in urls if u]
    except SQLAlchemyError as e:
        print(f"[KYC] Whitelist fetch error: {e}")
        return []
    finally:
        sess.close()


def save_cheating_log(
    exam_session_id: str,
    candidate_id: str,
    incident_type: str,
    severity_level: str,
    description: str,
    timestamp: int,
    proof_path: Optional[str] = None
) -> bool:
    sess = get_session()
    if sess is None:
        return False
    try:
        log = CheatingLog(
            exam_session_id=exam_session_id,
            candidate_id=candidate_id,
            incident_type=incident_type,
            severity_level=severity_level,
            description=description,
            timestamp=timestamp,
            proof_path=proof_path
        )
        sess.add(log)
        sess.commit()
        return True
    except SQLAlchemyError as e:
        sess.rollback()
        print(f"[KYC] Save cheating log error: {e}")
        return False
    finally:
        sess.close()
