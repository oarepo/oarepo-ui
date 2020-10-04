"""Setup for test_module."""
from setuptools import setup

setup(
    name="tests",
    version='1.0.0',
    zip_safe=False,
    packages=[],
    entry_points={
        'invenio_i18n.translations': [
            'test_messages = tests',
        ],
    },
    include_package_data=True,
    platforms='any',
    classifiers=[
        'Development Status :: 4 - Beta',
    ],
)
