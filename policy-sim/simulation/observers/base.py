"""Observer ABC — defines the reaction interface for simulation run loops."""

from abc import ABC, abstractmethod
from typing import Any


class Observer(ABC):
    """Abstract base for archetype reaction observers."""

    @abstractmethod
    def evaluate(self, suggestions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Given briefings from the supervisor, return reaction dicts.

        Return reactions that need recording. Return ``[]`` if reactions
        were already recorded externally.
        """
        ...

    @property
    def source(self) -> str:
        """Provenance label for this observer (e.g. 'archetype', 'external')."""
        return "observer"
