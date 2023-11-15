<template>
  <div class="container">
    <template v-if="companyLogo">
      <img :src="avatarUrl ? avatarUrl : defaultLogo" class="company-logo" />
    </template>
    <template v-else>
      <img :src="avatarUrl ? avatarUrl : defaultAvatar" class="profile-avatar" />
    </template>
    <el-upload
      ref="upload"
      class="avatar-uploader"
      :action="actionUrl"
      :show-file-list="false"
      :on-change="changeImage"
      :auto-upload="false"
      accept="image/*"
    >
      <el-button slot="trigger" type="primary" plain class="btn-change-avatar">
        {{ companyLogo ? $t('common.logo_change') : $t('common.image_change') }}
        <i class="el-icon-upload ml5"></i>
      </el-button>
      <div slot="tip" class="el-upload__tip">
        <!-- company logo -->
        <p v-if="companyLogo" v-html="$t('company.valid_logo_size')"></p>
        <!-- profile logo -->
        <span v-else>{{ $t('company.valid_profile_size') }}</span>
      </div>
    </el-upload>
  </div>
</template>

<script>
const defaultAvatar = '/imgs/default-avatar.png'
const defaultLogo = '/imgs/dashboard-logo.png' // flitto logo

export default {
  name: 'ImageUploadItem',
  props: {
    companyLogo: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      actionUrl: 'http://b2b.ku-min.com:3001',
      avatarUrl: this.imageUrl,
      defaultLogo,
      defaultAvatar
    }
  },
  watch: {
    imageUrl (newVal) {
      this.avatarUrl = newVal
    }
  },
  methods: {
    changeImage (file, fileList) {
      console.log(file.raw.type)
      const allowExts = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp']
      if (allowExts.includes(file.raw.type)) {
        this.avatarUrl = URL.createObjectURL(file.raw)
        this.$emit('avatarChanged', file.raw)
      } else {
        this.$message({
          message: this.$t('validation.invalid_avatar'),
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.container {
  padding-top: 36px;
  text-align: center;
  margin-bottom: 20px;
  .btn-change-avatar {
    margin-top: 10px;
    /* width: calc(#{$avatarSize}); */
    border-radius: 8px;
    background: white;
  }
  .profile-avatar {
    width: $avatarSize;
    height: $avatarSize;
    display: inline-block;
  }
  .company-logo {
    width: 150px;
    height: 50px;
    display: inline-block;
  }
  .el-upload__tip {
    margin: 10px;
  }
}
</style>
