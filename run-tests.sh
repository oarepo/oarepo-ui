#!/usr/bin/env bash
# -*- coding: utf-8 -*-
#
# Copyright (C) 2019 CESNET.
#
# Invenio OpenID Connect is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

# pydocstyle oarepo_ui tests docs && \
isort -rc -c -df . --gitignore && \
check-manifest --ignore ".travis-*,docs/_build*" && \
# sphinx-build -qnNW docs docs/_build/html && \
# python setup.py test
pytest
