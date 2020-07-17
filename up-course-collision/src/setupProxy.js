const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
    app.use(
        "/sigarra-api",
        createProxyMiddleware({
            target: "https://sigarra.up.pt",
            changeOrigin: true,
            pathRewrite: (path) => path.replace("/sigarra-api", ""),
        })
    );
};
