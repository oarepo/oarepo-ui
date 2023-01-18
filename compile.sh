#!/bin/bash

set -e

cd "$(dirname $0)"

# prepare virtualenv

MB_VENV=.venv-model-builder
MB_BIN=${MB_VENV}/bin
MB_PIP=${MB_BIN}/pip

if [ ! -d ${MB_VENV} ] ; then
  python3.10 -m venv ${MB_VENV}

  ${MB_PIP} install -U pip
  ${MB_PIP} install -U setuptools wheel

  # install model builder main package
  ${MB_PIP} install 'oarepo-model-builder>=2.0.0'

  # install required plugins
  
fi

${MB_BIN}/oarepo-compile-model -vvv model_app.yaml --output-directory oarepo-ui
 # --save-model model_included.yaml

cp oarepo-ui/oarepo_ui/models/inherited_model.json \
   oarepo-ui-model-builder/oarepo_ui_model_builder/models/model.json
