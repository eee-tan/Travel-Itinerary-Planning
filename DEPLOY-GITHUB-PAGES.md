# 免费部署与分享：GitHub + Cloudflare Pages

## 推荐方案：Cloudflare Pages 自动连接 GitHub

这个项目是纯静态网页，不需要服务器、数据库或付费套餐。Cloudflare Pages 可以直接连接 GitHub；以后每次更新 `main` 分支，Cloudflare 会自动发布新版。

1. 先确认本项目已经推送到 GitHub，并且 GitHub 仓库中能看到 `index.html`。
2. 登录 Cloudflare Dashboard：`https://dash.cloudflare.com/`。
3. 打开 **Workers & Pages**。
4. 选择 **Create application → Pages → Connect to Git**。
5. 选择 GitHub，并授权 **Cloudflare Workers and Pages** 访问 `eee-tan/Travel-Itinerary-Planning`。建议只授权这个仓库。
6. 选择该仓库后填写：
   - Project name：`travel-itinerary-planning`
   - Production branch：`main`
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`.`
   - Root directory：留空
7. 点击 **Save and Deploy**。

部署完成后会得到一个免费链接，例如：

`https://travel-itinerary-planning.pages.dev/`

此后只要更新 GitHub 的 `main` 分支，Cloudflare Pages 就会自动重新发布，无需再次手动部署。

## GitHub Pages 备用方案

项目已经包含自动部署文件 `.github/workflows/deploy-pages.yml`。以后每次把代码推送到 `main` 分支，网页都会自动更新。

## 第一次启用

1. 打开 GitHub 项目：`https://github.com/eee-tan/Travel-Itinerary-Planning`
2. 进入 **Settings → Pages**。
3. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
4. 回到 **Actions** 页面，选择 **Deploy travel plan to GitHub Pages**。
5. 点击 **Run workflow → Run workflow**。

如果 Actions 页面看不到这个工作流，通常表示 `.github/workflows/deploy-pages.yml` 还没有成功推送到 GitHub 默认分支。先确认 GitHub 网页中可以看到这个文件，再刷新 Actions 页面。

部署完成后，分享链接通常是：

`https://eee-tan.github.io/Travel-Itinerary-Planning/`

## 以后更新网页

把修改后的文件推送到 GitHub 的 `main` 分支即可。部署流程会自动运行，无需再次设置 Pages。

## 本地直接打开

双击 `index.html` 也可以预览。网页在 `file://` 模式下会读取 `trip-data.js`，不会再因为浏览器禁止读取本地 JSON 而出现跨域错误。

每次手动修改 `trip-data.json` 后，在 Terminal 进入项目文件夹并运行：

```bash
npm run build:data
```

这会重新生成与 JSON 内容同步的 `trip-data.js`。
