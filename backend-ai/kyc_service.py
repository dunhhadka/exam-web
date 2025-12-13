import os
import json
import time
from datetime import datetime
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

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), index=True)

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    exam_session_id: Mapped[int] = mapped_column(Integer)
    student_email: Mapped[str] = mapped_column(String(255))
    attempt_no: Mapped[int] = mapped_column(Integer)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

class Log(Base):
    __tablename__ = "logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(Integer)
    log_type: Mapped[str] = mapped_column(String(50)) # Enum as string
    severity: Mapped[str] = mapped_column(String(50)) # Enum as string
    message: Mapped[str] = mapped_column(String(500))
    logged_at: Mapped[datetime] = mapped_column(DateTime)

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
    sess = get_whitelist_session() # Use whitelist session (Exam DB)
    if sess is None:
        return False
    try:
        # 1. Resolve Session ID
        # exam_session_id can be the numeric ID (str or int) or the Code (str)
        session_id_int = None
        
        # Try to parse as integer
        if isinstance(exam_session_id, int):
            session_id_int = exam_session_id
        elif isinstance(exam_session_id, str) and exam_session_id.isdigit():
            session_id_int = int(exam_session_id)
            
        # If not an integer, treat as Code
        if session_id_int is None:
            session_obj = sess.query(ExamSession).filter(ExamSession.code == str(exam_session_id)).first()
            if session_obj:
                session_id_int = session_obj.id
            else:
                print(f"[KYC] Could not resolve session ID from: {exam_session_id}")
                return False

        # 2. Find Attempt using Session ID and Student Email
        attempt = sess.query(ExamAttempt).filter(
            ExamAttempt.exam_session_id == session_id_int,
            ExamAttempt.student_email == candidate_id
        ).order_by(ExamAttempt.attempt_no.desc()).first()

        if not attempt:
            print(f"[KYC] No attempt found for session_id={session_id_int} ({exam_session_id}) and email={candidate_id}")
            return False

        # Map fields
        log_type_map = {
            "A5": "TAB_SWITCH",
            "A6": "FULLSCREEN_EXIT",
            "A7": "COPY_PASTE_ATTEMPT",
            "A8": "DEVTOOLS_OPEN",
        }
        log_type = log_type_map.get(incident_type, "SUSPICIOUS_ACTIVITY")

        severity_map = {
            "S1": "INFO",
            "S2": "WARNING",
            "S3": "SERIOUS",
            "S4": "CRITICAL"
        }
        severity = severity_map.get(severity_level, "INFO")
        
        # Append incident type to message for clarity
        full_message = f"[{incident_type}] {description}"
        if len(full_message) > 500:
            full_message = full_message[:497] + "..."

        log_entry = Log(
            attempt_id=attempt.id,
            log_type=log_type,
            severity=severity,
            message=full_message,
            logged_at=datetime.fromtimestamp(timestamp / 1000.0)
        )
        sess.add(log_entry)
        sess.commit()
        return True
    except SQLAlchemyError as e:
        sess.rollback()
        print(f"[KYC] Save cheating log error: {e}")
        return False
    finally:
        sess.close()
