import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Notice } from 'obsidian';

export class PDFExporter {
    /**
     * 导出 HTML 元素为 PDF
     * @param element - 要导出的 HTML 元素
     * @param filename - PDF 文件名
     */
    static async exportToPDF(element: HTMLElement, filename: string = 'export.pdf'): Promise<void> {
        try {
            // 克隆元素避免影响原页面
            const clonedElement = element.cloneNode(true) as HTMLElement;
            
            // 临时添加到页面（不可见）
            clonedElement.style.position = 'absolute';
            clonedElement.style.left = '-9999px';
            clonedElement.style.width = '800px'; // 固定宽度以获得更好的PDF效果
            document.body.appendChild(clonedElement);

            try {
                // 1. 将 HTML 渲染为 Canvas
                const canvas = await html2canvas(clonedElement, {
                    scale: 2, // 提高分辨率，确保PDF清晰
                    useCORS: true, // 支持跨域图片
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 800,
                    windowHeight: clonedElement.scrollHeight
                });

                // 2. 计算 PDF 页面尺寸
                const imgWidth = 210; // A4 宽度（mm）
                const pageHeight = 297; // A4 高度（mm）
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // 3. 创建 PDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                let heightLeft = imgHeight;
                let position = 0;

                // 4. 分页插入图片
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                // 5. 保存 PDF
                pdf.save(filename);
            } finally {
                // 清理临时元素
                document.body.removeChild(clonedElement);
            }
        } catch (error) {
            console.error('PDF 导出失败:', error);
            throw new Error('PDF 导出失败，请重试');
        }
    }
}
