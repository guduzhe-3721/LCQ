# 零成本个人文章与资源站设计

## 目标与边界

在不购买域名、不运行服务器、不使用付费云存储的前提下，建立一个公开的个人网站。访客可阅读文章、检索资源、查看软件元数据并直接下载资源；站长通过 GitHub 管理内容。

第一版不提供网页后台、用户注册、私有文件、登录后下载、下载审计或普通用户上传。这些能力需要后端和长期可控的存储配额，不属于严格零成本方案。

## 固定技术方案

- 使用 Astro 静态站点生成器和 TypeScript，部署到 GitHub Pages 的 `https://<GitHub 用户名>.github.io/`，不接入自定义域名。
- 文章以 Markdown 保存于 `src/content/articles/`；资源以 Markdown 保存于 `src/content/resources/`。内容变更通过 GitHub 网页或本地 Git 提交完成。
- 二进制文件不进入 Git 仓库。每个软件/文件版本发布为 GitHub Release 资产，资源 Markdown 保存其官方下载链接。
- 静态全文检索由 Pagefind 在构建时生成，不收集用户数据；页面使用明亮现代的响应式视觉系统。

## 内容结构

- 文章 front matter：`title`、`description`、`publishedAt`、`tags`、可选 `cover` 与 `draft`。
- 资源 front matter：`title`、`description`、`category`、`tags`、`version`、`fileName`、`size`、`releaseUrl`、`sourceUrl`、`license`、`sha256`、`publishedAt` 与 `draft`。
- 构建时使用 Zod 内容集合模式校验全部字段；缺字段、无效 URL、非法日期或草稿资源不出现在公开站点。
- 资源详情页明确展示版本、大小、来源、许可证、SHA-256 和直接下载按钮；仅发布自有文件或开源软件。

## 发布流程

1. 将文章或资源 Markdown 提交到默认分支；资源先在 GitHub Releases 创建版本并上传附件。
2. 在资源 front matter 填入 Release 资产 URL 与哈希，再提交内容文件。
3. GitHub Actions 运行类型检查、构建和链接校验，通过后部署 GitHub Pages。
4. 发布新版本时创建新的资源 Markdown 或更新版本字段；旧版本保留原 Release 以维持链接可用。

## 约束与风险

- GitHub Release 的单个资产必须小于 2 GiB；超出时分卷或只提供外部来源链接。
- GitHub Pages 发布站点建议小于 1 GB，存在约 100 GB/月软带宽限制；下载资产由 Releases 承担。
- GitHub Pages 与 GitHub Releases 在中国大陆的连通性可能波动，不承诺国内稳定下载速度。
- 站点与下载链接均公开；不应上传私密、受限分发或侵权文件。
