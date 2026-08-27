# Contributing

Contributions are welcome, and they are greatly appreciated! Every little bit
helps, and credit will always be given. Additional documentation can be found
in the [OARepo documentation](https://nrp-cz.github.io/).

## Types of Contributions

### Report Bugs

Report bugs at <https://github.com/oarepo/oarepo-ui/issues>.

If you are reporting a bug, please include:

- Your operating system name and version.
- Any details about your local setup that might be helpful in troubleshooting.
- Detailed steps to reproduce the bug.

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with "bug" is open
to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with "feature"
is open to whoever wants to implement it.

### Write Documentation

OARepo UI could always use more documentation, whether as part of the
official [NRP docs](https://nrp-cz.github.io/), in README.md, docstrings, or even on
the web in blog posts, articles, and such.

### Submit Feedback

The best way to send feedback is to file an issue at
<https://github.com/oarepo/oarepo-ui/issues>.

If you are proposing a feature:

- Explain in detail how it would work.
- Keep the scope as narrow as possible, to make it easier to implement.
- Remember that this is a volunteer-driven project, and that contributions
  are welcome :)

## Get Started!

Ready to contribute? Here's how to set up `oarepo-ui` for local
development.

1. Fork the `oarepo/oarepo-ui` repo on GitHub.

2. Clone your fork locally:

   ```console
   git clone git@github.com:your_name_here/oarepo-ui.git
   ```

3. Install your local copy into a virtual environment:

   ```console
   cd oarepo-ui/
   ./run.sh venv
   ```

   The `run.sh` script bootstraps the shared OARepo library runner, which
   provides all development commands. Run `./run.sh --help` to see what is
   available.

4. Create a branch for local development:

   ```console
   git checkout -b name-of-your-bugfix-or-feature
   ```

   Now you can make your changes locally.

5. When you're done making changes, check that your changes pass the tests
   and linters:

   ```console
   ./run.sh test
   ./run.sh lint
   ```

   The linter checks code style ([ruff](https://docs.astral.sh/ruff/)),
   type annotations, license headers, and docstring conventions.

6. Commit your changes and push your branch to GitHub:

   ```console
   git add .
   git commit -m "brief description of the change"
   git push origin name-of-your-bugfix-or-feature
   ```

7. Submit a pull request through the GitHub website.

## Pull Request Guidelines

Before you submit a pull request, check that it meets these guidelines:

1. The pull request should include tests and must not decrease test coverage.
2. If the pull request adds functionality, the docs should be updated. Put
   your new functionality into a function with a docstring.
3. Code must be formatted with ruff (`./run.sh format`) and pass
   `./run.sh lint` (ruff, SPDX license headers,
   `from __future__ import annotations`, and type checking).
4. The pull request should work for all supported Python and OARepo versions.
   Check the CI runs on your pull request and make sure that the tests pass.

## License

By contributing to OARepo UI, you agree that your contributions will be
licensed under the terms of the [MIT License](LICENSE).
