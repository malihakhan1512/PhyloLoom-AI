from abc import ABC, abstractmethod
class AIProvider(ABC):
    name: str = "base"
    is_mock: bool = False
    @abstractmethod
    def explain_analysis(self, results: dict, question: str) -> dict:
        raise NotImplementedError
