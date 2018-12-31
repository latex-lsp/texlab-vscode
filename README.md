# TexLab

A Visual Studio Code extension with rich editing support for the [LaTeX](https://www.latex-project.org/) typesetting system powered by the [TexLab](https://github.com/efoerster/texlab) language server. It aims to produce high quality code completion results by indexing your used packages as you type.

## Requirements

- A TeX distribution of choice. We highly recommend [TeX Live](https://www.tug.org/texlive/).
- A [Java 8](https://java.com/en/download/) (or later) runtime environment.

Please make sure that both dependencies are in your `PATH` environment variable.

## Features

#### LaTeX

- Syntax highlighting
- Code completion
- Rename environments, references and citations
- Build support with diagnostics parser
- Document links to included files
- Jump to definition
- Folding

#### BibTeX

- Syntax highlighting
- Code completion
- Rename entries
- Folding

## Extension Settings

#### Build

The default build system is `latexmk`. You can customize this by changing the `latex.build.executable` and `latex.build.args` settings.

## Release Notes

See the [Changelog](CHANGELOG.md) for details.
