var DOMAINS = [
    "https://myreadingmanga.info",
    "https://myreadingmanga.to",
    "https://myreadingmanga.xyz"
];

function getDocument(url) {
    var headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    try {
        var response = fetch(url, { headers: headers });
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
        browser.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
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
    return getDocument(path);
}

function execute(url) {
    var doc1 = getDocumentForPath(url);
    if (!doc1) return Response.error("Không thể kết nối đến máy chủ MyReadingManga.");

    var listImage = [];
    var seenImages = {};

    function extractImages(doc) {
        var images = doc.select(".entry-content img, article img, .post img");
        images.forEach(img => {
            var src = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("data-original") || img.attr("src") || "";
            src = src.trim();
            if (!src) return;

            if (src.indexOf("//") === 0) {
                src = "https:" + src;
            }

            var cleanSrc = src.toLowerCase();
            if (cleanSrc.indexOf("avatar") !== -1 ||
                cleanSrc.indexOf("gravatar") !== -1 ||
                cleanSrc.indexOf("logo") !== -1 ||
                cleanSrc.indexOf("banner") !== -1 ||
                cleanSrc.indexOf("pixel") !== -1 ||
                cleanSrc.indexOf("spacer.gif") !== -1 ||
                cleanSrc.indexOf("ad-") !== -1 ||
                cleanSrc.indexOf("advertising") !== -1 ||
                cleanSrc.indexOf("doubleclick") !== -1 ||
                cleanSrc.indexOf("analytics") !== -1 ||
                cleanSrc.indexOf("fb-like") !== -1) {
                return;
            }

            if (!seenImages[src]) {
                seenImages[src] = true;
                listImage.push(src);
            }
        });
    }

    extractImages(doc1);

    var pageLinks = doc1.select(".entry-pagination a, .page-link a, .page-links a, .pagination a");
    var otherPageUrls = [];

    var basePath = url;
    var match = url.match(/https?:\/\/[^\/]+(\/.*)/);
    if (match) {
        basePath = match[1];
    }
    basePath = basePath.replace(/\/page\/\d+\/?$/, "").replace(/\/\d+\/?$/, "");
    if (basePath.endsWith("/")) {
        basePath = basePath.substring(0, basePath.length - 1);
    }

    pageLinks.forEach(link => {
        var href = link.attr("href");
        if (!href) return;

        var isTargetPostPage = false;
        if (href.indexOf("http") === 0) {
            var hrefMatch = href.match(/https?:\/\/[^\/]+(\/.*)/);
            if (hrefMatch) {
                var hrefPath = hrefMatch[1];
                if (hrefPath.indexOf(basePath) === 0 && hrefPath !== basePath && hrefPath !== basePath + "/") {
                    isTargetPostPage = true;
                }
            }
        } else {
            if (href.indexOf(basePath) === 0 && href !== basePath && href !== basePath + "/") {
                isTargetPostPage = true;
            }
        }

        if (isTargetPostPage && otherPageUrls.indexOf(href) === -1) {
            otherPageUrls.push(href);
        }
    });

    otherPageUrls.forEach(pageUrl => {
        try {
            var docN = getDocumentForPath(pageUrl);
            if (docN) {
                extractImages(docN);
            }
        } catch (e) {
            // Ignore error and try to continue
        }
    });

    if (listImage.length === 0) {
        return Response.error("Không tìm thấy hình ảnh nào trong chương này.");
    }

    return Response.success(listImage);
}
