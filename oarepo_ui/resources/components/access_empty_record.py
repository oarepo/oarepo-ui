from typing import Dict

from .base import UIResourceComponent


class EmptyRecordAccessComponent(UIResourceComponent):
    def empty_record(self, *, empty_data: Dict, **kwargs) -> None:
        """
        Called before an empty record data are returned.

        :param empty_data: empty record data
        """
        empty_data.setdefault("access", {})
        empty_data["access"]["files"] = "public"
        empty_data["access"]["record"] = "public"
