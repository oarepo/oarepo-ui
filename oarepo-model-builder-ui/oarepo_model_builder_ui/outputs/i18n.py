from oarepo_model_builder.outputs import OutputBase
from pathlib import Path
import polib
import datetime


class POWrapper:
    """
    wrapper for polib.POFile that adds lookup dictionary for entries (to speed up adding new entries)
    """

    def __init__(self, po) -> None:
        self.po = po
        self.lookup = {}
        for entry in po:
            self.lookup[entry.msgid] = entry

    def add(self, key, value):
        if key in self.lookup:
            entry = self.lookup[key]
            if not entry.msgstr:
                entry.msgstr = value
        else:
            entry = polib.POEntry(msgid=key, msgstr=value)
            self.po.append(entry)
            self.lookup[key] = entry

    def save(self):
        return str(self.po)

    def save_binary(self):
        return self.po.to_binary()


class POOutput(OutputBase):
    TYPE = "po"

    def begin(self):
        languages = self.builder.schema.settings.i18n_languages
        self.languages = languages
        self.po_files = {}

        for lang in languages:
            lang_path = Path(self.path) / lang / "LC_MESSAGES" / "messages.po"
            self._init_lang_path(lang, lang_path)
        self._init_lang_path(None, Path(self.path) / "messages.pot")

    def _init_lang_path(self, lang, lang_path):
        if self.builder.filesystem.exists(lang_path):
            with self.builder.filesystem.open(lang_path) as f:
                self.po_files[lang] = POWrapper(polib.pofile(f.read()))
        else:
            po_file = polib.POFile()
            po_file.metadata = {
                "Project-Id-Version": "1.0",
                "POT-Creation-Date": datetime.datetime.now().isoformat(),
                "PO-Revision-Date": datetime.datetime.now().isoformat(),
                "MIME-Version": "1.0",
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Transfer-Encoding": "8bit",
            }
            self.po_files[lang] = POWrapper(po_file)

    def finish(self):
        for lang, po_file in self.po_files.items():
            if lang is None:
                self.builder.filesystem.mkdir(self.path)
                path = Path(self.path) / "messages.pot"

                with self.builder.filesystem.open(path, "w") as f:
                    f.write(po_file.save())

            else:
                locale_dir = Path(self.path) / lang / "LC_MESSAGES"
                self.builder.filesystem.mkdir(locale_dir)
                path = locale_dir / "messages.po"

                with self.builder.filesystem.open(path, "w") as f:
                    f.write(po_file.save())

                path = locale_dir / "messages.mo"
                with self.builder.filesystem.open(path, "wb") as f:
                    f.write(po_file.save_binary())

    def add(self, key, value="", language=None):
        if language is None:
            for pf in self.po_files.values():
                pf.add(key, value)
        else:
            self.po_files[language].add(key, value)

    @property
    def created(self):
        return True
