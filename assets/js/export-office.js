/* =========================================================================
 *  export-office.js —— 简历多格式导出（Word .docx / PowerPoint .pptx）
 *
 *  不依赖任何外部库、不需要联网：
 *   1. 从页面已渲染的简历 DOM 里抽取「大纲」（跟随当前受众视角与编辑内容）
 *   2. 用极简 OOXML 写出真正的 .docx / .pptx（内置 ZIP 打包，仅存储不压缩）
 *
 *  PDF 走浏览器打印（app.js 里的 window.print），这里不重复实现。
 * ====================================================================== */
(function (global) {
  "use strict";

  var BRAND = "4F46E5";     /* 与 style.css 的 --brand 保持一致 */
  var INK = "0F172A";
  var TEXT = "1F2937";
  var MUTED = "64748B";
  var SUB = "475569";
  var LINE = "D8DEEA";

  /* ------------------------------------------------------------------ *
   *  0. 工具：转义 / UTF-8 / CRC32 / ZIP（store 模式）
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var bin = unescape(encodeURIComponent(str));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256), c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /** files: [{name:"ppt/presentation.xml", data:"<xml .../>" | Uint8Array}] */
  function zip(files) {
    var now = new Date();
    var dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xFFFF;
    var dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

    var parts = [], central = [], offset = 0;

    files.forEach(function (f) {
      var nameBytes = utf8(f.name);
      var data = typeof f.data === "string" ? utf8(f.data) : f.data;
      var crc = crc32(data);

      var lh = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);        /* UTF-8 文件名 */
      lv.setUint16(8, 0, true);             /* 不压缩 */
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      parts.push(lh, data);

      var ch = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);
      central.push(ch);

      offset += lh.length + data.length;
    });

    var centralSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    var total = offset + centralSize + 22;
    var out = new Uint8Array(total), pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    central.forEach(function (p) { out.set(p, pos); pos += p.length; });
    out.set(eocd, pos);
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  1. 从页面抽取简历大纲
   * ------------------------------------------------------------------ */
  function txt(el) {
    return el ? (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
  }

  /** <li> 里用 <br> 分行：第一行是主标题，其余是说明 */
  function liLines(li) {
    var parts = li.innerHTML.split(/<br\s*\/?>/i);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var d = document.createElement("div");
      d.innerHTML = parts[i];
      var t = txt(d);
      if (t) out.push(t);
    }
    return out;
  }

  function walkNode(node, out) {
    if (!node || node.nodeType !== 1) return;
    var cls = node.classList || { contains: function () { return false; } };

    if (cls.contains("rs-item")) {
      var head = node.querySelector(".rs-item-head");
      if (head) {
        var ps = [];
        var t = head.querySelector(".rs-item-title");
        var s = head.querySelector(".rs-item-sub");
        var d = head.querySelector(".rs-item-date");
        if (t) ps.push(txt(t));
        if (s) ps.push(txt(s));
        if (d) ps.push(txt(d));
        if (ps.filter(Boolean).length) out.push({ style: "item", text: ps.filter(Boolean).join("　") });
      } else {
        var titleOnly = node.querySelector(".rs-item-title");
        if (titleOnly) out.push({ style: "item", text: txt(titleOnly) });
      }
      Array.prototype.slice.call(node.children).forEach(function (c) {
        if (c.classList.contains("rs-item-head")) return;
        walkNode(c, out);
      });
      return;
    }

    if (node.tagName === "UL" || node.tagName === "OL") {
      Array.prototype.slice.call(node.children).forEach(function (li) {
        var vs = liLines(li);
        if (!vs.length) return;
        out.push({ style: "bullet", text: vs[0] });
        for (var i = 1; i < vs.length; i++) out.push({ style: "sub", text: vs[i] });
      });
      return;
    }

    if (cls.contains("rs-cols")) {
      Array.prototype.slice.call(node.querySelectorAll(".rs-kv")).forEach(function (kv) {
        out.push({ style: "kv", key: txt(kv.querySelector(".k")), text: txt(kv.querySelector(".v")) });
      });
      return;
    }

    if (cls.contains("rs-kv")) {
      out.push({ style: "kv", key: txt(node.querySelector(".k")), text: txt(node.querySelector(".v")) });
      return;
    }

    if (cls.contains("rs-tags")) {
      var tags = Array.prototype.slice.call(node.children).map(txt).filter(Boolean);
      if (tags.length) out.push({ style: "meta", text: tags.join(" · ") });
      return;
    }

    if (cls.contains("rs-item-meta") || cls.contains("rs-desc") || node.tagName === "P") {
      var tt = txt(node);
      if (tt) out.push({ style: "meta", text: tt });
      return;
    }

    /* 未知容器：继续往下拆，最后兜底取整块文字 */
    var kids = Array.prototype.slice.call(node.children);
    if (kids.length) {
      kids.forEach(function (c) { walkNode(c, out); });
    } else {
      var t2 = txt(node);
      if (t2) out.push({ style: "meta", text: t2 });
    }
  }

  function extractOutline() {
    var sheet = document.getElementById("resumeSheet");
    if (!sheet) return null;

    var contacts = Array.prototype.slice.call(sheet.querySelectorAll(".rs-contacts > span"))
      .map(txt).filter(Boolean);

    var sections = Array.prototype.slice.call(sheet.querySelectorAll(".rs-sec")).map(function (sec) {
      var title = txt(sec.querySelector(".rs-sec-title"));
      var lines = [];
      Array.prototype.slice.call(sec.children).forEach(function (c) {
        if (c.classList.contains("rs-sec-title")) return;
        walkNode(c, lines);
      });
      return { title: title, lines: lines };
    }).filter(function (s) { return s.title || s.lines.length; });

    /* 求职概况那一块没有 .rs-sec-title 之外的包装，单独收集 */
    var summaryEl = sheet.querySelector(".rs-summary, .rs-sec p");
    var summary = summaryEl ? txt(summaryEl) : "";

    return {
      name: txt(sheet.querySelector(".rs-name")),
      enName: txt(sheet.querySelector(".rs-en")),
      title: txt(sheet.querySelector(".rs-title")),
      contacts: contacts,
      summary: summary,
      sections: sections,
      date: new Date().toLocaleDateString("zh-CN")
    };
  }

  /* ------------------------------------------------------------------ *
   *  2. Word（.docx）
   * ------------------------------------------------------------------ */
  function wRun(text, o) {
    o = o || {};
    var rPr = '<w:rPr><w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:eastAsia="微软雅黑" w:cs="Segoe UI"/>'
      + (o.bold ? "<w:b/><w:bCs/>" : "")
      + (o.color ? '<w:color w:val="' + o.color + '"/>' : "")
      + (o.size ? '<w:sz w:val="' + o.size + '"/><w:szCs w:val="' + o.size + '"/>' : "")
      + "</w:rPr>";
    return "<w:r>" + rPr + '<w:t xml:space="preserve">' + esc(text) + "</w:t></w:r>";
  }

  function wPara(runs, o) {
    o = o || {};
    var sp = o.before || o.after || o.line
      ? '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"'
        + ' w:line="' + (o.line || 264) + '" w:lineRule="auto"/>'
      : "";
    var ind = o.ind
      ? '<w:ind w:left="' + o.ind + '" w:right="0" w:hanging="' + (o.hanging || 0) + '"/>'
      : "";
    var bd = o.border
      ? '<w:pBdr><w:bottom w:val="single" w:sz="' + (o.borderSize || 6) + '" w:space="3" w:color="'
        + o.border + '"/></w:pBdr>'
      : "";
    /* 注意：Word 对 pPr 子元素顺序敏感，必须是 pBdr → spacing → ind */
    return "<w:p><w:pPr>" + bd + sp + ind + "</w:pPr>" + runs.join("") + "</w:p>";
  }

  function buildDocxXml(outline) {
    var body = [];

    /* 姓名 + 英文名 */
    body.push(wPara([
      wRun(outline.name || "", { bold: true, size: 40, color: INK }),
      outline.enName ? wRun("　" + outline.enName, { size: 20, color: MUTED }) : ""
    ], { after: 40 }));

    /* 身份 / 定位 */
    if (outline.title) body.push(wPara([wRun(outline.title, { size: 21, color: SUB })], { after: 60 }));

    /* 联系方式 */
    if (outline.contacts && outline.contacts.length) {
      body.push(wPara([wRun(outline.contacts.join("　|　"), { size: 18, color: MUTED })], { after: 120 }));
    }

    /* 顶部粗分隔线 */
    body.push(wPara([], { after: 60, border: BRAND, borderSize: 10 }));

    outline.sections.forEach(function (sec) {
      if (sec.title) {
        body.push(wPara([wRun(sec.title, { bold: true, size: 23, color: BRAND })],
          { before: 220, after: 90, border: LINE, borderSize: 6 }));
      }
      (sec.lines || []).forEach(function (ln) {
        if (ln.style === "item") {
          body.push(wPara([wRun(ln.text, { bold: true, size: 21, color: INK })], { before: 100, after: 30 }));
        } else if (ln.style === "bullet") {
          body.push(wPara([wRun("• " + ln.text, { size: 20, color: TEXT })], { ind: 300, hanging: 200, after: 30 }));
        } else if (ln.style === "sub") {
          body.push(wPara([wRun(ln.text, { size: 19, color: MUTED })], { ind: 480, hanging: 0, after: 20 }));
        } else if (ln.style === "kv") {
          body.push(wPara([
            wRun(ln.key ? ln.key + "：" : "", { bold: true, size: 20, color: INK }),
            wRun(ln.text, { size: 20, color: TEXT })
          ], { after: 30 }));
        } else {
          body.push(wPara([wRun(ln.text, { size: 19, color: SUB })], { after: 30 }));
        }
      });
    });

    body.push(wPara([wRun("本简历由个人主页一键生成 · " + (outline.date || ""), { size: 16, color: "94A3B8" })],
      { before: 320 }));

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + "<w:body>" + body.join("")
      + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
      + '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>'
      + "</w:sectPr></w:body></w:document>";
  }

  function buildDocx(outline) {
    var files = [
      {
        name: "[Content_Types].xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          + '<Default Extension="xml" ContentType="application/xml"/>'
          + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
          + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
          + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
          + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
          + "</Types>"
      },
      {
        name: "_rels/.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
          + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
          + "</Relationships>"
      },
      {
        name: "docProps/core.xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
          + ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"'
          + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
          + "<dc:title>" + esc((outline.name || "") + " 简历") + "</dc:title>"
          + "<dc:creator>" + esc(outline.name || "") + "</dc:creator>"
          + "<cp:lastModifiedBy>" + esc(outline.name || "") + "</cp:lastModifiedBy>"
          + "</cp:coreProperties>"
      },
      {
        name: "docProps/app.xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">'
          + "<Application>Personal Portfolio</Application></Properties>"
      },
      {
        name: "word/_rels/document.xml.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + "</Relationships>"
      },
      {
        name: "word/styles.xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
          + "<w:docDefaults><w:rPrDefault><w:rPr>"
          + '<w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:eastAsia="微软雅黑" w:cs="Segoe UI"/>'
          + '<w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/>'
          + "</w:rPr></w:rPrDefault>"
          + '<w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
          + "</w:docDefaults>"
          + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
          + "</w:styles>"
      },
      { name: "word/document.xml", data: buildDocxXml(outline) }
    ];
    return zip(files);
  }

  /* ------------------------------------------------------------------ *
   *  3. PowerPoint（.pptx）
   * ------------------------------------------------------------------ */
  var EMU_W = 12192000, EMU_H = 6858000;   /* 16:9 */

  function pPr(o) {
    o = o || {};
    var attrs = ' algn="' + (o.align || "l") + '"';
    if (o.marL) attrs += ' marL="' + o.marL + '" indent="' + (-o.marL) + '"';
    var inner = o.bullet
      ? '<a:buFont typeface="Arial"/><a:buChar char="•"/>'
      : "<a:buNone/>";
    return "<a:pPr" + attrs + ">" + inner + "</a:pPr>";
  }

  function aRun(text, o) {
    o = o || {};
    var size = o.size || 1200;
    return "<a:r><a:rPr lang=\"zh-CN\" altLang=\"en-US\" sz=\"" + size + "\""
      + (o.bold ? ' b="1"' : "")
      + ' dirty="0"><a:solidFill><a:srgbClr val="' + (o.color || TEXT) + '"/></a:solidFill>'
      + '<a:latin typeface="微软雅黑"/><a:ea typeface="微软雅黑"/><a:cs typeface="微软雅黑"/>'
      + "</a:rPr><a:t>" + esc(text) + "</a:t></a:r>";
  }

  function p(spaces) {
    var sp = spaces ? '<a:spcBef><a:spcPts val="' + spaces + '"/></a:spcBef>' : "";
    return sp;
  }

  function textBox(id, name, x, y, w, h, paras) {
    return "<p:sp><p:nvSpPr>"
      + '<p:cNvPr id="' + id + '" name="' + esc(name) + '"/>'
      + '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
      + '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm>'
      + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
      + '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t">'
      + '<a:normAutofit fontScale="100000" lnSpcReduction="0"/></a:bodyPr><a:lstStyle/>'
      + paras.join("") + "</p:txBody></p:sp>";
  }

  function rect(id, name, x, y, w, h, color) {
    return "<p:sp><p:nvSpPr>"
      + '<p:cNvPr id="' + id + '" name="' + esc(name) + '"/>'
      + '<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
      + '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm>'
      + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
      + '<a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill>'
      + "<a:ln><a:noFill/></a:ln></p:spPr>"
      + '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';
  }

  function slideXml(shapes) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + "<p:cSld><p:spTree>"
      + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
      + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
      + '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
      + shapes.join("")
      + "</p:spTree></p:cSld>"
      + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  }

  function titleSlide(o, coverKv) {
    var shapes = [];
    shapes.push(rect(2, "Accent", 0, 0, 260000, EMU_H, BRAND));

    var paras = [];
    paras.push('<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
      + aRun(o.name || "", { size: 4400, bold: true, color: INK }) + "</a:p>");
    if (o.enName) {
      paras.push('<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
        + aRun(o.enName, { size: 1800, color: MUTED }) + "</a:p>");
    }
    if (o.title) {
      paras.push('<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
        + aRun(o.title, { size: 1600, color: BRAND }) + "</a:p>");
    }
    shapes.push(textBox(3, "Name", 900000, 1980000, 10200000, 1900000, paras));

    if ((o.contacts && o.contacts.length) || (coverKv && coverKv.length)) {
      var cp = [];
      if (o.contacts && o.contacts.length) {
        cp.push('<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
          + aRun(o.contacts.join("   |   "), { size: 1150, color: SUB }) + "</a:p>");
      }
      if (coverKv && coverKv.length) {
        cp.push('<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="600"/></a:spcBef><a:buNone/></a:pPr>'
          + aRun(coverKv.map(function (x) {
              return (x.key ? x.key + "：" : "") + (x.text || "");
            }).join("   |   "), { size: 1150, bold: true, color: BRAND }) + "</a:p>");
      }
      shapes.push(textBox(4, "Contacts", 900000, 3800000, 10400000, 700000, cp));
    }

    shapes.push(rect(5, "Rule", 900000, 4550000, 2400000, 42000, BRAND));

    if (o.summary) {
      var sp = ['<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
        + aRun(o.summary, { size: 1250, color: TEXT }) + "</a:p>"];
      shapes.push(textBox(6, "Summary", 900000, 4820000, 10300000, 1500000, sp));
    }

    return slideXml(shapes);
  }

  function contentSlide(title, lines, page, dense) {
    var k = dense ? 0.87 : 1;   /* 内容密集时整体缩小字号 */
    var shapes = [];
    shapes.push(rect(2, "TopBar", 0, 0, EMU_W, 150000, BRAND));

    shapes.push(textBox(3, "Title", 780000, 480000, 10200000, 700000, [
      '<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
      + aRun(title, { size: 2600, bold: true, color: INK }) + "</a:p>"
    ]));
    shapes.push(rect(4, "TitleRule", 780000, 1200000, 1500000, 40000, BRAND));

    var paras = lines.map(function (ln) {
      if (ln.style === "item") {
        return '<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="700"/></a:spcBef><a:buNone/></a:pPr>'
          + aRun(ln.text, { size: Math.round(1350 * k), bold: true, color: INK }) + "</a:p>";
      }
      if (ln.style === "bullet") {
        return '<a:p><a:pPr algn="l" marL="228600" indent="-228600"><a:buFont typeface="Arial"/>'
          + '<a:buChar char="•"/></a:pPr>' + aRun(ln.text, { size: Math.round(1200 * k), color: TEXT }) + "</a:p>";
      }
      if (ln.style === "sub") {
        return '<a:p><a:pPr algn="l" marL="457200" indent="0"><a:buNone/></a:pPr>'
          + aRun(ln.text, { size: Math.round(1100 * k), color: MUTED }) + "</a:p>";
      }
      if (ln.style === "kv") {
        return '<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
          + aRun((ln.key ? ln.key + "：" : "") + (ln.text || ""), { size: Math.round(1200 * k), color: TEXT }) + "</a:p>";
      }
      return '<a:p><a:pPr algn="l"><a:buNone/></a:pPr>'
        + aRun(ln.text, { size: Math.round(1150 * k), color: SUB }) + "</a:p>";
    }).join("");

    shapes.push(textBox(5, "Body", 780000, 1420000, 10500000, 4900000, [paras]));

    if (page) {
      shapes.push(textBox(6, "Page", EMU_W - 1200000, EMU_H - 520000, 800000, 300000, [
        '<a:p><a:pPr algn="r"><a:buNone/></a:pPr>'
        + aRun(String(page), { size: 1000, color: "AEB8C7" }) + "</a:p>"
      ]));
    }
    return slideXml(shapes);
  }

  /* PPT 是「要点版」：过长说明截断，每个条目最多跟 3 行，单板块最多 26 行 */
  var MAX_LINES_PER_SECTION = 18;
  var MAX_FOLLOW = 2;

  function condense(lines) {
    var out = [], follow = 0, inItem = false;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (!(ln.text || ln.key)) continue;
      if (ln.style === "item") {
        inItem = true;
        follow = 0;
        out.push(ln);
      } else {
        follow++;
        if (inItem && follow > MAX_FOLLOW) continue;
        out.push(ln);
      }
      if (out.length >= MAX_LINES_PER_SECTION) break;
    }
    return out.map(function (l) {
      if (l.text && l.text.length > 118 && (l.style === "meta" || l.style === "sub")) {
        return { style: l.style, key: l.key, text: l.text.slice(0, 116) + "…" };
      }
      return l;
    });
  }

  function weightOf(lines) {
    var w = 0;
    lines.forEach(function (l) {
      if (l.style === "item") w += 1.7;
      else if (l.style === "bullet") w += 1.05;
      else if (l.style === "sub") w += 0.85;
      else w += 0.9;
      w += Math.max(0, Math.ceil(((l.text || "").length - 46) / 42)) * 0.85;
    });
    return w;
  }

  /** 按「视觉重量」分页，避免一页塞太满或只放一两行 */
  function paginate(lines) {
    var LIMIT = 11.5, pages = [], cur = [], w = 0;
    lines.forEach(function (ln) {
      var lw = weightOf([ln]);
      if (cur.length && w + lw > LIMIT) {
        pages.push(cur);
        cur = [];
        w = 0;
      }
      cur.push(ln);
      w += lw;
    });
    if (cur.length) pages.push(cur);
    return pages;
  }

  function buildPptx(outline) {
    var sections = (outline.sections || []).slice();
    var coverKv = [];

    /* 首板块若全是键值（如「求职概况」），并到封面，不单独占一页 */
    if (sections.length && sections[0].lines && sections[0].lines.length &&
        sections[0].lines.every(function (l) { return l.style === "kv"; })) {
      coverKv = sections.shift().lines;
    }

    var slides = [titleSlide(outline, coverKv)];

    sections.forEach(function (sec) {
      var lines = condense(sec.lines || []);
      if (!lines.length) return;
      paginate(lines).forEach(function (chunk, idx) {
        var title = idx === 0 ? (sec.title || "") : (sec.title || "") + "（续）";
        slides.push(contentSlide(title, chunk, slides.length + 1, weightOf(chunk) > 8.6));
      });
    });

    var n = slides.length;

    var overrides = slides.map(function (_, i) {
      return '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml"'
        + ' ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
    }).join("");

    var files = [];
    files.push({
      name: "[Content_Types].xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
        + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
        + '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
        + '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
        + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        + overrides
        + "</Types>"
    });

    files.push({
      name: "_rels/.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        + "</Relationships>"
    });

    files.push({
      name: "docProps/core.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
        + ' xmlns:dc="http://purl.org/dc/elements/1.1/">'
        + "<dc:title>" + esc((outline.name || "") + " 个人介绍") + "</dc:title>"
        + "<dc:creator>" + esc(outline.name || "") + "</dc:creator>"
        + "</cp:coreProperties>"
    });

    /* presentation.xml */
    var sldIds = slides.map(function (_, i) {
      return '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>';
    }).join("");

    files.push({
      name: "ppt/presentation.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">'
        + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        + "<p:sldIdLst>" + sldIds + "</p:sldIdLst>"
        + '<p:sldSz cx="' + EMU_W + '" cy="' + EMU_H + '" type="screen16x9"/>'
        + '<p:notesSz cx="6858000" cy="9144000"/>'
        + "</p:presentation>"
    });

    /* presentation rels */
    var presRels = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
      + slides.map(function (_, i) {
        return '<Relationship Id="rId' + (i + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"'
          + ' Target="slides/slide' + (i + 1) + '.xml"/>';
      }).join("")
      + '<Relationship Id="rId' + (n + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>';

    files.push({
      name: "ppt/_rels/presentation.xml.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + presRels + "</Relationships>"
    });

    /* slide master */
    files.push({
      name: "ppt/slideMasters/slideMaster1.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        + "<p:cSld><p:bg><p:bgRef idx=\"1001\"><a:schemeClr val=\"bg1\"/></p:bgRef></p:bg>"
        + "<p:spTree>"
        + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        + '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        + "</p:spTree></p:cSld>"
        + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2"'
        + ' accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6"'
        + ' hlink="hlink" folHlink="folHlink"/>'
        + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
        + "</p:sldMaster>"
    });

    files.push({
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
        + "</Relationships>"
    });

    /* blank layout */
    files.push({
      name: "ppt/slideLayouts/slideLayout1.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
        + ' type="blank" preserve="1">'
        + '<p:cSld name="Blank"><p:spTree>'
        + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        + '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        + "</p:spTree></p:cSld>"
        + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
    });

    files.push({
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
        + "</Relationships>"
    });

    /* theme（最小可用） */
    var clr = [
      ["dk1", '<a:srgbClr val="1F2937"/>'],
      ["lt1", '<a:srgbClr val="FFFFFF"/>'],
      ["dk2", '<a:srgbClr val="334155"/>'],
      ["lt2", '<a:srgbClr val="F1F5F9"/>'],
      ["accent1", '<a:srgbClr val="4F46E5"/>'],
      ["accent2", '<a:srgbClr val="06B6D4"/>'],
      ["accent3", '<a:srgbClr val="F59E0B"/>'],
      ["accent4", '<a:srgbClr val="10B981"/>'],
      ["accent5", '<a:srgbClr val="EF4444"/>'],
      ["accent6", '<a:srgbClr val="8B5CF6"/>'],
      ["hlink", '<a:srgbClr val="4F46E5"/>'],
      ["folHlink", '<a:srgbClr val="7C3AED"/>']
    ].map(function (x) { return "<a:" + x[0] + ">" + x[1] + "</a:" + x[0] + ">"; }).join("");

    var fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
    var line = '<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
      + '<a:prstDash val="solid"/></a:ln>';

    files.push({
      name: "ppt/theme/theme1.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Portfolio">'
        + "<a:themeElements>"
        + '<a:clrScheme name="Portfolio">' + clr + "</a:clrScheme>"
        + '<a:fontScheme name="Portfolio">'
        + '<a:majorFont><a:latin typeface="微软雅黑"/><a:ea typeface="微软雅黑"/><a:cs typeface=""/></a:majorFont>'
        + '<a:minorFont><a:latin typeface="微软雅黑"/><a:ea typeface="微软雅黑"/><a:cs typeface=""/></a:minorFont>'
        + "</a:fontScheme>"
        + '<a:fmtScheme name="Portfolio">'
        + "<a:fillStyleLst>" + fill + fill + fill + "</a:fillStyleLst>"
        + "<a:lnStyleLst>" + line + line + line + "</a:lnStyleLst>"
        + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>'
        + "<a:effectStyle><a:effectLst/></a:effectStyle>"
        + "<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>"
        + "<a:bgFillStyleLst>" + fill + fill + fill + "</a:bgFillStyleLst>"
        + "</a:fmtScheme>"
        + "</a:themeElements>"
        + "<a:objectDefaults/><a:extraClrSchemeLst/>"
        + "</a:theme>"
    });

    slides.forEach(function (xml, i) {
      files.push({ name: "ppt/slides/slide" + (i + 1) + ".xml", data: xml });
      files.push({
        name: "ppt/slides/_rels/slide" + (i + 1) + ".xml.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
          + "</Relationships>"
      });
    });

    return zip(files);
  }

  /* ------------------------------------------------------------------ *
   *  4. 下载
   * ------------------------------------------------------------------ */
  function safeName(s) {
    return String(s || "简历").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
  }

  function download(bytes, filename, mime) {
    var blob = new Blob([bytes], { type: mime });
    if (global.navigator && global.navigator.msSaveOrOpenBlob) {
      global.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function toast(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;left:50%;bottom:36px;transform:translateX(-50%);"
      + "background:#111c33;color:#fff;padding:10px 20px;border-radius:999px;font-size:14px;"
      + "z-index:300;box-shadow:0 8px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .25s ease";
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = "1"; });
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 300);
    }, 2400);
  }

  function exportWord() {
    var o = extractOutline();
    if (!o) return;
    download(buildDocx(o), safeName(o.name) + "-简历.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    toast("Word 简历已下载（.docx，可直接编辑）");
  }

  function exportPpt() {
    var o = extractOutline();
    if (!o) return;
    download(buildPptx(o), safeName(o.name) + "-个人介绍.pptx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    toast("PPT 已下载（.pptx，可用 PowerPoint / WPS 编辑）");
  }

  /* ------------------------------------------------------------------ *
   *  5. 绑定按钮
   * ------------------------------------------------------------------ */
  function bind() {
    var docxBtn = document.getElementById("resumeDocx");
    var pptBtn = document.getElementById("resumePpt");
    if (docxBtn) docxBtn.addEventListener("click", function () {
      try { exportWord(); } catch (e) { console.error(e); toast("Word 导出失败：" + e.message); }
    });
    if (pptBtn) pptBtn.addEventListener("click", function () {
      try { exportPpt(); } catch (e) { console.error(e); toast("PPT 导出失败：" + e.message); }
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bind);
    } else {
      bind();
    }
  }

  var API = {
    extractOutline: extractOutline,
    buildDocx: buildDocx,
    buildPptx: buildPptx,
    exportWord: exportWord,
    exportPpt: exportPpt,
    zip: zip
  };
  global.OfficeExport = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;

})(typeof window !== "undefined" ? window : this);
