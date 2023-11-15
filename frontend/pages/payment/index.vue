<template>
  <div class="edit-container">
    <div class="page-title">
      {{ $t('caption.payment_info') }}
    </div>
    <el-card class="box-card">
      <el-form
        ref="paymentForm"
        name="paymentForm"
        :model="form"
        :rules="rules"
        label-width="160px"
        label-position="left"
        :action="actionUrl"
        method="post"
      >
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('caption.order_id')">
              <el-input v-model="form.ref" name="ref" readonly></el-input>
            </el-form-item>
            <el-form-item :label="$t('caption.currency')">
              <el-input v-model="form.cur" name="cur" readonly></el-input>
            </el-form-item>
            <el-form-item :label="$t('caption.amount')">
              <el-input v-model="form.amt" name="amt" readonly></el-input>
            </el-form-item>
            <el-form-item :label="$t('caption.paymethod')">
              <el-select v-model="form.paymethod">
                <el-option v-for="item in paymethods" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('caption.buyer_name')">
              <el-input v-model="form.buyer" name="buyer"></el-input>
            </el-form-item>
            <el-form-item :label="$t('caption.buyer_email')">
              <el-input v-model="form.email" name="email"></el-input>
            </el-form-item>

            <div class="notice">
              {{ $t('caption.payment_notice1') }}<br />
              {{ $t('caption.payment_notice2') }}
            </div>

            <input v-model="form.ver" type="hidden" name="ver" />
            <input v-model="form.mid" type="hidden" name="mid" />
            <input v-model="form.txntype" type="hidden" name="txntype" />
            <input v-model="form.lang" type="hidden" name="lang" />
            <input v-model="form.param1" type="hidden" name="param1" />
            <input v-model="form.returnurl" type="hidden" name="returnurl" />
            <input v-model="form.statusurl" type="hidden" name="statusurl" />
            <input v-model="form.item_0_product" type="hidden" name="item_0_product" />
            <input v-model="form.item_0_quantity" type="hidden" name="item_0_quantity" />
            <input v-model="form.item_0_unitPrice" type="hidden" name="item_0_unitPrice" />
            <input v-model="form.shipTo_city" type="hidden" name="shipTo_city" />
            <input v-model="form.shipTo_country" type="hidden" name="shipTo_country" />
            <input v-model="form.shipTo_firstName" type="hidden" name="shipTo_firstName" />
            <input v-model="form.shipTo_lastName" type="hidden" name="shipTo_lastName" />
            <input v-model="form.shipTo_phoneNumber" type="hidden" name="shipTo_phoneNumber" />
            <input v-model="form.shipTo_postalCode" type="hidden" name="shipTo_postalCode" />
            <input v-model="form.shipTo_state" type="hidden" name="shipTo_state" />
            <input v-model="form.shipTo_street1" type="hidden" name="shipTo_street1" />
            <input v-model="form.displaytype" type="hidden" name="displaytype" />
            <input v-model="form.paymethod" type="hidden" name="paymethod" />
            <input v-model="fgkey" type="hidden" name="fgkey" />

            <el-form-item label-width="0px">
              <el-button
                type="primary"
                class="btn-save"
                @click="payment()"
              >
                <span>{{ $t('caption.payment') }}</span>
                <i class="el-icon-right"></i>
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { sha256 } from 'js-sha256'

export default {
  layout: 'detail',
  data () {
    return {
      // lang: system lang, fgkey: sha256 hashing
      form: {
        ver: 230,
        mid: process.env.EXIMBAY_MID,
        txntype: 'PAYMENT',
        ref: '',
        cur: 'USD',
        amt: '',
        paymethod: 'P000',
        buyer: '',
        email: 'test@email.com',
        lang: 'EN', //
        returnurl: process.env.HTTP + '://' + process.env.API_HOST + '/payment/return',
        statusurl: process.env.HTTP + '://' + process.env.API_HOST + ':' + process.env.API_PORT + '/requester/payment',
        param1: '',
        item_0_product: 'Caption Translation',
        item_0_quantity: 1,
        item_0_unitPrice: '',

        shipTo_city: 'Seoul',
        shipTo_country: 'KR',
        shipTo_firstName: 'First Name',
        shipTo_lastName: 'Last Name',
        shipTo_phoneNumber: '8225120142',
        shipTo_postalCode: '06141',
        shipTo_state: 'Seoul',
        shipTo_street1: '9F, 211, Teheran-ro, Gangnam-gu',

        displaytype: 'P'
      },
      fgkey: '',
      currencyList: [
        { value: 'JPY', label: '¥' },
        { value: 'KRW', label: '₩' },
        { value: 'USD', label: '$' }
      ],
      paymethods: [
        { value: 'P000', label: 'CreditCard' }
        // { value: 'P101', label: 'VISA' }
      ],
      actionUrl: 'https://secureapi.test.eximbay.com/Gateway/BasicProcessor.krp',
      rules: {}
    }
  },
  created () {
    if (this.$route.query.amount) {
      this.form.amt = this.$route.query.amount
      this.form.item_0_unitPrice = this.$route.query.amount
    }
    if (this.$route.query.email) {
      this.form.email = this.$route.query.email
    }
    if (this.$route.query.captionId) {
      this.form.param1 = this.$route.query.captionId
    }
    if (this.$route.query.currency) {
      this.form.cur = this.$route.query.currency
    }

    if (this.$auth.user.system_lang === 'KO') { this.form.lang = 'KR' } else if (this.$auth.user.system_lang === 'EN') { this.form.lang = 'EN' } else if (this.$auth.user.system_lang === 'CN') { this.form.lang = 'CN' } else if (this.$auth.user.system_lang === 'JP') { this.form.lang = 'JP' }

    this.form.ref = 'order' + new Date().getTime()
    this.form.buyer = this.$auth.user.user_name
  },
  methods: {
    payment () {
      let sortingParams = ''
      const objArr = Object.keys(this.form).sort()
      for (let i = 0; i < objArr.length; i++) {
        if (i === objArr.length - 1) {
          sortingParams += objArr[i] + '=' + this.form[objArr[i]]
        } else {
          sortingParams += objArr[i] + '=' + this.form[objArr[i]] + '&'
        }
      }
      const secretKey = process.env.EXIMBAY_SECRET_KEY
      const linkBuf = secretKey + '?' + sortingParams
      this.fgkey = sha256(linkBuf)
      this.$nextTick(() => {
        const frm = document.paymentForm
        frm.submit()
      })
      // frm.target = 'payment'
      // frm.submit()
    }
  }
}
</script>

<style lang="scss" scoped>
.el-select {
  width: 100%;
}
.notice {
  font-size: 13px;
}
</style>
