<!-- 主表单入口，在这里循环组装子表单 -->
<template>
  <el-dialog
    :title="prefixTitle"
    :visible.sync="visible"
    :close-on-click-modal="false"
    :width="width"
    :append-to-body="appendToBody"
    @closed="$emit('closed')">
    <el-tabs v-model="activeForm" :before-leave="handleLeaveTab">
      <template v-for="form in filtedFormDataList">
        <el-tab-pane :key="form.key" :name="`form-${form.key}`">
          <span slot="label">{{ form.name }} <i v-if="!form.valid" class="el-icon-warning" style="color: #F56C6C" /></span>
          <component :is="form.component"
                     :ref="form.key"
                     :form-key="form.key"
                     :data="form.data"
                     :link-channel="linkChannel"
                     @validate="handleValidate"
                     @field-change="handleFieldChange" />
        </el-tab-pane>
      </template>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button v-if="showPreviousBtn" type="primary" plain size="small" @click="previous">{{preBtnTxt}}</el-button>
      <el-button v-if="showNextBtn" type="primary" size="small" @click="next">{{nextBtnTxt}}</el-button>
      <el-button v-if="!formDisabled && showSubmitBtn" type="primary" size="small" @click="handleSave">{{submitBtnTxt}}</el-button>
      <el-button v-if="!formDisabled" size="small" @click="visible = false">{{cancelBtnTxt}}</el-button>
      <el-button v-if="formDisabled" size="small" @click="visible = false">{{closeBtnTxt}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'MainForm',
  props: {
    formTitle: {
      type: String,
      default: '表单'
    },
    formType: {
      type: String,
      default: ''
    },
    preBtnTxt: {
      type: String,
      default: '上一步'
    },
    nextBtnTxt: {
      type: String,
      default: '下一步'
    },
    submitBtnTxt: {
      type: String,
      default: '确定'
    },
    cancelBtnTxt: {
      type: String,
      default: '取消'
    },
    closeBtnTxt: {
      type: String,
      default: '关闭'
    },
    appendToBody: {
      type: Boolean,
      default: false
    },
    width: {
      type: String,
      default: '50%'
    },
    data: {
      type: Array,
      default: () => ([])
    },
    submit: Function
  },
  data() {
    return {
      visible: true,
      activeForm: '',
      formDataList: [],
      linkChannel: {}
    }
  },
  computed: {
    prefixTitle() {
      switch (this.formType) {
        case 'add':
          return `创建${this.formTitle}`
        case 'edit':
          return `编辑${this.formTitle}`
        case 'clone':
          return `克隆${this.formTitle}`
        case 'detail':
          return `${this.formTitle}详情`
        default:
          return this.formTitle
      }
    },
    formDisabled() {
      return this.formType === 'detail'
    },
    // 页面tab步骤按钮交互逻辑
    showPreviousBtn() {
      const key = this.activeForm.split('-')[1]
      return _.findIndex(this.filtedFormDataList, ['key', key]) > 0
    },
    showNextBtn() {
      const key = this.activeForm.split('-')[1]
      return _.findIndex(this.filtedFormDataList, ['key', key]) < this.filtedFormDataList.length - 1
    },
    showSubmitBtn() {
      const key = this.activeForm.split('-')[1]
      return _.findIndex(this.filtedFormDataList, ['key', key]) === this.filtedFormDataList.length - 1
    },
    // 过滤掉hidden为true的数据
    filtedFormDataList() {
      const result = []
      this.formDataList.forEach(item => {
        if (!this.isHidden(item.hidden)) result.push(item)
      })
      return result
    }
  },
  watch: {
    // 当前选中最后一页tab移除后，选中前移一页
    'filtedFormDataList.length': {
      handler() {
        const key = this.activeForm.split('-')[1]
        if (_.findIndex(this.filtedFormDataList, ['key', key]) < 0) {
          this.activeForm = `form-${_.last(this.filtedFormDataList).key}`
        }
      }
    }
  },
  provide() {
    return {
      // formType传递到所有子表单
      formType: this.formType,
      formDisabled: this.formDisabled
    }
  },
  created() {
    this.formDataList = _.cloneDeep(this.data)
    this.activeForm = `form-${this.formDataList[0].key}`
  },
  methods: {
    isHidden(hidden) {
      switch (typeof hidden) {
        case 'function':
          return hidden(this.linkChannel)
        case 'boolean':
          return hidden
        default:
          return false
      }
    },
    previous() {
      const key = this.activeForm.split('-')[1]
      this.activeForm = `form-${this.filtedFormDataList[_.findIndex(this.filtedFormDataList, ['key', key]) - 1].key}`
    },
    next() {
      const key = this.activeForm.split('-')[1]
      this.activeForm = `form-${this.filtedFormDataList[_.findIndex(this.filtedFormDataList, ['key', key]) + 1].key}`
    },
    handleLeaveTab(activeName, oldActiveName) {
      const fromKey = oldActiveName.split('-')[1]
      const toKey = activeName.split('-')[1]
      const from = _.findIndex(this.filtedFormDataList, ['key', fromKey])
      const to = _.findIndex(this.filtedFormDataList, ['key', toKey])
      // 向后进行翻页，前面的表单必须通过检测，否则停在第一个未通过检测的tab页面
      if (to > from) {
        for (let i = from; i < to; i++) {
          const key = this.filtedFormDataList[i].key
          if (!this.$refs[key][0].validForm()) {
            this.activeForm = `form-${key}`
            return false
          }
        }
      }
    },
    // 验证结果处理，验证失败时，当前tab将出现红色感叹号，代表表单验证失败
    handleValidate(formKey, isValid) {
      this.$set(_.find(this.formDataList, ['key', formKey]), 'valid', isValid)
    },

    // 将发生变换的数据装在到linkChannel中
    handleFieldChange(key, value) {
      this.$set(this.linkChannel, key, value)
    },
    // 验证所有子表单，并组装为formData
    buildFormData() {
      return new Promise((resolve, reject) => {
        const validResults = []
        this.formDataList.forEach(form => {
          if (!this.isHidden(form.hidden)) validResults.push(this.$refs[form.key][0].validForm())
        })

        // 如果所有校验通过
        if (validResults.every((r) => r)) {
          const formData = {}

          this.formDataList.forEach(form => {
            if (!this.isHidden(form.hidden)) {
              // 获取子表单数据
              const partFormData = this.$refs[form.key][0].formData
              Object.assign(formData, partFormData)
            }
          })

          resolve(formData)
        } else {
          reject('校验未通过')
        }
      })
    },
    handleSave() {
      this.buildFormData().then(formData => {
        this.$emit('submit', formData)
      }).catch(err => {
        this.$message.warning(err)
      })
    }
  }
}
</script>

<style scoped lang="scss">

</style>
