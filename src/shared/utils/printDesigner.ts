// 打印模板设计器工具函数

import { v4 as uuidv4 } from 'uuid';
import html2pdf from 'html2pdf.js';
import { PAPER_SIZES } from '@/shared/types/printDesigner';
import type { 
  PrintComponent, 
  PageConfig, 
  ComponentType,
  TextComponent,
  LineComponent,
  TableComponent,
  QRCodeComponent,
  BarcodeComponent,
  ImageComponent,
  PageNumberComponent,
  TableCell,
  PreviewData,
  ExportOptions
} from '@/shared/types/printDesigner';

// 单位转换工具
export class UnitConverter {
  // mm转px (96 DPI)
  static mmToPx(mm: number): number {
    return Math.round(mm * 3.7795275591);
  }

  // px转mm
  static pxToMm(px: number): number {
    return px / 3.7795275591;
  }

  // 获取页面尺寸（px）
  static getPageSizePx(pageConfig: PageConfig): { width: number; height: number } {
    const paperSize = PAPER_SIZES[pageConfig.paperSize];
    if (!paperSize) {
      throw new Error(`Unknown paper size: ${pageConfig.paperSize}`);
    }

    let { width, height } = paperSize;
    
    // 横向时交换宽高
    if (pageConfig.orientation === 'landscape') {
      [width, height] = [height, width];
    }

    return {
      width: this.mmToPx(width),
      height: this.mmToPx(height)
    };
  }

  // 获取内容区域尺寸（px）
  static getContentSizePx(pageConfig: PageConfig): { width: number; height: number } {
    const pageSize = this.getPageSizePx(pageConfig);
    const margin = pageConfig.margin;

    return {
      width: pageSize.width - this.mmToPx(margin.left + margin.right),
      height: pageSize.height - this.mmToPx(margin.top + margin.bottom)
    };
  }
}

// 组件工厂
export class ComponentFactory {
  // 创建新组件
  static createComponent(type: ComponentType, x: number = 0, y: number = 0): PrintComponent {
    const baseProps = {
      id: uuidv4(),
      x,
      y,
      zIndex: 1,
      locked: false,
      visible: true
    };

    switch (type) {
      case 'text':
        return {
          ...baseProps,
          type: 'text',
          width: 100,
          height: 30,
          content: '文本内容',
          style: {
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
            lineHeight: 1.5,
            padding: { top: 5, right: 5, bottom: 5, left: 5 }
          }
        } as TextComponent;

      case 'line':
        return {
          ...baseProps,
          type: 'line',
          width: 100,
          height: 2,
          direction: 'horizontal',
          style: {
            color: '#000000',
            width: 1,
            lineStyle: 'solid'
          }
        } as LineComponent;

      case 'table':
        const rows = 3;
        const cols = 3;
        const cells: TableCell[][] = [];
        
        for (let i = 0; i < rows; i++) {
          cells[i] = [];
          for (let j = 0; j < cols; j++) {
            cells[i][j] = {
              content: `单元格 ${i + 1}-${j + 1}`,
              colspan: 1,
              rowspan: 1,
              style: {
                fontSize: 12,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                color: '#000000',
                textAlign: 'left',
                padding: { top: 3, right: 3, bottom: 3, left: 3 }
              }
            };
          }
        }

        return {
          ...baseProps,
          type: 'table',
          width: 200,
          height: 100,
          rows,
          cols,
          cells,
          style: {
            borderColor: '#000000',
            borderWidth: 1
          }
        } as TableComponent;

      case 'qrcode':
        return {
          ...baseProps,
          type: 'qrcode',
          width: 80,
          height: 80,
          content: 'QR Code',
          options: {
            errorCorrectionLevel: 'M',
            margin: 4,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }
        } as QRCodeComponent;

      case 'barcode':
        return {
          ...baseProps,
          type: 'barcode',
          width: 120,
          height: 50,
          content: '123456789',
          format: 'CODE128',
          options: {
            displayValue: true,
            fontSize: 12,
            textMargin: 2,
            height: 40
          }
        } as BarcodeComponent;

      case 'image':
        return {
          ...baseProps,
          type: 'image',
          width: 100,
          height: 100,
          src: '',
          alt: '图片',
          style: {
            objectFit: 'contain'
          }
        } as ImageComponent;

      case 'pageNumber':
        return {
          ...baseProps,
          type: 'pageNumber',
          width: 60,
          height: 20,
          format: 'current/total',
          prefix: '第',
          suffix: '页',
          style: {
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'center'
          }
        } as PageNumberComponent;

      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }

  // 克隆组件
  static cloneComponent(component: PrintComponent, offsetX: number = 10, offsetY: number = 10): PrintComponent {
    const cloned = JSON.parse(JSON.stringify(component));
    cloned.id = uuidv4();
    cloned.x += offsetX;
    cloned.y += offsetY;
    return cloned;
  }
}

// 对齐工具
export class AlignmentHelper {
  // 左对齐
  static alignLeft(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const minX = Math.min(...components.map(c => c.x));
    return components.map(c => ({ ...c, x: minX }));
  }

  // 右对齐
  static alignRight(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const maxRight = Math.max(...components.map(c => c.x + c.width));
    return components.map(c => ({ ...c, x: maxRight - c.width }));
  }

  // 顶部对齐
  static alignTop(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const minY = Math.min(...components.map(c => c.y));
    return components.map(c => ({ ...c, y: minY }));
  }

  // 底部对齐
  static alignBottom(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const maxBottom = Math.max(...components.map(c => c.y + c.height));
    return components.map(c => ({ ...c, y: maxBottom - c.height }));
  }

  // 水平居中对齐
  static alignCenterHorizontal(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const centerX = components.reduce((sum, c) => sum + c.x + c.width / 2, 0) / components.length;
    return components.map(c => ({ ...c, x: centerX - c.width / 2 }));
  }

  // 垂直居中对齐
  static alignCenterVertical(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 2) return components;
    
    const centerY = components.reduce((sum, c) => sum + c.y + c.height / 2, 0) / components.length;
    return components.map(c => ({ ...c, y: centerY - c.height / 2 }));
  }

  // 水平分布
  static distributeHorizontal(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 3) return components;
    
    const sorted = [...components].sort((a, b) => a.x - b.x);
    const totalWidth = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
    const totalComponentWidth = sorted.reduce((sum, c) => sum + c.width, 0);
    const spacing = (totalWidth - totalComponentWidth) / (sorted.length - 1);
    
    let currentX = sorted[0].x;
    return sorted.map(c => {
      const newComponent = { ...c, x: currentX };
      currentX += c.width + spacing;
      return newComponent;
    });
  }

  // 垂直分布
  static distributeVertical(components: PrintComponent[]): PrintComponent[] {
    if (components.length < 3) return components;
    
    const sorted = [...components].sort((a, b) => a.y - b.y);
    const totalHeight = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
    const totalComponentHeight = sorted.reduce((sum, c) => sum + c.height, 0);
    const spacing = (totalHeight - totalComponentHeight) / (sorted.length - 1);
    
    let currentY = sorted[0].y;
    return sorted.map(c => {
      const newComponent = { ...c, y: currentY };
      currentY += c.height + spacing;
      return newComponent;
    });
  }
}

// 网格吸附工具
export class GridSnap {
  // 吸附到网格
  static snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  // 吸附组件位置
  static snapComponent(component: PrintComponent, gridSize: number): PrintComponent {
    return {
      ...component,
      x: this.snapToGrid(component.x, gridSize),
      y: this.snapToGrid(component.y, gridSize),
      width: Math.max(gridSize, this.snapToGrid(component.width, gridSize)),
      height: Math.max(gridSize, this.snapToGrid(component.height, gridSize))
    };
  }
}

// 数据绑定工具
export class DataBinding {
  // 解析字段绑定
  static parseFieldBinding(text: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches;
  }

  // 替换字段绑定
  static replaceFieldBinding(text: string, data: PreviewData): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, fieldName) => {
      const trimmedFieldName = fieldName.trim();
      return data[trimmedFieldName] !== undefined ? String(data[trimmedFieldName]) : match;
    });
  }

  // 获取组件绑定的字段
  static getComponentFields(component: PrintComponent): string[] {
    const fields: string[] = [];

    switch (component.type) {
      case 'text':
        if (component.fieldBinding) {
          fields.push(...this.parseFieldBinding(component.fieldBinding));
        }
        fields.push(...this.parseFieldBinding(component.content));
        break;

      case 'qrcode':
      case 'barcode':
        if (component.fieldBinding) {
          fields.push(...this.parseFieldBinding(component.fieldBinding));
        }
        fields.push(...this.parseFieldBinding(component.content));
        break;

      case 'table':
        component.cells.forEach(row => {
          row.forEach(cell => {
            if (cell.fieldBinding) {
              fields.push(...this.parseFieldBinding(cell.fieldBinding));
            }
            fields.push(...this.parseFieldBinding(cell.content));
          });
        });
        break;
    }

    return [...new Set(fields)]; // 去重
  }
}

// 导出工具
export class ExportHelper {
  // 导出为PDF
  static async exportToPDF(element: HTMLElement, options: Partial<ExportOptions> = {}): Promise<void> {
    const defaultOptions = {
      margin: 0,
      filename: options.filename || 'print-template.pdf',
      image: { type: 'jpeg', quality: options.quality || 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    try {
      await html2pdf().set(defaultOptions).from(element).save();
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw error;
    }
  }

  // 导出为图片
  static async exportToImage(element: HTMLElement, options: Partial<ExportOptions> = {}): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }

    // 设置canvas尺寸
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width * 2; // 高分辨率
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // 绘制元素到canvas
    const data = new XMLSerializer().serializeToString(element);
    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', options.quality || 0.98));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // 打印
  static print(element: HTMLElement): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('无法打开打印窗口');
    }

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印模板</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

// 模板验证工具
export class TemplateValidator {
  // 验证组件
  static validateComponent(component: PrintComponent): string[] {
    const errors: string[] = [];

    // 基础验证
    if (!component.id) {
      errors.push('组件ID不能为空');
    }

    if (component.width <= 0) {
      errors.push('组件宽度必须大于0');
    }

    if (component.height <= 0) {
      errors.push('组件高度必须大于0');
    }

    // 类型特定验证
    switch (component.type) {
      case 'text':
        if (!component.content.trim()) {
          errors.push('文本内容不能为空');
        }
        break;

      case 'image':
        if (!component.src) {
          errors.push('图片源不能为空');
        }
        break;

      case 'qrcode':
      case 'barcode':
        if (!component.content.trim()) {
          errors.push('二维码/条形码内容不能为空');
        }
        break;

      case 'table':
        if (component.rows <= 0 || component.cols <= 0) {
          errors.push('表格行列数必须大于0');
        }
        break;
    }

    return errors;
  }

  // 验证模板
  static validateTemplate(components: PrintComponent[], pageConfig: PageConfig): string[] {
    const errors: string[] = [];
    const pageSize = UnitConverter.getPageSizePx(pageConfig);

    // 验证每个组件
    components.forEach((component, index) => {
      const componentErrors = this.validateComponent(component);
      componentErrors.forEach(error => {
        errors.push(`组件${index + 1}: ${error}`);
      });

      // 检查组件是否超出页面边界
      if (component.x + component.width > pageSize.width) {
        errors.push(`组件${index + 1}: 超出页面右边界`);
      }

      if (component.y + component.height > pageSize.height) {
        errors.push(`组件${index + 1}: 超出页面下边界`);
      }
    });

    // 检查组件ID重复
    const ids = components.map(c => c.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`存在重复的组件ID: ${duplicateIds.join(', ')}`);
    }

    return errors;
  }
}

// 历史记录管理
export class HistoryManager {
  private history: any[] = [];
  private currentIndex = -1;
  private maxSize = 50;

  // 添加历史记录
  addHistory(state: any, description: string = ''): void {
    // 移除当前索引之后的历史记录
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // 添加新的历史记录
    this.history.push({
      state: JSON.parse(JSON.stringify(state)),
      description,
      timestamp: Date.now()
    });

    // 限制历史记录大小
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // 撤销
  undo(): any | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].state));
    }
    return null;
  }

  // 重做
  redo(): any | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].state));
    }
    return null;
  }

  // 检查是否可以撤销
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // 检查是否可以重做
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // 清空历史记录
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // 获取历史记录列表
  getHistory(): Array<{ description: string; timestamp: number }> {
    return this.history.map(item => ({
      description: item.description,
      timestamp: item.timestamp
    }));
  }
} 