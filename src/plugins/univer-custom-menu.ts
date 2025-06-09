import { ICommandService } from '@univerjs/core'
import { SetRangeValuesCommand } from '@univerjs/sheets'

// 自定义命令和菜单ID
export const DATA_SOURCE_COMPUTE_COMMAND = 'data-source-compute'
export const DATA_SOURCE_COMPUTE_MENU_ID = 'data-source-compute-menu'

// 插件配置接口
export interface IUniverSheetsCustomMenuConfig {
  enableDataSourceCompute?: boolean
  enableRightClickMenu?: boolean
  enableToolbarMenu?: boolean
}

// 简化的插件类 - 不继承复杂的 Plugin 基类
export class UniverSheetsCustomMenuPlugin {
  static pluginName = 'UNIVER_SHEETS_CUSTOM_MENU_PLUGIN'
  
  private _config: IUniverSheetsCustomMenuConfig
  private _eventListeners: Array<() => void> = []
  
  constructor(config: IUniverSheetsCustomMenuConfig = {}) {
    this._config = {
      enableDataSourceCompute: true,
      enableRightClickMenu: true,
      enableToolbarMenu: false,
      ...config
    }
  }

  // 初始化插件
  init() {
    try {
      console.log('🔧 初始化 Univer 自定义菜单插件')
      
      if (this._config.enableRightClickMenu) {
        this._setupContextMenu()
      }
      
      if (this._config.enableToolbarMenu) {
        this._setupToolbarMenu()
      }
      
      console.log('✅ Univer 自定义菜单插件初始化完成')
    } catch (error) {
      console.error('❌ 插件初始化失败:', error)
    }
  }

  // 销毁插件
  dispose() {
    console.log('🧹 销毁 Univer 自定义菜单插件')
    this._eventListeners.forEach(cleanup => cleanup())
    this._eventListeners.length = 0
  }

  private _setupContextMenu() {
    // 简化的右键菜单设置
    console.log('📝 设置右键菜单项')
    
    // 在这里我们暂时使用事件监听来模拟菜单功能
    // 实际项目中，这里应该是通过 Univer 的菜单 API 来添加菜单项
    const handleContextMenu = (event: MouseEvent) => {
      // 检查是否在 Univer 容器内
      const target = event.target as HTMLElement
      const univerContainer = target?.closest('.univer-container, .univer-sheet-container')
      
      if (univerContainer) {
        console.log('🧮 右键菜单：数据源计算选项可用')
        // 在实际实现中，这里会显示自定义菜单
      }
    }
    
    document.addEventListener('contextmenu', handleContextMenu)
    this._eventListeners.push(() => {
      document.removeEventListener('contextmenu', handleContextMenu)
    })
  }

  private _setupToolbarMenu() {
    console.log('🛠️ 设置工具栏菜单项')
    // 工具栏菜单设置逻辑
  }

  // 触发数据源计算对话框
  public triggerDataSourceCompute(cellInfo?: any) {
    console.log('🧮 触发数据源计算功能', cellInfo)
    
    const mockCellInfo = cellInfo || {
      row: 0,
      col: 0,
      sheetId: 'sheet-1',
      unitId: 'workbook-1'
    }
    
    const mockRange = {
      startRow: mockCellInfo.row,
      endRow: mockCellInfo.row,
      startColumn: mockCellInfo.col,
      endColumn: mockCellInfo.col
    }
    
    // 发送自定义事件到 Vue 组件
    const event = new CustomEvent('univer-data-source-compute', {
      detail: {
        selection: { range: mockRange },
        cellInfo: mockCellInfo,
        range: mockRange,
        source: 'plugin-trigger'
      }
    })
    
    // 派发事件
    window.dispatchEvent(event)
    document.dispatchEvent(event)
  }

  // 静态工具方法：写入计算结果到单元格
  public static async writeComputedValue(
    commandService: ICommandService,
    cellInfo: { 
      row: number
      col: number
      sheetId: string
      unitId: string
    },
    value: any,
    bindingInfo?: any
  ): Promise<boolean> {
    try {
      console.log('✍️ 写入计算结果到单元格', { cellInfo, value, bindingInfo })
      
      // 构建值对象
      const cellValue = {
        v: value,
        // 可以在这里添加自定义属性来标记数据绑定
        ...(bindingInfo && { 
          _binding: bindingInfo,
          _computedAt: new Date().toISOString()
        })
      }

      // 使用 SetRangeValuesCommand 设置单元格值
      const params = {
        unitId: cellInfo.unitId,
        subUnitId: cellInfo.sheetId,
        range: {
          startRow: cellInfo.row,
          endRow: cellInfo.row,
          startColumn: cellInfo.col,
          endColumn: cellInfo.col
        },
        value: {
          [cellInfo.row]: {
            [cellInfo.col]: cellValue
          }
        }
      }

      const result = await commandService.executeCommand(SetRangeValuesCommand.id, params)
      console.log('✅ 单元格值写入结果:', result)
      
      return !!result
    } catch (error) {
      console.error('❌ 写入计算值失败:', error)
      return false
    }
  }

  // 静态工具方法：批量写入多个单元格的计算结果
  public static async writeComputedValues(
    commandService: ICommandService,
    values: Array<{
      cellInfo: { row: number; col: number; sheetId: string; unitId: string }
      value: any
      bindingInfo?: any
    }>
  ): Promise<boolean> {
    try {
      if (values.length === 0) return true

      console.log('📝 批量写入计算结果', values.length, '个单元格')
      
      // 简化版本：逐个写入
      const results = await Promise.all(
        values.map(({ cellInfo, value, bindingInfo }) => 
          this.writeComputedValue(commandService, cellInfo, value, bindingInfo)
        )
      )

      return results.every(result => result)
    } catch (error) {
      console.error('❌ 批量写入计算值失败:', error)
      return false
    }
  }
}

// 插件实例管理
let pluginInstance: UniverSheetsCustomMenuPlugin | null = null

// 导出插件工厂函数
export function createUniverSheetsCustomMenuPlugin(config?: IUniverSheetsCustomMenuConfig) {
  if (pluginInstance) {
    pluginInstance.dispose()
  }
  
  pluginInstance = new UniverSheetsCustomMenuPlugin(config)
  pluginInstance.init()
  
  return pluginInstance
}

// 获取插件实例
export function getUniverSheetsCustomMenuPlugin() {
  return pluginInstance
}

// 清理插件
export function disposeUniverSheetsCustomMenuPlugin() {
  if (pluginInstance) {
    pluginInstance.dispose()
    pluginInstance = null
  }
} 