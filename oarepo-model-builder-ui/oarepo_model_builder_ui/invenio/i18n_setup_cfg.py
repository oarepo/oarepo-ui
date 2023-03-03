from oarepo_model_builder.utils.jinja import package_name

from oarepo_model_builder.builders import OutputBuilder
from oarepo_model_builder.outputs.cfg import CFGOutput


class InvenioI18NSetupCfgBuilder(OutputBuilder):
    TYPE = "invenio_i18n_setup_cfg"

    def finish(self):
        super().finish()

        output: CFGOutput = self.builder.get_output("cfg", "setup.cfg")

        translation_package = package_name(self.current_model.package)

        output.add_entry_point(
            "invenio_i18n.translations",
            self.current_model.translations_setup_cfg,
            translation_package,
        )
