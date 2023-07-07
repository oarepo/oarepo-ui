black oarepo_ui tests --target-version py310
autoflake --in-place --remove-all-unused-imports --recursive oarepo_ui tests
isort oarepo_ui tests  --profile black
