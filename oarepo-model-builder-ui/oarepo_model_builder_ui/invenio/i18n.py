from collections import defaultdict
from pathlib import Path
from oarepo_model_builder.builders import OutputBuilder

from oarepo_model_builder.builder import ModelBuilder
from oarepo_model_builder.property_preprocessors import PropertyPreprocessor
from typing import List

from oarepo_model_builder.builders import process
from oarepo_model_builder_ui.config import UI_ITEMS


class InvenioI18nBuilder(OutputBuilder):
    TYPE = "invenio_i18n"
    output_file_type = "po"

    def __init__(
        self, builder: ModelBuilder, property_preprocessors: List[PropertyPreprocessor]
    ):
        super().__init__(builder, property_preprocessors)

    def begin(self, schema, settings):
        super().begin(schema, settings)
        self.output = self.builder.get_output(
            "po", Path(self.current_model.package) / "translations"
        )

    @process("**", condition=lambda current, stack: stack.schema_valid)
    def model_element(self):
        schema_element_type = self.stack.top.schema_element_type

        if schema_element_type == "property":
            ui_items = defaultdict(dict)
            for el, val in self.stack.top.data.items():
                for ui in UI_ITEMS:
                    if el.startswith(f"{ui}."):
                        ui_items[ui][el[len(ui) + 1 :]] = val
            for ui in UI_ITEMS:
                if "key" not in ui_items[ui]:
                    ui_items[ui]["key"] = (
                        "/".join(
                            x.key
                            for x in self.stack
                            if x.schema_element_type == "property" and x.key
                        )
                        + f".{ui}"
                    )
            for ui, langs in ui_items.items():
                key = langs.pop("key")
                for lang, val in langs.items():
                    self.output.add(key, val, language=lang)
                self.output.add(key)

        self.build_children()
