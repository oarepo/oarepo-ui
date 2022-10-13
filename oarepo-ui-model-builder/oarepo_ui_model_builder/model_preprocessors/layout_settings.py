from oarepo_model_builder.model_preprocessors import ModelPreprocessor

class LayoutSettingsPreprocessor(ModelPreprocessor):
    def transform(self, schema, settings):
        settings.setdefault("layout", "ui/layout.yaml")