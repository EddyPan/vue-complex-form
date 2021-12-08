# vue-complex-form 复杂表单

该组件基于VUE和ElementUI设计开发，通过弹出Dialog对话框+标签页的形式，承载复杂表单的新建、编辑、克隆、详情展示等操作。本方案本质是将复杂表单拆分为多个子表单，通过分步填写、验证，提升页面交互体验，降低复杂表单开发门槛，提升开发效率。
包含MainForm组件和SubFormMixin混入两部分。

![演示](./assets/demo.gif "表单演示")

## 引用依赖
    npm install vue-complex-form

## MainForm 主表单

提供复杂表单主入口，通过Tabs标签页进行分组子表单，整合表单验证、表单步骤、表单提交等页面交互功能，开发者仅需关注业务逻辑代码编写。

### 引入主表单组件
```javascript
import { MainForm } from 'vue-complex-form'

components: { MainForm }
```

### 引入相关子表单组件
import SubFormComps from './pipeline-details/index'

### 编写html模板

```html
<main-form v-if="showMainForm"
           form-title="流水线"
           :form-type="formType"
           :data="pipelineData"
           @submit="handleSubmit"
           @closed="showMainForm = false" />
```

### 组装表单数据
```javascript
// data数据为原始复杂表单数据，通过该方法组转换成相应的数据格式
resolveDataToList(data) {
    return [
        {
            key: 'baseinfo',
            name: '基础信息',
            component: SubFormComps.BaseForm,
            data: {
                name: data.name,
                type: data.type
            },
            hidden: false,
            valid: true
        },
        {
            key: 'application',
            name: '选择应用',
            component: SubFormComps.AppForm,
            data: {
                application: data.application
            },
            hidden: false,
            valid: true
        },
        {
            key: 'build',
            name: '代码编译',
            component: SubFormComps.BuildForm,
            data: {
                build: data.build
            },
            // 可以自定义hidden方法，动态调整是否展示该子表单，linkChannel为表单数据监听通道
            hidden: linkChannel => (linkChannel.appType === 'container'),
            valid: true
        },
        {
            key: 'deploy',
            name: '部署信息',
            component: SubFormComps.DeployForm,
            data: {
                deployData: data.deployData
            },
            hidden: false,
            valid: true
        }
    ]
}
```

### 提交数据
```javascript
// 点击确认按钮，并且表单验证通过后会触发该方法
handleSubmit(formData) {
    console.log(formData)
    // 提交数据到后台服务

    
    // 这里需要开发人员提交完数据后主动关闭表单
    this.showMainForm = false
}
```

### 属性参数

| 参数           | 说明                                                                               | 类型    | 可选值                            | 默认值   |
| -------------- | ---------------------------------------------------------------------------------- | ------- | --------------------------------- | -------- |
| form-title     | 表单名称，配合下面的form-type，自动组合为对话框名                                  | string  | --                                | '表单'   |
| form-type      | 表单类型，当form-type为空时，显示对话框名即为表单名                                | string  | add<br/>edit<br/>clone<br/>detail | ''       |
| pre-btn-txt    | 上一步按钮文字，在非第一页展示                                                     | string  | --                                | '上一步' |
| next-btn-txt   | 下一步按钮文字，在非最后一页展示                                                   | string  | --                                | '下一步' |
| submit-btn-txt | 提交表单按钮文字，在可编辑模式下最后一页展示                                       | string  | --                                | '确定'   |
| calcel-btn-txt | 取消表单按钮文字，在可编辑模式下展示                                               | string  | --                                | '取消'   |
| close-btn-txt  | 关闭表单按钮文字，在不可编辑模式下展示                                             | string  | --                                | '关闭'   |
| append-to-body | Dialog 自身是否插入至 body 元素上。嵌套的 Dialog 必须指定该属性并赋值为 true       | boolean | --                                | false    |
| width          | Dialog 的宽度                                                                      | string  | --                                | '50%'    |
| data           | 复杂表单数据对象列表，每个对象代表一个子表单，具体对象字段定义，请查看表单数据对象 | array   | --                                | --       |

### 表单数据对象

| 参数      | 说明                                                                                                                                                    | 类型                | 默认值 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| key       | 表单key，相当于本表单ID，必须唯一                                                                                                                       | string              | --     | -- |
| name      | 表单名称，用于当前Tab页面名称，尽量控制在6个字以内                                                                                                      | string              | --     |
| component | 引入的子表单模块                                                                                                                                        | component instance  | --     |
| data      | 子表单数据，子表单内部会进行深度拷贝，不会对外层数据造成影响，详细信息参考SubFormMixin                                                                  | object              | --     |
| hidden    | 是否展示子表单，hidden为true时，该子表单不展示且数据不会被提交，如果表单是否隐藏受表单数据影响，可通过自定义方法实现动态调整，方法参数为linkChannel对象 | function \| boolean | false  |
| valid     | 表单验证是否通过，请初始化默认值                                                                                                                        | boolean             | --     |

### 事件

| 参数   | 说明                         | 回调参数                                    |
| ------ | ---------------------------- | ------------------------------------------- |
| submit | 提交表单且数据验证通过后触发 | formData:object，有效子表单组装后的表单数据 |
| closed | 表单对话框关闭后触发         | --                                          |

## SubForm 子表单
每个子表单需要开发人员按照实际需求开发，本方案将提供子表单mixin，开发人员只需关注业务逻辑编写。

### 引入子表单混入

```javascript
import { SubFormMixin } from '@/components/ComplexForm'

mixins: [SubFormMixin]
```

### 编写html模板

**注意：** 如果某个字段需要和其他子表单通信，请主动emit field-change事件，通过linkChannel进行数据交互

```html
<el-form
    ref="form"
    :model="formData"
    :disabled="formDisabled"
    :rules="formDisabled?{}:rules"
    label-width="80px"
    size="small"
    @validate="handleValidate">
    <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="流水线名称" />
    </el-form-item>
    <el-form-item label="类型" prop="type">
        <el-select v-model="formData.type"
                   placeholder="流水线类型" 
                   @change="$emit('field-change', 'pipelineType', formData.type)">
        <el-option
            v-for="item in pipelineType"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
    </el-form-item>
</el-form>
```

### 编写表单验证规则
```javascript
rules: {
    name: [{ required: true, message: '请输入流水线名称', trigger: 'blur' }]
}
```

### 表单数据通信，监听表单数据变化

```javascript
watch: {
    'linkChannel.appType': {
        handler(v) {
            console.log(v)
            // 根据数据变化调整业务逻辑
        }
    }
}
```

## SubFormMixin 子表单混入功能
子表单通用功能，主要负责数据拷贝、表单验证、linkChannel数据变化传递通道等功能，开发者仅需关注业务逻辑代码编写，无需过多关注混入所需参数，MainForm组件已封装相关参数的传递和逻辑处理。

### 注入参数

| 参数         | 说明     | 类型    | 可选值                   | 默认值 |
| ------------ | -------- | ------- | ------------------------ | ------ |
| formType     | 表单类型 | String  | add、edit、clone、detail | --     |
| formDisabled | 禁用表单 | boolean | --                       | --     |

### 属性参数

| 参数         | 说明                                                   | 类型   | 默认值 |
| ------------ | ------------------------------------------------------ | ------ | ------ |
| form-key     | 表单Key，相当于表单ID，同一组子表单中的formKey不可重复 | string | --     |
| data         | 表单数据                                               | object | {}     |
| link-channel | 表单字段变动监听通道                                   | object | {}     |

## 鸣谢
感谢[@why19](https://juejin.cn/user/1794018999272525)的无私奉献，本方案主要分灵感来自于why19的[vue+element大型表单解决方案](https://juejin.cn/post/6964330851173662757)
