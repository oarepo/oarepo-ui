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