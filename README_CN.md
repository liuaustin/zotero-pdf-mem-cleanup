# Zotero PDF Memory Cleanup

[English](README.md)

一个 Zotero 8 插件，修复 PDF 阅读器的内存泄漏问题——关闭 PDF 标签页后自动回收内存。

## 问题背景

Zotero 内置的 PDF 阅读器存在内存泄漏。关闭 PDF 标签页时，`ReaderInstance.uninit()` 只做了最基本的清理，没有释放 pdf.js 资源、GPU 纹理内存，也没有断开跨 compartment 的引用。这意味着：

- 每打开一个 PDF 再关闭，**内存只增不减**
- 反复阅读几篇文献后，Zotero 可能占用数百 MB 甚至数 GB 内存

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 关闭 PDF 后内存 | 699 MB（持续不释放） | 399 MB → 25 秒后回落到 34–47 MB |
| 内存回收 | 不回收 | 完全回收到基线水平 |

*测试环境：Zotero 8.0.4，macOS*

## 工作原理

插件通过 Notifier 监听标签页关闭事件，在 reader 被销毁前介入，执行三步清理：

1. **调用 `PDFViewerApplication.cleanup()` 和 `.close()`** — 销毁 pdf.js 文档实例、Web Worker 和字体缓存
2. **将所有 canvas 元素的宽高设为 0** — 强制浏览器释放 GPU 纹理内存
3. **将跨 compartment 引用置空**（`_internalReader`、`_iframeWindow`、`_primaryView`、`_secondaryView`）— 打破引用循环，使 GC 能够完整回收

插件非常轻量（约 160 行代码），没有 UI，安装后在后台静默运行。

## 安装

1. 从 [Releases](https://github.com/liuaustin/zotero-pdf-mem-cleanup/releases) 下载最新的 `.xpi` 文件
2. 在 Zotero 中：**工具 → 附加组件 → ⚙ → Install Add-on From File**
3. 选择下载的 `.xpi` 文件
4. 重启 Zotero

## 从源码构建

```bash
git clone https://github.com/liuaustin/zotero-pdf-mem-cleanup.git
cd zotero-pdf-mem-cleanup
./build.sh
```

会在项目根目录生成 `zotero-pdf-mem-cleanup.xpi`。

## 兼容性

- Zotero 8.0.0+
- 全平台（macOS、Windows、Linux）

## 许可证

[MIT](LICENSE)
