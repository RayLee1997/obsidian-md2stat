import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile, setIcon } from 'obsidian';
import { MPConverter } from './converter';
import { CopyManager } from './copyManager';
import { ExportManager } from './exportManager';
import type { TemplateManager } from './templateManager';
import type { SettingsManager } from './settings/settings';
import { BackgroundManager } from './backgroundManager';
export const VIEW_TYPE_MP = 'obsidian-md2stat';

export class MPView extends ItemView {
    private previewEl: HTMLElement;
    private currentFile: TFile | null = null;
    private updateTimer: NodeJS.Timeout | null = null;

    private copyButton: HTMLButtonElement;
    private templateManager: TemplateManager;
    private settingsManager: SettingsManager;
    private customTemplateSelect: HTMLElement;
    private customFontSelect: HTMLElement;
    private fontSizeSelect: HTMLInputElement;
    private backgroundManager: BackgroundManager;
    private customBackgroundSelect: HTMLElement;

    constructor(
        leaf: WorkspaceLeaf,
        templateManager: TemplateManager,
        settingsManager: SettingsManager
    ) {
        super(leaf);
        this.templateManager = templateManager;
        this.settingsManager = settingsManager;
        this.backgroundManager = new BackgroundManager(this.settingsManager);
    }

    getViewType() {
        return VIEW_TYPE_MP;
    }

    getDisplayText() {
        return '公众号预览';
    }

    getIcon() {
        return 'eye';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.classList.remove('view-content');
        container.classList.add('mp-view-content');

        // 顶部工具栏
        const toolbar = container.createEl('div', { cls: 'mp-toolbar' });
        const controlsGroup = toolbar.createEl('div', { cls: 'mp-controls-group' });





        // 添加背景选择器
        const backgroundOptions = [
            { value: '', label: '无背景' },
            ...(this.settingsManager.getVisibleBackgrounds()?.map(bg => ({
                value: bg.id,
                label: bg.name
            })) || [])
        ];

        this.customBackgroundSelect = this.createCustomSelect(
            controlsGroup,
            'mp-background-select',
            backgroundOptions
        );

        // 添加背景选择器的事件监听
        this.customBackgroundSelect.querySelector('.custom-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.backgroundManager.setBackground(value);
            await this.settingsManager.updateSettings({
                backgroundId: value
            });
            this.backgroundManager.applyBackground(this.previewEl);
        });

        // 创建自定义下拉选择器
        this.customTemplateSelect = this.createCustomSelect(
            controlsGroup,
            'mp-template-select',
            await this.getTemplateOptions()
        );
        this.customTemplateSelect.id = 'template-select';

        // 添加模板选择器的 change 事件监听
        this.customTemplateSelect.querySelector('.custom-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.templateManager.setCurrentTemplate(value);
            await this.settingsManager.updateSettings({
                templateId: value
            });
            // 重新渲染预览以确保 Mermaid 等元素正确处理
            await this.updatePreview();
        });

        this.customFontSelect = this.createCustomSelect(
            controlsGroup,
            'mp-font-select',
            this.getFontOptions()
        );

        // 添加字体选择器的 change 事件监听
        this.customFontSelect.querySelector('.custom-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.templateManager.setFont(value);
            await this.settingsManager.updateSettings({
                fontFamily: value
            });
            // 重新渲染预览
            await this.updatePreview();
        });
        this.customFontSelect.id = 'font-select';

        // 字号调整
        const fontSizeGroup = controlsGroup.createEl('div', { cls: 'mp-font-size-group' });
        const decreaseButton = fontSizeGroup.createEl('button', {
            cls: 'mp-font-size-btn',
            text: '-'
        });
        this.fontSizeSelect = fontSizeGroup.createEl('input', {
            cls: 'mp-font-size-input',
            type: 'text',
            value: '16',
            attr: {
                style: 'border: none; outline: none; background: transparent;'
            }
        });
        const increaseButton = fontSizeGroup.createEl('button', {
            cls: 'mp-font-size-btn',
            text: '+'
        });

        // 从设置中恢复上次的选择
        const settings = this.settingsManager.getSettings();

        // 恢复背景设置
        if (settings.backgroundId) {
            const backgroundSelect = this.customBackgroundSelect.querySelector('.selected-text');
            const backgroundDropdown = this.customBackgroundSelect.querySelector('.select-dropdown');
            if (backgroundSelect && backgroundDropdown) {
                const option = backgroundOptions.find(o => o.value === settings.backgroundId);
                if (option) {
                    backgroundSelect.textContent = option.label;
                    this.customBackgroundSelect.querySelector('.custom-select')?.setAttribute('data-value', option.value);
                    backgroundDropdown.querySelectorAll('.select-item').forEach(el => {
                        if (el.getAttribute('data-value') === option.value) {
                            el.classList.add('selected');
                        } else {
                            el.classList.remove('selected');
                        }
                    });
                }
            }
            this.backgroundManager.setBackground(settings.backgroundId);
        }

        // 恢复设置
        if (settings.templateId) {
            const templateSelect = this.customTemplateSelect.querySelector('.selected-text');
            const templateDropdown = this.customTemplateSelect.querySelector('.select-dropdown');
            if (templateSelect && templateDropdown) {
                const option = await this.getTemplateOptions();
                const selected = option.find(o => o.value === settings.templateId);
                if (selected) {
                    templateSelect.textContent = selected.label;
                    this.customTemplateSelect.querySelector('.custom-select')?.setAttribute('data-value', selected.value);
                    templateDropdown.querySelectorAll('.select-item').forEach(el => {
                        if (el.getAttribute('data-value') === selected.value) {
                            el.classList.add('selected');
                        } else {
                            el.classList.remove('selected');
                        }
                    });
                }
            }
            this.templateManager.setCurrentTemplate(settings.templateId);
        }

        if (settings.fontFamily) {
            const fontSelect = this.customFontSelect.querySelector('.selected-text');
            const fontDropdown = this.customFontSelect.querySelector('.select-dropdown');
            if (fontSelect && fontDropdown) {
                const option = this.getFontOptions();
                const selected = option.find(o => o.value === settings.fontFamily);
                if (selected) {
                    fontSelect.textContent = selected.label;
                    this.customFontSelect.querySelector('.custom-select')?.setAttribute('data-value', selected.value);
                    fontDropdown.querySelectorAll('.select-item').forEach(el => {
                        if (el.getAttribute('data-value') === selected.value) {
                            el.classList.add('selected');
                        } else {
                            el.classList.remove('selected');
                        }
                    });
                }
            }
            this.templateManager.setFont(settings.fontFamily);
        }

        if (settings.fontSize) {
            this.fontSizeSelect.value = settings.fontSize.toString();
            this.templateManager.setFontSize(settings.fontSize);
        }

        // 更新字号调整事件
        const updateFontSize = async () => {
            const size = parseInt(this.fontSizeSelect.value);
            this.templateManager.setFontSize(size);
            await this.settingsManager.updateSettings({
                fontSize: size
            });
            // 重新渲染预览
            await this.updatePreview();
        };

        // 字号调整按钮事件
        decreaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize > 12) {
                this.fontSizeSelect.value = (currentSize - 1).toString();
                updateFontSize();
            }
        });

        increaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize < 30) {
                this.fontSizeSelect.value = (currentSize + 1).toString();
                updateFontSize();
            }
        });

        this.fontSizeSelect.addEventListener('change', updateFontSize);
        // 预览区域
        this.previewEl = container.createEl('div', { cls: 'obsidian-md2stat-area' });

        // 底部工具栏
        const bottomBar = container.createEl('div', { cls: 'mp-bottom-bar' });
        // 创建中间控件容器
        const bottomControlsGroup = bottomBar.createEl('div', { cls: 'mp-controls-group' });


        // 导出按钮
        const exportButton = bottomControlsGroup.createEl('button', {
            text: '导出图片',
            cls: 'mp-export-button'
        });

        exportButton.addEventListener('click', async () => {
            if (this.previewEl) {
                exportButton.disabled = true;
                exportButton.setText('导出中...');

                try {
                    await ExportManager.exportToPng(this.previewEl);
                    exportButton.setText('导出成功');

                    setTimeout(() => {
                        exportButton.disabled = false;
                        exportButton.setText('导出图片');
                    }, 2000);
                } catch (error) {
                    exportButton.disabled = false;
                    exportButton.setText('导出图片');
                }
            }
        });

        // 复制按钮
        this.copyButton = bottomControlsGroup.createEl('button', {
            text: '复制到公众号',
            cls: 'mp-copy-button'
        });

        // 添加复制按钮点击事件
        this.copyButton.addEventListener('click', async () => {
            if (this.previewEl) {
                this.copyButton.disabled = true;
                this.copyButton.setText('复制中...');

                try {
                    await CopyManager.copyToClipboard(this.previewEl);
                    this.copyButton.setText('复制成功');

                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('复制为公众号格式');
                    }, 2000);
                } catch (error) {
                    this.copyButton.setText('复制失败');
                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('复制为公众号格式');
                    }, 2000);
                }
            }
        });

        // 监听文档变化
        this.registerEvent(
            this.app.workspace.on('file-open', this.onFileOpen.bind(this))
        );

        // 监听文档内容变化
        this.registerEvent(
            this.app.vault.on('modify', this.onFileModify.bind(this))
        );

        // 检查当前打开的文件
        const currentFile = this.app.workspace.getActiveFile();
        await this.onFileOpen(currentFile);
    }

    private updateControlsState(enabled: boolean) {

        // 更新所有自定义选择器的禁用状态
        const templateSelect = this.customTemplateSelect.querySelector('.custom-select');
        const fontSelect = this.customFontSelect.querySelector('.custom-select');
        const backgroundSelect = this.customBackgroundSelect.querySelector('.custom-select');

        [templateSelect, fontSelect, backgroundSelect].forEach(select => {
            if (select) {
                select.classList.toggle('disabled', !enabled);
                select.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
            }
        });

        this.fontSizeSelect.disabled = !enabled;
        this.copyButton.disabled = !enabled;

        // 字号调节按钮的状态控制
        const fontSizeButtons = this.containerEl.querySelectorAll('.mp-font-size-btn');
        fontSizeButtons.forEach(button => {
            (button as HTMLButtonElement).disabled = !enabled;
        });
    }

    async onFileOpen(file: TFile | null) {
        this.currentFile = file;
        if (!file || file.extension !== 'md') {
            this.previewEl.empty();
            this.previewEl.createEl('div', {
                text: '只能预览 markdown 文本文档',
                cls: 'mp-empty-message'
            });
            this.updateControlsState(false);
            return;
        }

        this.updateControlsState(true);

        await this.updatePreview();
    }



    async onFileModify(file: TFile) {
        if (file === this.currentFile) {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }

            this.updateTimer = setTimeout(() => {
                this.updatePreview();
            }, 500);
        }
    }

    async updatePreview() {
        if (!this.currentFile) return;

        // 保存当前滚动位置和内容高度
        const scrollPosition = this.previewEl.scrollTop;
        const prevHeight = this.previewEl.scrollHeight;
        const isAtBottom = (this.previewEl.scrollHeight - this.previewEl.scrollTop) <= (this.previewEl.clientHeight + 100);

        this.previewEl.empty();
        const content = await this.app.vault.cachedRead(this.currentFile);

        await MarkdownRenderer.render(
            this.app,
            content,
            this.previewEl,
            this.currentFile.path,
            this
        );

        await MPConverter.formatContent(this.previewEl);
        this.templateManager.applyTemplate(this.previewEl);
        this.backgroundManager.applyBackground(this.previewEl);

        // 根据滚动位置决定是否自动滚动
        if (isAtBottom) {
            // 如果用户在底部附近，自动滚动到底部
            requestAnimationFrame(() => {
                this.previewEl.scrollTop = this.previewEl.scrollHeight;
            });
        } else {
            // 否则保持原来的滚动位置
            const heightDiff = this.previewEl.scrollHeight - prevHeight;
            this.previewEl.scrollTop = scrollPosition + heightDiff;
        }
    }

    // 添加自定义下拉选择器创建方法
    private createCustomSelect(
        parent: HTMLElement,
        className: string,
        options: { value: string; label: string }[]
    ) {
        const container = parent.createEl('div', { cls: 'custom-select-container' });
        const select = container.createEl('div', { cls: 'custom-select' });
        const selectedText = select.createEl('span', { cls: 'selected-text' });
        const arrow = select.createEl('span', { cls: 'select-arrow', text: '▾' });

        const dropdown = container.createEl('div', { cls: 'select-dropdown' });

        options.forEach(option => {
            const item = dropdown.createEl('div', {
                cls: 'select-item',
                text: option.label
            });

            item.dataset.value = option.value;
            item.addEventListener('click', () => {
                // 移除其他项的选中状态
                dropdown.querySelectorAll('.select-item').forEach(el =>
                    el.classList.remove('selected'));
                // 添加当前项的选中状态
                item.classList.add('selected');
                selectedText.textContent = option.label;
                select.dataset.value = option.value;
                dropdown.classList.remove('show');
                select.dispatchEvent(new CustomEvent('change', {
                    detail: { value: option.value }
                }));
            });
        });

        // 设置默认值和选中状态
        if (options.length > 0) {
            selectedText.textContent = options[0].label;
            select.dataset.value = options[0].value;
            dropdown.querySelector('.select-item')?.classList.add('selected');
        }

        // 点击显示/隐藏下拉列表
        select.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // 点击其他地方关闭下拉列表
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        return container;
    }

    // 获取模板选项
    private async getTemplateOptions() {

        const templates = this.settingsManager.getVisibleTemplates();

        return templates.length > 0
            ? templates.map(t => ({ value: t.id, label: t.name }))
            : [{ value: 'default', label: '默认模板' }];
    }

    // 获取字体选项
    private getFontOptions() {
        return this.settingsManager.getFontOptions();
    }
}