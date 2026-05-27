function execute() {
    return Response.success([
        {
            title: "Mới Nhất",
            input: "/",
            script: "gen.js"
        },
        {
            title: "Yaoi",
            input: "/genre/yaoi/",
            script: "gen.js"
        },
        {
            title: "Bara",
            input: "/genre/bara/",
            script: "gen.js"
        },
        {
            title: "Doujinshi",
            input: "/genre/doujinshi/",
            script: "gen.js"
        },
        {
            title: "Tiếng Anh",
            input: "/genre/english/",
            script: "gen.js"
        },
        {
            title: "Tiếng Việt",
            input: "/tag/vietnamese/",
            script: "gen.js"
        }
    ]);
}
