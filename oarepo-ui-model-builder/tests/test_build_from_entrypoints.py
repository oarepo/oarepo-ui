import json
import os
import re

import json5
import pytest
from oarepo_model_builder.entrypoints import load_model, create_builder_from_entrypoints
from io import StringIO
from pathlib import Path
from typing import Dict

from oarepo_model_builder.fs import AbstractFileSystem
import yaml


class MockFilesystem(AbstractFileSystem):
    def __init__(self):
        self.files: Dict[str, StringIO] = {}

    def open(self, path: str, mode: str = "r"):
        path = Path(path).absolute()
        if mode == "r":
            if not path in self.files:
                raise FileNotFoundError(f"File {path} not found. Known files {[f for f in self.files]}")
            return StringIO(self.files[path].getvalue())
        self.files[path] = StringIO()
        self.files[path].close = lambda: None
        return self.files[path]

    def exists(self, path):
        path = Path(path).absolute()
        return path in self.files

    def mkdir(self, path):
        pass

    def read(self, path):
        with self.open(path) as f:
            return f.read()

    def snapshot(self):
        ret = {}
        for fname, io in self.files.items():
            ret[fname] = io.getvalue()
        return ret


def test_array_object(create_app):
    schema = load_model(
        "test.yaml",
        "test",
        model_content={
            "oarepo:use": "invenio",
            'settings': {
                'package': 'record_test',
            },
            '$defs': {
                'justStr': {
                    'type': 'fulltext',
                    'oarepo:ui': {
                        'detail': {
                            "component": "raw",
                            "dataField": ""

                        },
                        'search': {
                            "component": "raw",
                            "dataField": ""
                        }
                    }
                },
                'authority': {
                    'type': 'object',
                    'properties': {
                        'name': {
                            'properties': {
                                'last_name':
                                    {
                                        'type': 'fulltext',
                                        'minLength': 5,
                                        'oarepo:ui': {
                                            'detail': {
                                                "component": "raw",
                                                "dataField": ""

                                            }, 'search': {
                                                "component": "raw",
                                                "dataField": ""
                                            }
                                        }
                                    },
                                'first_name':
                                    {
                                        'type': 'fulltext',
                                        'minLength': 5,
                                    }
                            },
                            'oarepo:ui': {
                                'detail': {
                                    'component': 'row',
                                    'separator': '_',
                                    'columns': [
                                        'first_name',
                                        'last_name'
                                    ]
                                },
                                'search': {
                                    'component': 'column',
                                    'items': [
                                        'first_name',
                                        'last_name'
                                    ]
                                }
                            }

                        },
                        'age': {
                            'type': 'fulltext',
                            'minLength': 5,
                            'oarepo:ui': {
                                'detail': {
                                    "component": "raw",
                                    "dataField": ""

                                }, 'search': {
                                    "component": "raw",
                                    "dataField": ""
                                }
                            }
                        }

                    },
                    'oarepo:ui': {
                        'detail': {
                            'component': 'row',
                            'separator': '_',
                            'columns': [
                                'name',
                                'age'
                            ]
                        },
                        'search': {
                            'component': 'column',
                            'items': [
                                'name',
                                'age'
                            ]
                        }
                    }
                }
            },
            'model': {
                'properties': {
                    'metadata': {
                        'properties': {
                            'text': {
                                'type': 'fulltext',
                                'oarepo:ui': {
                                    'detail': {
                                        "component": "raw",
                                        "dataField": "text"

                                    },
                                    'search': {
                                        "component": "raw",
                                        "dataField": "text"
                                    }
                                }
                            },
                            'contributors[]': {
                                'oarepo:use': '#/$defs/authority',
                                'oarepo:ui[]': {
                                    'detail': {
                                        'component': 'column',
                                        'dataField': ''
                                    },
                                    'search': {
                                        'component': 'column',
                                        'dataField': ''
                                    }}
                            },
                            'title[]': {
                                'oarepo:use': '#/model/properties/metadata/properties/text',
                                'oarepo:ui[]': {
                                    'detail': {
                                        'component': 'column',
                                        'dataField': ''
                                    },
                                    'search': {
                                        'component': 'column',
                                        'dataField': ''
                                    }}
                            }

                        }
                    }
                }
            },
            'oarepo:sample': {
                'count': 50
            },
            'oarepo:ui': {
                'detail': {
                    'component': 'row',
                    'columns':
                        ['title', 'text', 'contributors']

                },
                'search': {
                    'component': 'column',
                    'items': ['title', 'contributors']
                }

            }
        },
        isort=False,
        black=False,
    )

    filesystem = MockFilesystem()
    builder = create_builder_from_entrypoints(filesystem=filesystem)

    builder.build(schema, "")
    data = builder.filesystem.open(os.path.join("ui", "layout.yaml")).read()
    # data = builder.filesystem.open(os.path.join("test","records", "jsonschemas", "test-1.0.0.json"))
    data = json.loads(data)
    # data = json5.load(data)
    expected = {'detail': {'component': 'row', 'columns': [{'component': 'column', 'dataField': 'title', 'items': {'component': 'raw', 'dataField': 'text'}}, {'component': 'raw', 'dataField': 'text'}, {'component': 'column', 'dataField': 'contributors', 'items': {'component': 'row', 'separator': '_', 'columns': [{'component': 'row', 'separator': '_', 'columns': [{'component': 'raw', 'dataField': 'name.last_name'}, {'component': 'raw', 'dataField': 'name.first_name'}]}, {'component': 'raw', 'dataField': 'age'}]}}]}, 'search': {'component': 'column', 'items': [{'component': 'column', 'dataField': 'title', 'items': {'component': 'raw', 'dataField': 'text'}}, {'component': 'column', 'dataField': 'contributors', 'items': {'component': 'column', 'items': [{'component': 'column', 'items': [{'component': 'raw', 'dataField': 'name.last_name'}, {'component': 'raw', 'dataField': 'name.first_name'}]}, {'component': 'raw', 'dataField': 'age'}]}}]}}
    assert data == expected

def test_leveled_object(create_app):
    schema = load_model(
        "test.yaml",
        "test",
        model_content={
            "oarepo:use": "invenio",
            'settings': {
                'package': 'record_test',
            },
            'model': {
                'properties': {
                    'metadata': {
                        'properties': {
                            'author': {
                                'type': 'object',
                                'properties': {
                                    'last_name':
                                        {
                                            'type': 'object',
                                            'properties': {
                                                'a': {
                                                    'type': 'keyword',
                                                    'oarepo:ui': {
                                                        'detail': {
                                                            "component": "raw",
                                                            "dataField": ""

                                                        }, 'search': {
                                                            "component": "raw",
                                                            "dataField": ""
                                                        }
                                                    }
                                                },
                                                'b': {
                                                    'type': 'keyword',
                                                    'oarepo:ui': {
                                                        'detail': {
                                                            "component": "raw",
                                                            "dataField": ""

                                                        }, 'search': {
                                                            "component": "raw",
                                                            "dataField": ""
                                                        }
                                                    }
                                                }
                                            },
                                            'oarepo:ui': {
                                                'detail': {
                                                    "component": "row",
                                                    "columns": [
                                                        'a', 'b'
                                                    ]

                                                }, 'search': {
                                                    "component": "row",
                                                    "columns": [
                                                        'a', 'b'
                                                    ]
                                                }
                                            }
                                        },
                                    'first_name':
                                        {
                                            'type': 'fulltext',
                                            'minLength': 5,

                                        }
                                },
                                'oarepo:ui': {
                                    'detail': {
                                        'component': 'row',
                                        'separator': '_',
                                        'columns': [
                                            'first_name',
                                            'last_name'
                                        ]
                                    },
                                    'search': {
                                        'component': 'column',
                                        'items': [
                                            'last_name',
                                            'first_name',
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'oarepo:sample': {
                'count': 50
            },
            'oarepo:ui': {
                'detail': {
                    'component': 'row',
                    'columns':
                        ['author']

                },
                'search': {
                    'component': 'column',
                    'items': [
                        'author', 'author.first_name'

                    ]
                }

            }
        },
        isort=False,
        black=False,
    )

    filesystem = MockFilesystem()
    builder = create_builder_from_entrypoints(filesystem=filesystem)

    builder.build(schema, "")
    data = builder.filesystem.open(os.path.join("ui", "layout.yaml")).read()
    data = json.loads(data)
    expected = {'detail': {'component': 'row', 'columns': [{'component': 'row', 'separator': '_', 'columns': [{'component': 'raw', 'dataField': 'author.first_name'}, {'component': 'row', 'columns': [{'component': 'raw', 'dataField': 'author.last_name.a'}, {'component': 'raw', 'dataField': 'author.last_name.b'}]}]}]}, 'search': {'component': 'column', 'items': [{'component': 'column', 'items': [{'component': 'row', 'columns': [{'component': 'raw', 'dataField': 'author.last_name.a'}, {'component': 'raw', 'dataField': 'author.last_name.b'}]}, {'component': 'raw', 'dataField': 'author.first_name'}]}, {'component': 'raw', 'dataField': 'author.first_name'}]}}

    assert data == expected

def test_noui(create_app):
    schema = load_model(
        "test.yaml",
        "test",
        model_content={
            "oarepo:use": "invenio",
            'settings': {
                'package': 'record_test',
            },
            'model': {
                'properties': {
                    'metadata': {
                        'properties': {
                            'test': {
                                'type': 'fulltext',
                                'oarepo:ui': {
                                    'detail': {
                                        'component': 'raw',
                                        'dataField': ""
                                    },
                                    'search': {
                                        'component': 'raw',
                                        'dataField': ""

                                    }
                                }
                            }
                        }
                    }
                }
            },
            'oarepo:sample': {
                'count': 50
            }
        },
        isort=False,
        black=False,
    )

    filesystem = MockFilesystem()
    builder = create_builder_from_entrypoints(filesystem=filesystem)

    builder.build(schema, "")
    # data = builder.filesystem.open(os.path.join("test", "records", "mappings", "v7", "test", "test-1.0.0.json")).read()
    data = builder.filesystem.open(os.path.join("ui", "layout.yaml")).read()
    data = json.loads(data)
    expected = {}
    assert  data == expected
def test_basic(create_app):
    schema = load_model(
        "test.yaml",
        "test",
        model_content={
            "oarepo:use": "invenio",
            'settings': {
                'package': 'record_test',
            },
            'model': {
                'properties': {
                    'metadata': {
                        'properties': {
                            'author': {
                                'type': 'object',
                                'properties': {
                                    'last_name':
                                        {
                                            'type': 'fulltext',
                                            'minLength': 5,
                                            'oarepo:ui': {
                                                'detail': {
                                                    "component": "raw",
                                                    "dataField": ""

                                                }, 'search': {
                                                    "component": "raw",
                                                    "dataField": ""
                                                }
                                            }
                                        },
                                    'first_name':
                                        {
                                            'type': 'fulltext',
                                            'minLength': 5,
                                            'oarepo:ui': {
                                                'detail': {
                                                    "component": "raw",
                                                    "dataField": ""

                                                }, 'search': {
                                                    "component": "raw",
                                                    "dataField": ""
                                                }
                                            }
                                        }
                                },
                                'oarepo:ui': {
                                    'detail': {
                                        'component': 'row',
                                        'separator': '_',
                                        'columns': [
                                            'first_name',
                                            'last_name'
                                        ]
                                    },
                                    'search': {
                                        'component': 'column',
                                        'items': [
                                            'last_name',
                                            'first_name',
                                        ]
                                    }
                                }
                            },
                            'bezui': {
                                'type': 'fulltext',
                                'minLength': 5
                            },
                            'title': {
                                'type': 'fulltext',
                                'minLength': 5,
                                'oarepo:sample': {
                                    'faker': 'name'
                                },
                                'oarepo:ui': {
                                    'detail': {
                                        'component': 'raw',
                                        'dataField': ""
                                    },
                                    'search': {
                                        'component': 'raw',
                                        'dataField': ""

                                    }
                                }
                            }
                        }
                    }
                }
            },
            'oarepo:sample': {
                'count': 50
            },
            'oarepo:ui': {
                'detail': {
                    'component': 'column',
                    'items': [
                        {
                            "component": "icon",
                            "name": "thumbs up",
                            "color": "green",
                            "size": "large"
                        }, 'author', 'title'
                    ]
                },
                'search': {
                    'component': 'row',
                    'columns': [
                        {
                            "component": "list",
                            "name": "thumbs up",
                            "color": "green",
                            "size": "large"
                        },
                        'author.first_name',
                        'title'
                    ]
                }

            }
        },
        isort=False,
        black=False,
    )

    filesystem = MockFilesystem()
    builder = create_builder_from_entrypoints(filesystem=filesystem)

    builder.build(schema, "")
    # data = builder.filesystem.open(os.path.join("test", "records", "mappings", "v7", "test", "test-1.0.0.json")).read()
    data = builder.filesystem.open(os.path.join("ui", "layout.yaml")).read()
    data = json.loads(data)
    expected = {
        'detail': {'component': 'column',
                   'items': [{'component': 'icon', 'name': 'thumbs up', 'color': 'green', 'size': 'large'},
                             {'component': 'row', 'separator': '_',
                              'columns': [{'component': 'raw', 'dataField': 'author.first_name'},
                                        {'component': 'raw', 'dataField': 'author.last_name'}]},
                             {'component': 'raw', 'dataField': 'title'}]}, 'search': {'component': 'row', 'columns': [
            {'component': 'list', 'name': 'thumbs up', 'color': 'green', 'size': 'large'},
            {'component': 'raw', 'dataField': 'author.first_name'}, {'component': 'raw', 'dataField': 'title'}]}

    }

    assert data == expected
