export default {
  data () {
    return {
      /** dialog visibility flags */
      orgDialog: false,
      transDialog: false,
      /** v-model variables */
      orglang: '',
      transLangCheckList: [],
      /** final selected value */
      selOrgLang: '',
      selTransLangs: [],
      /** radio & checkbox availability */
      availableOrgLangs: [],
      availableTransLangs: [],
      checkedCount: 0,
      langPairs: []
    }
  },
  computed: {
    transLangNames () { // 일본어, 영어
      let transLang = ''
      for (let i = 0; i < this.selTransLangs.length; i++) {
        // transLang += this.$t('common.' + this.selTransLangs[i]) + ', '
        transLang += this.selTransLangs[i] + ', '
      }
      return transLang.slice(0, -2)
    }
  },
  watch: {
    selOrgLang (newVal) {
      this.availableTransLangs = []
      if (newVal && this.langPairs.length > 0) {
        for (let i = 0; i < this.langPairs.length; i++) {
          if (newVal === this.langPairs[i].original_language.id) {
            this.availableTransLangs.push(this.langPairs[i].translate_language)
          }
        }
      }
    },
    langPairs (newVal) {
      this.availableTransLangs = []
      if (this.selOrgLang && newVal.length > 0) {
        for (let i = 0; i < this.langPairs.length; i++) {
          if (this.selOrgLang === this.langPairs[i].original_language.id) {
            this.availableTransLangs.push(this.langPairs[i].translate_language)
          }
        }
      }
    }
  },
  methods: {
    setAvailableTransLangs () {
      for (let i = 0; i < this.langPairs.length; i++) {
        if (this.selOrgLang === this.langPairs[i].original_language.id) {
          this.availableTransLangs.push(this.langPairs[i].translate_language)
        }
      }
    },
    openOrgDialog () {
      if (this.selOrgLang !== this.orglang) {
        this.orglang = this.selOrgLang
      }
    },
    openTransDialog () {
      if (this.selTransLangs.length === 0) {
        this.checkedCount = 0
        this.transLangCheckList = []
      }
    },
    closeOrgDialog () {
      if (!this.orglang) {
        this.$message({
          message: this.$t('validation.org_lang_required'),
          type: 'error'
        })
      } else {
        if (this.selOrgLang !== this.orglang) {
          /** Initialize */
          this.transLangCheckList = []
          this.selTransLangs = []
          this.availableTransLangs = []

          this.selOrgLang = this.orglang
          this.setAvailableTransLangs()
        }
        this.orgDialog = false
      }
    },
    closeTransDialog () {
      if (this.transLangCheckList.length === 0) {
        this.$message({
          message: this.$t('validation.trans_lang_required'),
          type: 'error'
        })
      } else {
        this.selTransLangs = this.transLangCheckList
        this.transDialog = false
      }
    },
    async getCompanyLangPairs (companyId = '') {
      try {
        const response = await this.$axios.post('/company/get-language-pairs', {
          company_id: companyId
        })
        const { errorCode, data } = response.data
        if (errorCode === 0) {
          this.langPairs = data
          for (let i = 0; i < data.length; i++) {
            const matched = this.availableOrgLangs.filter(lang => lang.id === data[i].original_language.id)
            if (matched.length === 0) {
              this.availableOrgLangs.push(data[i].original_language)
            }
          }
        }
      } catch (err) {
        this.$notify({
          title: this.$t('common.fail'),
          message: this.$t('common.network_err'),
          type: 'error'
        })
      }
    },
    getOrgAvailability (langId) {
      const matchedLang = this.availableOrgLangs.filter(lang => lang.id === langId)
      if (matchedLang.length > 0) {
        return true
      } else {
        return false
      }
    },
    getTransAvailability (langId) {
      const matchedLang = this.availableTransLangs.filter(lang => lang.id === langId)
      if (matchedLang.length > 0) {
        return true
      } else {
        return false
      }
    },
    formatSelectTransLang () {
      this.transLangCheckList = []
      this.checkedCount = 0
      this.selTransLangs = []
    },
    handleCheckedLang (value) {
      this.checkedCount = value.length
    },
    getTransLangId (langName) {
      const translatedLangs = []
      for (let i = 0; i < this.workLangs.length; i++) {
        translatedLangs.push({
          lang: this.$t('common.' + this.workLangs[i].name),
          id: this.workLangs[i].id
        })
      }
      const matchedArray = translatedLangs.filter(lang => lang.lang === langName)
      // const matchedArray = this.translatedLangs.indexOf(langName)
      return matchedArray[0].id
    }
  }
}
