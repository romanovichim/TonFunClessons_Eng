"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.appendLinkToHtml = appendLinkToHtml;
exports.appendScriptsToHtml = appendScriptsToHtml;
function appendLinkToHtml(html, links) {
    return html.replace("</head>", links.map((link)=>{
        let linkTag = `<link rel="${link.rel}"`;
        if (link.href) linkTag += ` href="${link.href}"`;
        if (link.as) linkTag += ` as="${link.as}"`;
        linkTag += ">";
        return linkTag;
    }).join("") + "</head>");
}
function appendScriptsToHtml(html, scripts) {
    return html.replace("</body>", scripts.map((script)=>`<script src="${script}" defer></script>`
    ).join("") + "</body>");
}

//# sourceMappingURL=html.js.map