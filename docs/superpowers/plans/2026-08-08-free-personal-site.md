# 免费个人文章与资源站实施计划

**目标：** 在 GitHub Pages 上发布一个零服务费的静态文章与资源网站，文件通过 GitHub Releases 公开分发。

**固定选择：** Astro + TypeScript + Markdown 内容集合 + Pagefind + GitHub Actions；不使用数据库、登录、对象存储、付费域名或运行时 API。

## 实施任务

1. 清理被中止的未提交 Next.js 脚手架，在隔离分支初始化 Astro 静态站点、严格 TypeScript、ESLint、Prettier、Vitest 与 Playwright；将 GitHub Pages 的 `base` 配置为仓库名，并保留本地预览脚本。
2. 定义 `articles` 与 `resources` 两个 Astro Content Collection 的 Zod schema；添加两篇示例文章与两项示例资源，覆盖草稿隐藏、标签、版本、许可证、SHA-256 和 GitHub Release URL 校验。
3. 实现明亮现代的公共页面：主页、文章列表/详情、资源目录/详情、标签页、关于页和移动端导航；资源页显示完整元数据并提供公开 Release 下载按钮。
4. 集成 Pagefind 静态全文检索与可访问的筛选 UI；为文章 Markdown 增加目录、代码高亮和安全外链标识。
5. 添加 GitHub Actions：推送与拉取请求运行检查/测试/构建；默认分支成功构建后部署 GitHub Pages。添加发布说明，记录 Release 附件小于 2 GiB、站点小于 1 GB、只发布有权分发内容等规则。
6. 用 Playwright 验证桌面与 375px 移动视图、文章与资源发现、草稿不可见、必填元数据显示和外部 Release 链接；在 GitHub Pages 预览中做一次人工下载验证。

## 验收标准

- 不配置任何付费服务、数据库、对象存储或自定义域名，站点能在 GitHub Pages 成功发布。
- 新增一篇 Markdown 文章或一个资源文件后，提交到 GitHub 即能通过 Actions 自动更新公开站点。
- 访客可搜索文章和资源，看到资源来源、许可证、哈希与可用下载链接。
- 草稿永远不进入公开列表、检索结果或静态构建产物。
