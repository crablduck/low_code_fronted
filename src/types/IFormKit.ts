// 表单控件类型
export type FormControlType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'switch'
  | 'radio'
  | 'checkbox'
  | 'time'
  | 'datetime'
  | 'upload'
  | 'slider'

// 选项类型
export interface IOption {
  label: string
  value: string | number
}

// 验证规则类型
export interface IValidation {
  required?: boolean
  message?: string
  min?: number
  max?: number
  pattern?: string
  validator?: (rule: any, value: any, callback: any) => void
}

// 数据库字段类型
export type DBFieldType = 'VARCHAR' | 'INT' | 'DECIMAL' | 'TEXT' | 'DATE' | 'DATETIME' | 'BOOLEAN'

// 表单控件配置接口
export interface IFormControl {
  id: string
  type: FormControlType
  field: string
  label: string
  placeholder?: string
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  validation?: IValidation
  options?: IOption[]
  value?: any
  props?: Record<string, any>
  style?: Record<string, any>
  events?: {
    onChange?: string
  }
  icon?: string
}

// 表单设计器状态接口
export interface IFormDesignerState {
  formControls: IFormControl[]
  selectedControl: IFormControl | null
  activeTab: string
  activeNames: string[]
} 