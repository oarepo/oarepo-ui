#!/bin/bash

if [ -d .venv-builder ] ; then 
    rm -rf .venv-builder
fi

python3 -m venv .venv-builder

.venv-builder/bin/pip install -e .

if [ -d tests/mock_record ] ; then 
    rm -rf tests/mock_record
fi

.venv-builder/bin/oarepo-compile-model tests/model.json --output-directory tests/mock_record -vvv

if [ -d .venv ] ; then 
    rm -rf .venv
fi

python3 -m venv .venv

source .venv/bin/activate
pip install -e 'tests/mock_record'
pip install pytest-invenio invenio-app 'invenio-search[opensearch2]' flask-babelex

pytest tests
