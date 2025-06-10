// /api/search.js

export default async function handler(request, response) {
    // 1. 从请求URL中获取番号
    const { q: fanhao } = request.query;

    if (!fanhao) {
        response.status(400).send('<h1>请提供番号参数 q</h1>');
        return;
    }

    try {
        // 2. 伪装成浏览器，携带日本地区常见的请求头
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.dmm.co.jp/'
        };

        // 3. 执行我们验证过的DMM抓取逻辑
        const searchUrl = `https://www.dmm.co.jp/search/=/searchstr=${fanhao}/`;
        const searchResponse = await fetch(searchUrl, { headers });
        const searchHtml = await searchResponse.text();
        
        const cidMatch = searchHtml.match(/\/cid=([a-z0-9]+)\//);
        if (!cidMatch || !cidMatch[1]) {
            throw new Error('在DMM搜索结果中未找到CID');
        }
        const cid = cidMatch[1];

        const productUrl = `https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=${cid}/`;
        const productResponse = await fetch(productUrl, { headers });
        const productHtml = await productResponse.text();

        const movieInfoMatch = productHtml.match(/sampleMovie\s*:\s*({[^}]+})/);
        if (!movieInfoMatch || !movieInfoMatch[1]) {
            throw new Error('在商品页未找到sampleMovie信息');
        }
        const movieInfo = JSON.parse(movieInfoMatch[1]);
        
        const videoPath = movieInfo.path;
        const videoSize = movieInfo.size;
        const finalVideoUrl = `https://cc3001.dmm.co.jp/litevideo/freepv/${videoPath}${cid}${videoSize}.mp4`;

        // 4. 重定向到最终的视频地址
        response.redirect(302, finalVideoUrl);

    } catch (error) {
        console.error(`处理 ${fanhao} 时出错:`, error);
        response.status(404).send(`<h1>查询失败: ${fanhao}</h1><p>${error.message}</p>`);
    }
}
