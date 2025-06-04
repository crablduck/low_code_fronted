<template>
  <div class="api-test">
    <el-card>
      <template #header>
        <div class="header-content">
          <h2>API连接测试</h2>
          <el-button
            @click="testAllApis"
            :loading="allTestsLoading"
            type="success"
          >
            一键测试所有API
          </el-button>
        </div>
      </template>

      <el-space direction="vertical" size="large" style="width: 100%">
        <!-- 基础API测试 -->
        <el-card>
          <template #header>
            <h3>🔧 基础API测试</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>健康检查</template>
                <el-button
                  @click="testHealth"
                  :loading="healthLoading"
                  type="primary"
                  style="width: 100%"
                >
                  测试健康检查
                </el-button>
                <div v-if="healthResult" class="result">
                  <el-tag
                    :type="healthResult.code === 200 ? 'success' : 'danger'"
                  >
                    {{ healthResult.code === 200 ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <pre>{{ JSON.stringify(healthResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>菜单列表</template>
                <el-button
                  @click="testMenus"
                  :loading="menuLoading"
                  type="primary"
                  style="width: 100%"
                >
                  测试菜单列表
                </el-button>
                <div v-if="menuResult" class="result">
                  <el-tag
                    :type="menuResult.code === 200 ? 'success' : 'danger'"
                  >
                    {{ menuResult.code === 200 ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    菜单数量: {{ menuResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(menuResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>数据源列表</template>
                <el-button
                  @click="testDataSources"
                  :loading="dataSourceLoading"
                  type="primary"
                  style="width: 100%"
                >
                  测试数据源列表
                </el-button>
                <div v-if="dataSourceResult" class="result">
                  <el-tag
                    :type="dataSourceResult.code === 200 ? 'success' : 'danger'"
                  >
                    {{ dataSourceResult.code === 200 ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    数据源数量: {{ dataSourceResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(dataSourceResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <!-- 表单配置API测试 -->
        <el-card>
          <template #header>
            <h3>📝 表单配置API测试</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>表单配置列表</template>
                <el-button
                  @click="testFormConfigs"
                  :loading="formConfigsLoading"
                  type="primary"
                  style="width: 100%"
                >
                  测试表单配置列表
                </el-button>
                <div v-if="formConfigsResult" class="result">
                  <el-tag
                    :type="
                      formConfigsResult.code === 200 ? 'success' : 'danger'
                    "
                  >
                    {{ formConfigsResult.code === 200 ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    表单数量: {{ formConfigsResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(formConfigsResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>

            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>表格列表</template>
                <el-button
                  @click="testTableList"
                  :loading="tableListLoading"
                  type="primary"
                  style="width: 100%"
                >
                  测试表格列表
                </el-button>
                <div v-if="tableListResult" class="result">
                  <el-tag
                    :type="tableListResult.code === 200 ? 'success' : 'danger'"
                  >
                    {{ tableListResult.code === 200 ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    表格数量: {{ tableListResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(tableListResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <!-- Mock Server API测试 -->
        <el-card>
          <template #header>
            <h3>🎭 Mock Server API测试</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>用户列表 (Mock)</template>
                <el-button
                  @click="testMockUsers"
                  :loading="mockUsersLoading"
                  type="warning"
                  style="width: 100%"
                >
                  测试Mock用户列表
                </el-button>
                <div v-if="mockUsersResult" class="result">
                  <el-tag
                    :type="mockUsersResult.success ? 'success' : 'danger'"
                  >
                    {{ mockUsersResult.success ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    用户数量: {{ mockUsersResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(mockUsersResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>商品列表 (Mock)</template>
                <el-button
                  @click="testMockProducts"
                  :loading="mockProductsLoading"
                  type="warning"
                  style="width: 100%"
                >
                  测试Mock商品列表
                </el-button>
                <div v-if="mockProductsResult" class="result">
                  <el-tag
                    :type="mockProductsResult.success ? 'success' : 'danger'"
                  >
                    {{ mockProductsResult.success ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    商品数量: {{ mockProductsResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(mockProductsResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover">
                <template #header>订单列表 (Mock)</template>
                <el-button
                  @click="testMockOrders"
                  :loading="mockOrdersLoading"
                  type="warning"
                  style="width: 100%"
                >
                  测试Mock订单列表
                </el-button>
                <div v-if="mockOrdersResult" class="result">
                  <el-tag
                    :type="mockOrdersResult.success ? 'success' : 'danger'"
                  >
                    {{ mockOrdersResult.success ? "✅ 成功" : "❌ 失败" }}
                  </el-tag>
                  <div class="result-summary">
                    订单数量: {{ mockOrdersResult.data?.length || 0 }}
                  </div>
                  <pre>{{ JSON.stringify(mockOrdersResult, null, 2) }}</pre>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <!-- 自定义API测试 -->
        <el-card>
          <template #header>
            <h3>🔧 自定义API测试</h3>
          </template>

          <el-form :model="customApiForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="请求方法">
                  <el-select v-model="customApiForm.method" style="width: 100%">
                    <el-option label="GET" value="GET" />
                    <el-option label="POST" value="POST" />
                    <el-option label="PUT" value="PUT" />
                    <el-option label="DELETE" value="DELETE" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="API地址">
                  <el-input
                    v-model="customApiForm.url"
                    placeholder="输入API地址，如: http://localhost:4000/api/health"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="请求体" v-if="customApiForm.method !== 'GET'">
              <el-input
                v-model="customApiForm.body"
                type="textarea"
                :rows="4"
                placeholder="输入JSON格式的请求体（可选）"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                @click="testCustomApi"
                :loading="customApiLoading"
                type="primary"
              >
                发送请求
              </el-button>
              <el-button @click="clearCustomResult">清空结果</el-button>
            </el-form-item>
          </el-form>

          <div v-if="customApiResult" class="result">
            <el-tag :type="customApiResult.success ? 'success' : 'danger'">
              {{ customApiResult.success ? "✅ 成功" : "❌ 失败" }}
            </el-tag>
            <div class="result-summary">
              状态码: {{ customApiResult.status }}
            </div>
            <pre>{{ JSON.stringify(customApiResult.data, null, 2) }}</pre>
          </div>
        </el-card>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";

// 响应式数据
const allTestsLoading = ref(false);
const healthLoading = ref(false);
const menuLoading = ref(false);
const dataSourceLoading = ref(false);
const formConfigsLoading = ref(false);
const tableListLoading = ref(false);
const mockUsersLoading = ref(false);
const mockProductsLoading = ref(false);
const mockOrdersLoading = ref(false);
const customApiLoading = ref(false);

const healthResult = ref(null);
const menuResult = ref(null);
const dataSourceResult = ref(null);
const formConfigsResult = ref(null);
const tableListResult = ref(null);
const mockUsersResult = ref(null);
const mockProductsResult = ref(null);
const mockOrdersResult = ref(null);
const customApiResult = ref(null);

// 自定义API表单
const customApiForm = reactive({
  method: "GET",
  url: "http://localhost:4000/api/health",
  body: "",
});

// 测试健康检查
const testHealth = async () => {
  healthLoading.value = true;
  try {
    const response = await fetch("http://localhost:4000/api/health");
    const result = await response.json();
    healthResult.value = result;
    ElMessage.success("健康检查成功");
  } catch (error) {
    console.error("健康检查失败:", error);
    healthResult.value = { code: 500, message: error.message };
    ElMessage.error("健康检查失败: " + error.message);
  } finally {
    healthLoading.value = false;
  }
};

// 测试菜单列表
const testMenus = async () => {
  menuLoading.value = true;
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "x-access-token": token,
    };
    const response = await fetch("http://localhost:4000/api/menu-list", {
      headers,
    });
    const result = await response.json();
    menuResult.value = result;
    ElMessage.success("菜单列表获取成功");
  } catch (error) {
    console.error("菜单列表获取失败:", error);
    menuResult.value = { code: 500, message: error.message };
    ElMessage.error("菜单列表获取失败: " + error.message);
  } finally {
    menuLoading.value = false;
  }
};

// 测试数据源列表
const testDataSources = async () => {
  dataSourceLoading.value = true;
  try {
    const response = await fetch("http://localhost:4000/api/data-sources");
    const result = await response.json();
    dataSourceResult.value = result;
    ElMessage.success("数据源列表获取成功");
  } catch (error) {
    console.error("数据源列表获取失败:", error);
    dataSourceResult.value = { code: 500, message: error.message };
    ElMessage.error("数据源列表获取失败: " + error.message);
  } finally {
    dataSourceLoading.value = false;
  }
};

// 测试表单配置列表
const testFormConfigs = async () => {
  formConfigsLoading.value = true;
  try {
    const response = await fetch("http://localhost:4000/api/form-configs");
    const result = await response.json();
    formConfigsResult.value = result;
    ElMessage.success("表单配置列表获取成功");
  } catch (error) {
    console.error("表单配置列表获取失败:", error);
    formConfigsResult.value = { code: 500, message: error.message };
    ElMessage.error("表单配置列表获取失败: " + error.message);
  } finally {
    formConfigsLoading.value = false;
  }
};

// 测试表格列表
const testTableList = async () => {
  tableListLoading.value = true;
  try {
    const response = await fetch(
      "http://localhost:4000/api/table-list?db=mysql_main"
    );
    const result = await response.json();
    tableListResult.value = result;
    ElMessage.success("表格列表获取成功");
  } catch (error) {
    console.error("表格列表获取失败:", error);
    tableListResult.value = { code: 500, message: error.message };
    ElMessage.error("表格列表获取失败: " + error.message);
  } finally {
    tableListLoading.value = false;
  }
};

// 测试Mock用户列表
const testMockUsers = async () => {
  mockUsersLoading.value = true;
  try {
    // 模拟Mock API调用
    const mockData = {
      success: true,
      data: [
        { id: 1, name: "张三", email: "zhangsan@example.com", role: "admin" },
        { id: 2, name: "李四", email: "lisi@example.com", role: "user" },
        { id: 3, name: "王五", email: "wangwu@example.com", role: "user" },
      ],
      total: 3,
    };

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    mockUsersResult.value = mockData;
    ElMessage.success("Mock用户列表获取成功");
  } catch (error) {
    console.error("Mock用户列表获取失败:", error);
    mockUsersResult.value = { success: false, message: error.message };
    ElMessage.error("Mock用户列表获取失败: " + error.message);
  } finally {
    mockUsersLoading.value = false;
  }
};

// 测试Mock商品列表
const testMockProducts = async () => {
  mockProductsLoading.value = true;
  try {
    const mockData = {
      success: true,
      data: [
        { id: 1, name: "iPhone 15", price: 7999, category: "手机", stock: 100 },
        {
          id: 2,
          name: "MacBook Pro",
          price: 15999,
          category: "电脑",
          stock: 50,
        },
        {
          id: 3,
          name: "AirPods Pro",
          price: 1999,
          category: "耳机",
          stock: 200,
        },
      ],
      total: 3,
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    mockProductsResult.value = mockData;
    ElMessage.success("Mock商品列表获取成功");
  } catch (error) {
    console.error("Mock商品列表获取失败:", error);
    mockProductsResult.value = { success: false, message: error.message };
    ElMessage.error("Mock商品列表获取失败: " + error.message);
  } finally {
    mockProductsLoading.value = false;
  }
};

// 测试Mock订单列表
const testMockOrders = async () => {
  mockOrdersLoading.value = true;
  try {
    const mockData = {
      success: true,
      data: [
        {
          id: 1001,
          userId: 1,
          productId: 1,
          quantity: 1,
          status: "已支付",
          total: 7999,
        },
        {
          id: 1002,
          userId: 2,
          productId: 2,
          quantity: 1,
          status: "待发货",
          total: 15999,
        },
        {
          id: 1003,
          userId: 3,
          productId: 3,
          quantity: 2,
          status: "已完成",
          total: 3998,
        },
      ],
      total: 3,
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    mockOrdersResult.value = mockData;
    ElMessage.success("Mock订单列表获取成功");
  } catch (error) {
    console.error("Mock订单列表获取失败:", error);
    mockOrdersResult.value = { success: false, message: error.message };
    ElMessage.error("Mock订单列表获取失败: " + error.message);
  } finally {
    mockOrdersLoading.value = false;
  }
};

// 测试自定义API
const testCustomApi = async () => {
  if (!customApiForm.url) {
    ElMessage.warning("请输入API地址");
    return;
  }

  customApiLoading.value = true;
  try {
    const options: RequestInit = {
      method: customApiForm.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (customApiForm.method !== "GET" && customApiForm.body) {
      options.body = customApiForm.body;
    }

    const response = await fetch(customApiForm.url, options);
    const result = await response.json();

    customApiResult.value = {
      success: response.ok,
      status: response.status,
      data: result,
    };

    if (response.ok) {
      ElMessage.success("自定义API请求成功");
    } else {
      ElMessage.error("自定义API请求失败");
    }
  } catch (error) {
    console.error("自定义API请求失败:", error);
    customApiResult.value = {
      success: false,
      status: 0,
      data: { message: error.message },
    };
    ElMessage.error("自定义API请求失败: " + error.message);
  } finally {
    customApiLoading.value = false;
  }
};

// 清空自定义结果
const clearCustomResult = () => {
  customApiResult.value = null;
};

// 一键测试所有API
const testAllApis = async () => {
  allTestsLoading.value = true;
  try {
    ElMessage.info("开始测试所有API...");

    // 并行测试所有API
    await Promise.all([
      testHealth(),
      testMenus(),
      testDataSources(),
      testFormConfigs(),
      testTableList(),
      testMockUsers(),
      testMockProducts(),
      testMockOrders(),
    ]);

    ElMessage.success("所有API测试完成！");
  } catch (error) {
    ElMessage.error("批量测试过程中出现错误");
  } finally {
    allTestsLoading.value = false;
  }
};
</script>

<style scoped>
.api-test {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  color: #303133;
}

.result {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  max-height: 300px;
  overflow-y: auto;
}

.result-summary {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.result pre {
  margin: 10px 0 0 0;
  font-size: 11px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.4;
}

.el-card {
  margin-bottom: 20px;
}

.el-card .el-card__header {
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

/* 卡片悬停效果 */
.el-card[shadow="hover"]:hover {
  transform: translateY(-2px);
  transition: all 0.3s;
}

/* 按钮样式优化 */
.el-button {
  border-radius: 6px;
  font-weight: 500;
}

/* 标签样式 */
.el-tag {
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
