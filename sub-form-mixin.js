/**
 * 主表单mixin
 */
import _ from 'lodash'
export default {
  inject: ['formType', 'formDisabled'],
  props: {
    formKey: {
      type: String
    },
    data: {
      type: Object,
      default: () => ({})
    },
    linkChannel: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      formData: {},
      ruleResults: {}
    }
  },
  computed: {
  },
  watch: {
    data: {
      handler(newValue) {
        this.formData = _.cloneDeep(newValue) || {}
      },
      immediate: true
    }
  },
  methods: {
    validForm() {
      let result = false
      this.$refs['form'].validate((valid) => { result = valid })
      return result
    },
    handleValidate(rule, isValid) {
      // 记录表单项结果，用于判断是否所有项都通过
      this.ruleResults[rule] = isValid
      if (!isValid) {
        // 只要本项失败，则通知主表单校验失败
        this.$emit('validate', this.formKey, false)
      } else {
        let result = true
        // 如果存在未通过的项，则本表单校验未通过
        for (const key in this.ruleResults) {
          if (!this.ruleResults[key]) {
            result = false
            break
          }
        }
        // 当不存在未通过的项时，通知主表单校验通过
        if (result) {
          this.$emit('validate', this.formKey, true)
        }
      }
    }
  }
}
