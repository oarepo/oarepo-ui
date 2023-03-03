import json

from deepdiff import DeepDiff

from oarepo_model_builder.utils.verbose import log
from oarepo_model_builder.outputs import OutputBase
from oarepo_model_builder.outputs.json_stack import JSONStack

try:
    import json5
except ImportError:
    import json as json5


class LayoutOutput(OutputBase):
    IGNORE_NODE = JSONStack.IGNORED_NODE
    IGNORE_SUBTREE = JSONStack.IGNORED_SUBTREE
    TYPE = "layout"

    def begin(self):
        try:
            with self.builder.filesystem.open(self.path) as f:
                self.original_data = json5.load(f)  # noqa
        except FileNotFoundError:
            self.original_data = None
        except ValueError:
            self.original_data = None

        self.stack = JSONStack()
        self.documents = []
        self.data = {}

    @property
    def created(self):
        return self.original_data is None

    def finish(self):
        self.next_document()
        if not self.documents and self.original_data:
            # nothing generated, keep the file
            return

        self._created = False
        if DeepDiff(self.data, self.original_data):
            self.builder.filesystem.mkdir(self.path.parent)
            log(2, "Saving %s", self.path)
            with self.builder.filesystem.open(self.path, mode="w") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)

    def enter(self, key, el):
        if key is not None:
            self.stack.push(key, el)

    def leave(self):
        if not self.stack.empty:
            self.stack.pop()

    def merge(self, data):
        self.data = data

    def next_document(self):
        if self.stack.value:
            self.stack = JSONStack()
