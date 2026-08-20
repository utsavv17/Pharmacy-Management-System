from abc import ABC, abstractmethod
from typing import BinaryIO
from app.schemas.invoice import InvoiceExtractionResult

class InvoiceParser(ABC):
    
    @abstractmethod
    def parse(self, file: BinaryIO, filename: str, file_hash: str) -> InvoiceExtractionResult:
        """
        Parse the invoice file and return the extracted data.
        """
        pass
