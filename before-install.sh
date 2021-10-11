#!/usr/bin/env bash
# -*- coding: utf-8 -*-
#
# Copyright (C) 2019 CESNET.
#
# Invenio OpenID Connect is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

pip install --upgrade pip 'setuptools<58.0.0' py
pip install twine wheel coveralls requirements-builder pip-tools
requirements-builder -e $EXTRAS --level=pypi setup.py > .travis-release-requirements.in
pip-compile -U -o .travis-release-requirements.txt .travis-release-requirements.in
cat .travis-release-requirements.txt