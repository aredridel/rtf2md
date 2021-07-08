const rtf = require("rtf-parser");
const util = require("util");
const parseRTF = util.promisify(rtf.string);

module.exports = async function rtf2md(text) {
  const rtf = await parseRTF(text);

  let out = [];

  let inScrivenerAnnotation = false;

  let pendingFreeSpans = [];
  for (const node of rtf.content) {
    if (node.constructor.name == "RTFSpan") {
      pendingFreeSpans.push(node);
    } else {
      if (pendingFreeSpans.length) {
        out.push({
          type: "paragraph",
          children: pendingFreeSpans.map(span2md),
        });
        pendingFreeSpans = [];
      }
      if (node.content.every((span) => span.value.trim() == "")) {
        out.push({ type: "thematicBreak" });
        continue;
      }

      for (const span of node.content) {
        span.value = span.value.replace(/<[$]Scr[^>]+>/g, "");
      }

      let scrivStart = inScrivenerAnnotation
        ? 0
        : node.content.findIndex((span) =>
            span.value.includes("{\\Scrv_annot")
          );
      if (scrivStart != -1) {
        inScrivenerAnnotation = true;
      }

      if (inScrivenerAnnotation) {
        let scrivEnd = node.content.findIndex((span) =>
          span.value.includes("\\end_Scrv_annot}")
        );
        if (scrivEnd == -1) {
          scrivEnd = node.content.length;
        } else {
          inScrivenerAnnotation = false;
        }

        node.content.splice(scrivStart, scrivEnd - scrivStart + 1);
      }

      if (!node.content.length) continue;

      out.push(
        Object.assign(
          rtf.style.fontSize && node.style.fontSize > rtf.style.fontSize
            ? {
                type: "heading",
                depth: 1,
              }
            : { type: "paragraph" },
          {
            children: node.content.map(span2md),
          }
        )
      );
    }
  }

  if (pendingFreeSpans.length) {
    out.push({
      type: "paragraph",
      children: pendingFreeSpans.map(span2md),
    });
  }

  return { type: "root", children: out };
};

function span2md(span) {
  let nesting = [];
  if (span.value) {
    if (span.style.italic || span.style.underline) {
      nesting.push("emphasis");
    }
    if (span.style.bold) {
      nesting.push("strong");
    }
    if (span.style.strikethrough) {
      nesting.push("delete");
    }
  }

  let node = { type: "text", value: span.value };

  for (const t of nesting) {
    node = { type: t, children: [node] };
  }

  return node;
}
