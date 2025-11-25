"""
Base Analyzer - Abstract interface for all AI analyzers
Ensures consistent API between MockAIAnalyzer and RealAIAnalyzer
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional
import time


class BaseAnalyzer(ABC):
    """
    Abstract base class for AI analyzers
    
    All analyzer implementations (Mock, Real) must inherit from this
    and implement the analyze_frame method with consistent signature.
    """
    
    @abstractmethod
    def analyze_frame(
        self, 
        candidate_id: str, 
        room_id: str,
        frame_data: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a single frame from candidate
        
        Args:
            candidate_id: Unique identifier for candidate
            room_id: Room identifier
            frame_data: Optional dict containing:
                - camera: {"image": np.ndarray, "timestamp": int}
                - screen: {"image": np.ndarray, "timestamp": int}
                - audio: {"buffer": np.ndarray, "timestamp": int}
        
        Returns:
            Dict containing:
                - timestamp: int (milliseconds)
                - candidate_id: str
                - room_id: str
                - analyses: List[Dict] (5 analysis types)
                - scenario: str (optional, for debugging)
        
        Note:
            - Mock analyzer ignores frame_data (generates random)
            - Real analyzer requires frame_data for inference
        """
        pass
    
    def _create_base_response(
        self, 
        candidate_id: str, 
        room_id: str
    ) -> Dict:
        """Create base response structure"""
        return {
            "timestamp": int(time.time() * 1000),
            "candidate_id": candidate_id,
            "room_id": room_id,
            "analyses": []
        }
