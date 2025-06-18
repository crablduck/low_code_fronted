// 打印模板设计器类型定义

// 纸张尺寸配置
export interface PaperSize {
  name: string;
  width: number;  // mm
  height: number; // mm
}

// 页面配置
export interface PageConfig {
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale: number;
}

// 组件基础属性
export interface BaseComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

// 组件类型
export type ComponentType = 
  | 'text' 
  | 'line' 
  | 'table' 
  | 'qrcode' 
  | 'barcode' 
  | 'image' 
  | 'pageNumber';

// 边框样式
export interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

// 文本组件
export interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  fieldBinding?: string; // 字段绑定 {{field_name}}
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    backgroundColor?: string;
    border?: BorderStyle;
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

// 线条组件
export interface LineComponent extends BaseComponent {
  type: 'line';
  direction: 'horizontal' | 'vertical';
  style: {
    color: string;
    width: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
  };
}

// 表格单元格
export interface TableCell {
  content: string;
  fieldBinding?: string;
  colspan: number;
  rowspan: number;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    color: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

// 表格组件
export interface TableComponent extends BaseComponent {
  type: 'table';
  rows: number;
  cols: number;
  cells: TableCell[][];
  style: {
    borderColor: string;
    borderWidth: number;
    backgroundColor?: string;
  };
  dataBinding?: {
    source: string; // 数据源字段
    isDetail: boolean; // 是否为明细表
  };
}

// 二维码组件
export interface QRCodeComponent extends BaseComponent {
  type: 'qrcode';
  content: string;
  fieldBinding?: string;
  options: {
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    margin: number;
    color: {
      dark: string;
      light: string;
    };
  };
}

// 条形码组件
export interface BarcodeComponent extends BaseComponent {
  type: 'barcode';
  content: string;
  fieldBinding?: string;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  options: {
    displayValue: boolean;
    fontSize: number;
    textMargin: number;
    height: number;
  };
}

// 图片组件
export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt: string;
  style: {
    objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    border?: BorderStyle;
  };
}

// 页码组件
export interface PageNumberComponent extends BaseComponent {
  type: 'pageNumber';
  format: 'current' | 'total' | 'current/total';
  prefix: string;
  suffix: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

// 组件联合类型
export type PrintComponent = 
  | TextComponent 
  | LineComponent 
  | TableComponent 
  | QRCodeComponent 
  | BarcodeComponent 
  | ImageComponent 
  | PageNumberComponent;

// 数据字段
export interface DataField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  description?: string;
  defaultValue?: any;
}

// 模板数据
export interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  pageConfig: PageConfig;
  components: PrintComponent[];
  dataFields: DataField[];
  createdAt: string;
  updatedAt: string;
}

// 组件面板项
export interface ComponentPanelItem {
  type: ComponentType;
  name: string;
  icon: string;
  description: string;
  defaultProps: Partial<PrintComponent>;
}

// 拖拽数据
export interface DragData {
  type: 'component' | 'existing';
  componentType?: ComponentType;
  componentId?: string;
  offsetX?: number;
  offsetY?: number;
}

// 选择状态
export interface SelectionState {
  selectedIds: string[];
  isMultiSelect: boolean;
}

// 历史状态
export interface HistoryState {
  components: PrintComponent[];
  pageConfig: PageConfig;
  timestamp: number;
  description: string;
}

// 预览数据
export interface PreviewData {
  [fieldName: string]: any;
}

// 导出选项
export interface ExportOptions {
  format: 'pdf' | 'image' | 'html';
  quality?: number;
  filename?: string;
  pageBreak?: boolean;
}

// 网格配置
export interface GridConfig {
  enabled: boolean;
  size: number;
  snap: boolean;
  visible: boolean;
}

// 标尺配置
export interface RulerConfig {
  enabled: boolean;
  unit: 'mm' | 'px';
}

// 设计器状态
export interface DesignerState {
  template: PrintTemplate;
  pageConfig: PageConfig;
  components: PrintComponent[];
  selectedIds: string[];
  clipboard: PrintComponent[];
  history: HistoryState[];
  historyIndex: number;
  gridConfig: GridConfig;
  rulerConfig: RulerConfig;
  previewMode: boolean;
  previewData: PreviewData;
}

// 常用纸张尺寸
export const PAPER_SIZES: Record<string, PaperSize> = {
  A4: { name: 'A4', width: 210, height: 297 },
  A5: { name: 'A5', width: 148, height: 210 },
  B5: { name: 'B5', width: 176, height: 250 },
  Letter: { name: 'Letter', width: 216, height: 279 },
  Legal: { name: 'Legal', width: 216, height: 356 },
  Custom: { name: 'Custom', width: 210, height: 297 }
};

// 默认页面配置
export const DEFAULT_PAGE_CONFIG: PageConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  scale: 1
};

// 默认网格配置
export const DEFAULT_GRID_CONFIG: GridConfig = {
  enabled: true,
  size: 10,
  snap: true,
  visible: true
};

// 默认标尺配置
export const DEFAULT_RULER_CONFIG: RulerConfig = {
  enabled: true,
  unit: 'mm'
};

// 组件面板配置
export const COMPONENT_PANEL_ITEMS: ComponentPanelItem[] = [
  {
    type: 'text',
    name: '文本',
    icon: 'Document',
    description: '静态文本或动态字段',
    defaultProps: {
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
    } as Partial<TextComponent>
  },
  {
    type: 'line',
    name: '线条',
    icon: 'Minus',
    description: '横线、竖线、分隔线',
    defaultProps: {
      type: 'line',
      width: 100,
      height: 2,
      direction: 'horizontal',
      style: {
        color: '#000000',
        width: 1,
        lineStyle: 'solid'
      }
    } as Partial<LineComponent>
  },
  {
    type: 'table',
    name: '表格',
    icon: 'Grid',
    description: '数据表格，支持合并单元格',
    defaultProps: {
      type: 'table',
      width: 200,
      height: 100,
      rows: 3,
      cols: 3,
      style: {
        borderColor: '#000000',
        borderWidth: 1
      }
    } as Partial<TableComponent>
  },
  {
    type: 'qrcode',
    name: '二维码',
    icon: 'Grid',
    description: '二维码，可绑定数据',
    defaultProps: {
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
    } as Partial<QRCodeComponent>
  },
  {
    type: 'barcode',
    name: '条形码',
    icon: 'Grid',
    description: '条形码，可绑定数据',
    defaultProps: {
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
    } as Partial<BarcodeComponent>
  },
  {
    type: 'image',
    name: '图片',
    icon: 'Picture',
    description: '图片，支持Logo上传',
    defaultProps: {
      type: 'image',
      width: 100,
      height: 100,
      src: '',
      alt: '图片',
      style: {
        objectFit: 'contain'
      }
    } as Partial<ImageComponent>
  },
  {
    type: 'pageNumber',
    name: '页码',
    icon: 'Document',
    description: '页码显示',
    defaultProps: {
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
    } as Partial<PageNumberComponent>
  }
]; 