#!/bin/bash

set -e

OAREPO_VERSION="${OAREPO_VERSION:-11}"
OAREPO_VERSION_MAX=$((OAREPO_VERSION+1))


VENV=".venv"

if test -d $VENV ; then
  rm -rf $VENV
fi

python3 -m venv $VENV
. $VENV/bin/activate
pip install -U setuptools pip wheel

pip install "oarepo>=${OAREPO_VERSION},<${OAREPO_VERSION_MAX}"
pip install -e ".[tests]"

pip uninstall -y uritemplate
pip install uritemplate

invenio index destroy --force --yes-i-know || true

pytest tests
