Convert rtf to markdown

(works with unified as part of a pipeline.)

Parses bold, italic, strikeout, and rudimentary headings and scene breaks. (This is all I need, I'm writing fiction.)

Also strips Scrivener annotations, which are kind of a horrifying quoted-RTF-in-RTF thingy.

```
rtf2md file.rtf > file.md
```
