import * as htmlToImage from 'html-to-image';
import { Notice } from 'obsidian';

export class ExportManager {
    /**
     * 导出 DOM 元素为 PNG 图片
     * @param element 要导出的 DOM 元素
     * @param filename 文件名（默认带时间戳）
     */
    static async exportToPng(element: HTMLElement, filename?: string): Promise<void> {
        try {
            // 生成默认文件名
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                filename = `wechat-article-${timestamp}.png`;
            }

            // 显示加载提示
            new Notice('正在生成图片...');

            // 保存元素原始样式
            const originalOverflow = element.style.overflow;
            const originalHeight = element.style.height;
            const originalMaxHeight = element.style.maxHeight;
            const originalFlex = element.style.flex;
            const originalMinHeight = element.style.minHeight;

            // 保存父容器原始样式（flex 布局会约束子元素高度）
            const parent = element.parentElement;
            const parentOriginalStyles = parent ? {
                display: parent.style.display,
                flexDirection: parent.style.flexDirection,
                height: parent.style.height,
                overflow: parent.style.overflow,
            } : null;

            // 临时修改样式以显示完整内容
            element.style.overflow = 'visible';
            element.style.height = 'auto';
            element.style.maxHeight = 'none';
            element.style.flex = 'none';
            element.style.minHeight = 'auto';

            // 临时移除父容器的 flex 约束
            if (parent) {
                parent.style.display = 'block';
                parent.style.height = 'auto';
                parent.style.overflow = 'visible';
            }

            try {
                // 导出为 PNG
                const dataUrl = await htmlToImage.toPng(element, {
                    quality: 1.0,
                    pixelRatio: 2, // 2x 高清输出
                    backgroundColor: '#ffffff',
                    // 过滤掉不需要的元素
                    filter: (node: Element) => {
                        // 排除工具栏等非内容元素
                        const classList = (node as HTMLElement).classList;
                        if (classList) {
                            return !classList.contains('mp-toolbar') &&
                                !classList.contains('mp-bottom-bar');
                        }
                        return true;
                    }
                });

                // 恢复元素原始样式
                element.style.overflow = originalOverflow;
                element.style.height = originalHeight;
                element.style.maxHeight = originalMaxHeight;
                element.style.flex = originalFlex;
                element.style.minHeight = originalMinHeight;

                // 恢复父容器原始样式
                if (parent && parentOriginalStyles) {
                    parent.style.display = parentOriginalStyles.display;
                    parent.style.flexDirection = parentOriginalStyles.flexDirection;
                    parent.style.height = parentOriginalStyles.height;
                    parent.style.overflow = parentOriginalStyles.overflow;
                }

                // 触发下载
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                new Notice('✅ 图片导出成功！');
            } catch (error) {
                // 确保恢复原始样式
                element.style.overflow = originalOverflow;
                element.style.height = originalHeight;
                element.style.maxHeight = originalMaxHeight;
                element.style.flex = originalFlex;
                element.style.minHeight = originalMinHeight;

                if (parent && parentOriginalStyles) {
                    parent.style.display = parentOriginalStyles.display;
                    parent.style.flexDirection = parentOriginalStyles.flexDirection;
                    parent.style.height = parentOriginalStyles.height;
                    parent.style.overflow = parentOriginalStyles.overflow;
                }
                throw error;
            }
        } catch (error) {
            console.error('PNG 导出失败:', error);
            new Notice('❌ 图片导出失败，请重试');
            throw error;
        }
    }

    /**
     * 导出 DOM 元素为 JPEG 图片（文件更小）
     * @param element 要导出的 DOM 元素
     * @param filename 文件名（默认带时间戳）
     * @param quality 图片质量 (0-1)
     */
    static async exportToJpeg(
        element: HTMLElement,
        filename?: string,
        quality: number = 0.95
    ): Promise<void> {
        try {
            // 生成默认文件名
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                filename = `wechat-article-${timestamp}.jpg`;
            }

            new Notice('正在生成图片...');

            // 保存元素原始样式
            const originalOverflow = element.style.overflow;
            const originalHeight = element.style.height;
            const originalMaxHeight = element.style.maxHeight;
            const originalFlex = element.style.flex;
            const originalMinHeight = element.style.minHeight;

            // 保存父容器原始样式
            const parent = element.parentElement;
            const parentOriginalStyles = parent ? {
                display: parent.style.display,
                flexDirection: parent.style.flexDirection,
                height: parent.style.height,
                overflow: parent.style.overflow,
            } : null;

            // 临时修改样式以显示完整内容
            element.style.overflow = 'visible';
            element.style.height = 'auto';
            element.style.maxHeight = 'none';
            element.style.flex = 'none';
            element.style.minHeight = 'auto';

            // 临时移除父容器的 flex 约束
            if (parent) {
                parent.style.display = 'block';
                parent.style.height = 'auto';
                parent.style.overflow = 'visible';
            }

            try {
                const dataUrl = await htmlToImage.toJpeg(element, {
                    quality,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    filter: (node: Element) => {
                        const classList = (node as HTMLElement).classList;
                        if (classList) {
                            return !classList.contains('mp-toolbar') &&
                                !classList.contains('mp-bottom-bar');
                        }
                        return true;
                    }
                });

                // 恢复元素原始样式
                element.style.overflow = originalOverflow;
                element.style.height = originalHeight;
                element.style.maxHeight = originalMaxHeight;
                element.style.flex = originalFlex;
                element.style.minHeight = originalMinHeight;

                // 恢复父容器原始样式
                if (parent && parentOriginalStyles) {
                    parent.style.display = parentOriginalStyles.display;
                    parent.style.flexDirection = parentOriginalStyles.flexDirection;
                    parent.style.height = parentOriginalStyles.height;
                    parent.style.overflow = parentOriginalStyles.overflow;
                }

                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                new Notice('✅ 图片导出成功！');
            } catch (error) {
                // 确保恢复原始样式
                element.style.overflow = originalOverflow;
                element.style.height = originalHeight;
                element.style.maxHeight = originalMaxHeight;
                element.style.flex = originalFlex;
                element.style.minHeight = originalMinHeight;

                if (parent && parentOriginalStyles) {
                    parent.style.display = parentOriginalStyles.display;
                    parent.style.flexDirection = parentOriginalStyles.flexDirection;
                    parent.style.height = parentOriginalStyles.height;
                    parent.style.overflow = parentOriginalStyles.overflow;
                }
                throw error;
            }
        } catch (error) {
            console.error('JPEG 导出失败:', error);
            new Notice('❌ 图片导出失败，请重试');
            throw error;
        }
    }

    /**
     * 导出为 Blob（用于进一步处理）
     * @param element 要导出的 DOM 元素
     */
    static async exportToBlob(element: HTMLElement): Promise<Blob | null> {
        try {
            const blob = await htmlToImage.toBlob(element, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                filter: (node: Element) => {
                    const classList = (node as HTMLElement).classList;
                    if (classList) {
                        return !classList.contains('mp-toolbar') &&
                            !classList.contains('mp-bottom-bar');
                    }
                    return true;
                }
            });
            return blob;
        } catch (error) {
            console.error('Blob 导出失败:', error);
            return null;
        }
    }
}
