# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 10.04.2019

### Fixed

- Fix completion inside `\( \)`. ([#14](https://github.com/latex-lsp/texlab/issues/14))
- Do not crash on invalid requests.

## [0.4.1] - 30.03.2019

### Changed

- Improve startup time

### Fixed

- Improve MiKTeX support ([#8](https://github.com/latex-lsp/texlab-vscode/issues/8))

## [0.4.0] - 09.03.2019

### Added

- Add linting support for LaTeX via [ChkTeX](https://www.nongnu.org/chktex/)

### Changed

- Analyze referenced files that are not part of the current workspace
- Improve completion for includes
- Improve performance of completion

## [0.3.1] - 05.03.2019

### Fixed

- Fix extension bundle

## [0.3.0] - 05.03.2019

### Added

- Show preview when hovering over math expressions
- Show package name when hovering over a command

### Changed

- Store completion database in `~/.texlab` directory

### Fixed

- Fix crash when editing a BibTeX file
- Fix crash when hovering over invalid BibTeX entries
- Fix a bug where the completion does not get triggered correctly

## [0.2.0] - 01.03.2019

### Added

- Show bibliography when completing citations
- Show bibliography when hovering over citations
- Completion for equation references

### Fixed

- Fix completion of file includes
- Prevent server crash when opening a locked file

## [0.1.2] - 16.02.2019

### Fixed

- Do not display an error when PDF viewers return a non-zero
  exit code while performing forward search

## [0.1.1] - 15.02.2019

### Changed

- Reduce installation size

### Fixed

- Fix rendering of completion symbols

## [0.1.0] - 15.02.2019

- Initial release
