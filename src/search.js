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

function getDocumentForPath(path, page) {
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

    var paginatedPath = relativePath;
    if (page && page > 1) {
        if (relativePath.indexOf('?') !== -1) {
            var parts = relativePath.split('?');
            var baseUrl = parts[0];
            var query = parts[1];
            paginatedPath = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'page/' + page + '/?' + query;
        } else {
            paginatedPath = relativePath + (relativePath.endsWith('/') ? '' : '/') + 'page/' + page + '/';
        }
    }

    for (var i = 0; i < DOMAINS.length; i++) {
        var url = DOMAINS[i] + paginatedPath;
        try {
            var doc = getDocument(url);
            if (doc && (doc.select("article").size() > 0 || doc.select(".entry-title").size() > 0)) {
                return doc;
            }
        } catch (e) {
            // Try next domain
        }
    }
    return getDocument(path);
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

function getElementsSize(list) {
    if (!list) return 0;
    return (typeof list.size === "function") ? list.size() : (list.length || 0);
}

function execute(key, page) {
    if (!page) page = 1;
    var path = "/?s=" + encodeURIComponent(key);
    var doc = getDocumentForPath(path, page);
    if (!doc) return Response.error("Không thể kết nối đến máy chủ MyReadingManga.");

    var articles = doc.select("article");
    if (getElementsSize(articles) === 0) {
        articles = doc.select(".post");
    }

    var listBook = [];
    forEachElement(articles, function(article) {
        var titleEl = article.select(".entry-title a").first() || article.select("h2 a").first() || article.select("a").first();
        if (!titleEl) return;

        var name = titleEl.text();
        var link = titleEl.attr("href");

        var cover = "";
        var imgEl = article.select("img").first();
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
            if (cover && cover.indexOf("//") === 0) {
                cover = "https:" + cover;
            }
        }

        var description = "";
        var summaryEl = article.select(".entry-summary").first() || article.select(".entry-content").first();
        if (summaryEl) {
            description = summaryEl.text().trim();
            if (description.length > 150) {
                description = description.substring(0, 150) + "...";
            }
        }

        listBook.push({
            name: name,
            link: link,
            cover: cover,
            description: description,
            host: "https://myreadingmanga.info"
        });
    });

    var nextEl = doc.select(".next").first() || doc.select(".pagination .next").first() || doc.select("a.next").first() || doc.select("a[rel='next']").first();
    var next = null;
    if (nextEl && listBook.length > 0) {
        next = (parseInt(page) + 1).toString();
    }

    return Response.success(listBook, next);
}
