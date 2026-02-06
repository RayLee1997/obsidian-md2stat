import { App } from 'obsidian';
import * as htmlToImage from 'html-to-image';

export class MPConverter {
    private static app: App;

    static initialize(app: App) {
        this.app = app;
    }

    static async formatContent(element: HTMLElement): Promise<void> {
        // 创建 section 容器
        const section = document.createElement('section');
        section.className = 'mp-content-section';
        // 移动原有内容到 section 中
        while (element.firstChild) {
            section.appendChild(element.firstChild);
        }
        element.appendChild(section);

        // 处理元素
        await this.processElements(section);
    }

    private static async processElements(container: HTMLElement | null): Promise<void> {
        if (!container) return;

        // 处理 Mermaid 图表（优先处理，确保后续流程能正确识别）
        await this.processMermaidDiagrams(container);

        // 处理列表项内部元素，用section包裹
        container.querySelectorAll('li').forEach(li => {
            // 创建section元素
            const section = document.createElement('section');
            // 将li的所有子元素移动到section中
            while (li.firstChild) {
                section.appendChild(li.firstChild);
            }
            // 将section添加到li中
            li.appendChild(section);
        });

        // 处理代码块
        container.querySelectorAll('pre').forEach(pre => {
            // 过滤掉 frontmatter
            if (pre.classList.contains('frontmatter')) {
                // 如果是 frontmatter，直接移除整个元素
                pre.remove();
                return;
            }

            const codeEl = pre.querySelector('code');
            if (codeEl) {
                // 添加 macOS 风格的窗口按钮
                const header = document.createElement('div');
                header.className = 'mp-code-header';

                // 添加三个窗口按钮
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('span');
                    dot.className = 'mp-code-dot';
                    header.appendChild(dot);
                }

                pre.insertBefore(header, pre.firstChild);

                // 移除原有的复制按钮
                const copyButton = pre.querySelector('.copy-code-button');
                if (copyButton) {
                    copyButton.remove();
                }
            }
        });

        // 处理图片
        container.querySelectorAll('span.internal-embed[alt][src]').forEach(async el => {
            const originalSpan = el as HTMLElement;
            const src = originalSpan.getAttribute('src');
            const alt = originalSpan.getAttribute('alt');

            if (!src) return;

            try {
                const linktext = src.split('|')[0];
                const file = this.app.metadataCache.getFirstLinkpathDest(linktext, '');
                if (file) {
                    const absolutePath = this.app.vault.adapter.getResourcePath(file.path);
                    const newImg = document.createElement('img');
                    newImg.src = absolutePath;
                    if (alt) newImg.alt = alt;
                    originalSpan.parentNode?.replaceChild(newImg, originalSpan);
                }
            } catch (error) {
                console.error('图片处理失败:', error);
            }
        });
    }

    /**
     * 处理 Mermaid 图表，将其转换为图片
     * @param container 包含 Mermaid 的容器
     */
    private static async processMermaidDiagrams(container: HTMLElement): Promise<void> {
        // 查找所有 Mermaid 节点
        const mermaidNodes = container.querySelectorAll('.mermaid');

        if (mermaidNodes.length === 0) return;

        // 并发处理所有 Mermaid 节点
        const conversions = Array.from(mermaidNodes).map(async (mermaidEl) => {
            try {
                await this.convertMermaidToImage(mermaidEl as HTMLElement);
            } catch (error) {
                console.error('Mermaid 转换失败:', error);
                // 转换失败时保留原 SVG，但添加警告标记
                (mermaidEl as HTMLElement).setAttribute('data-conversion-failed', 'true');
            }
        });

        await Promise.all(conversions);
    }

    /**
     * 将单个 Mermaid 节点转换为图片
     * @param mermaidEl Mermaid DOM 元素
     */
    private static async convertMermaidToImage(mermaidEl: HTMLElement): Promise<void> {
        // 生成 PNG 图片（Base64）
        const dataUrl = await htmlToImage.toPng(mermaidEl, {
            quality: 1.0,
            pixelRatio: 2, // 高清输出
            backgroundColor: '#ffffff',
            // 确保捕获完整内容
            style: {
                margin: '0',
                padding: '10px' // 给图表留点边距
            }
        });

        // 创建 img 元素
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Mermaid Diagram';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '1em auto';
        img.setAttribute('data-original-type', 'mermaid');

        // 替换原 Mermaid 节点
        mermaidEl.parentNode?.replaceChild(img, mermaidEl);
    }
}