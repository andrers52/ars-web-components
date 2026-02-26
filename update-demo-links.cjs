const fs = require('fs');
const path = require('path');
const rootDir = __dirname;
function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (f === 'demo') {
                const indexHtmlPath = path.join(p, 'index.html');
                if (fs.existsSync(indexHtmlPath)) {
                    let html = fs.readFileSync(indexHtmlPath, 'utf8');

                    html = html.replace(/\"(\.\.\/)+node_modules\//g, '"/node_modules/');
                    html = html.replace(/\"(\.\.\/)+css\//g, '"/src/css/');
                    html = html.replace(/href=\"\.\.\/\.\.\/\.\.\/index\.html\"/g, 'href=\"/index.html\"');
                    html = html.replace(/href=\"\.\.\/\.\.\/\.\.\/\"/g, 'href=\"/\"');

                    html = html.replace(/src=\"(\.\.\/[^\"]+\.js)\"/g, (match, relPath) => {
                        const absoluteResolved = path.resolve(p, relPath);
                        const relativeToRoot = path.relative(rootDir, absoluteResolved);
                        // replace src with dist
                        const finalPath = '/' + relativeToRoot.replace(/^src\//, 'dist/');
                        return 'src="' + finalPath + '"';
                    });

                    fs.writeFileSync(indexHtmlPath, html);
                }
            } else {
                walk(p);
            }
        }
    }
}
walk('src');
