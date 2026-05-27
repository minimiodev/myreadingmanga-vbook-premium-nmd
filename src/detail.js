var DOMAINS = [
    "https://myreadingmanga.info"
];

function getDocument(url) {
    try {
        var response = fetch(url);
        var html = response.text();
        if (html && (html.indexOf("cf-challenge") !== -1 || html.indexOf("Cloudflare") !== -1 || html.indexOf("Please enable JS") !== -1)) {
            return getDocumentWithBrowser(url);
        }
        return Html.parse(html);
    } catch (e) {
        return getDocumentWithBrowser(url);
    }
}

function getDocumentWithBrowser(url) {
    var browser = Engine.newBrowser();
    try {
        var doc = browser.launch(url, 8000);
        return doc;
    } catch (e) {
        return null;
    } finally {
        browser.close();
    }
}

function getDocumentForPath(path) {
    var relativePath = path;
    if (path.indexOf("http") === 0) {
        var match = path.match(/https?:\/\/[^\/]+(\/.*)/);
        if (match) {
            relativePath = match[1];
        }
    }
    
    if (relativePath.indexOf("/") !== 0) {
        relativePath = "/" + relativePath;
    }

    for (var i = 0; i < DOMAINS.length; i++) {
        var url = DOMAINS[i] + relativePath;
        try {
            var doc = getDocument(url);
            if (doc && doc.select(".entry-title").size() > 0) {
                return doc;
            }
        } catch (e) {
            // Try next domain
        }
    }
    
    if (path.indexOf("http") === 0) {
        return getDocument(path);
    }
    return null;
}

function forEachElement(list, callback) {
    if (!list) return;
    var size = (typeof list.size === "function") ? list.size() : (list.length || 0);
    for (var i = 0; i < size; i++) {
        var el = (typeof list.get === "function") ? list.get(i) : list[i];
        if (el) {
            callback(el, i);
        }
    }
}

function execute(url) {
    var doc = getDocumentForPath(url);
    if (!doc) return Response.error("Không thể kết nối đến máy chủ MyReadingManga.");

    var nameEl = doc.select(".entry-title").first();
    if (!nameEl) return Response.error("Không tìm thấy thông tin truyện.");
    var name = nameEl.text().trim();

    var cover = "";
    var imgEl = doc.select(".entry-content img").first() || doc.select("article img").first();
    if (imgEl) {
        cover = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
        if (cover && cover.indexOf("//") === 0) {
            cover = "https:" + cover;
        }
    }

    var author = "";
    var authorMatch = name.match(/^\[([^\]]+)\]/);
    if (authorMatch) {
        author = authorMatch[1].trim();
    } else {
        var authorEl = doc.select("a[href*='/search/author/']").first();
        if (authorEl) {
            author = authorEl.text().trim();
        } else {
            author = "Unknown";
        }
    }

    var description = "";
    var contentEl = doc.select(".entry-content").first();
    if (contentEl) {
        contentEl.select("style, script, .entry-pagination, .page-link, .page-links, .pagination").remove();
        description = contentEl.text().trim();
        if (description.length > 500) {
            description = description.substring(0, 500) + "...";
        }
    }

    var detailList = [];
    var categories = doc.select("a[href*='/category/']");
    if (categories.size() > 0) {
        var catNames = [];
        forEachElement(categories, function(cat) {
            var txt = cat.text().trim();
            if (txt) catNames.push(txt);
        });
        if (catNames.length > 0) {
            detailList.push("Thể loại: " + catNames.join(", "));
        }
    }

    var tags = doc.select("a[rel='tag']");
    if (tags.size() > 0) {
        var tagNames = [];
        forEachElement(tags, function(tag) {
            var txt = tag.text().trim();
            if (txt) tagNames.push(txt);
        });
        if (tagNames.length > 0) {
            detailList.push("Nhãn (Tags): " + tagNames.slice(0, 15).join(", "));
        }
    }

    var detail = detailList.join("\n");

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        ongoing: false,
        host: "https://myreadingmanga.info"
    });
}
