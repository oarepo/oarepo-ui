#!/bin/bash

cd $(dirname $0)

source .venv/bin/activate

(
  cd oarepo-ui
  pip install -e '.[tests]'
)

(
  cd oarepo-ui-model-builder
  pip install -e '.[tests]'
)