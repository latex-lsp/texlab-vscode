# TexLab

A [Visual Studio Code](https://code.visualstudio.com) extension with rich editing support for the
[LaTeX](https://www.latex-project.org) typesetting system powered by the [TexLab](https://github.com/efoerster/texlab) language server.
It aims to produce high quality code completion results by indexing your used packages as you type.

## Requirements

- A TeX distribution of choice. We highly recommend [TeX Live](https://www.tug.org/texlive).
- A [Java 8](https://java.com/en/download) (or later) runtime environment.

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

## Build System

We encourage the use of `latexmk`.
You can use another build system by changing the `latex.build.executable` and `latex.build.args` settings.
However, we will only consider `latexmk` in the following sections.

### Previewing

We see previewing as a concern of the build system.
You can enable the preview feature of `latexmk` by adding the `-pv` (or `-pvc`) flag to the `latex.build.args` setting.

#### SumatraPDF

On Windows, we recommend [SumatraPDF](https://www.sumatrapdfreader.org) as previewer.
You can use SumatraPDF with `latexmk` by adding the following line to your `.latexmkrc` file:

```perl
$pdf_previewer = 'start "C:\Program Files\SumatraPDF\SumatraPDF.exe" %O %S';
```

##### Forward Search

Add the following lines to your Visual Studio Code config:

```json
  "latex.forwardSearch.executable": "C:/Program Files/SumatraPDF/SumatraPDF.exe",
  "latex.forwardSearch.args": [
    "-reuse-instance",
    "%p",
    "-forward-search",
    "%f",
    "%l"
  ]
```

##### Inverse Search

Add the following line to your SumatraPDF settings file (Menu -> Settings -> Advanced Options):

```ini
InverseSearchCmdLine = "C:\Users\{User}\AppData\Local\Programs\Microsoft VS Code\Code.exe" -g "%f":%l
```

Make sure to replace `{User}` with your Windows username.

## Release Notes

See the [Changelog](CHANGELOG.md) for details.
