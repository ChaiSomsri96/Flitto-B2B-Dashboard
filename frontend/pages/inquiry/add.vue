<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('inquiry.add') }}
    </div>
    <el-card v-loading="loading" class="form-container box-card">
      <el-row class="mb20">
        <label>{{ $t('inquiry.title') }}</label>
        <div v-if="parent_id > 0" class="reply-depth">
          <span v-for="index in (depth + 1)" :key="index" class="comment">[RE]</span>
        </div>
        <div class="title-container">
          <el-input
            v-model="form.title"
            :placeholder="$t('placeholder.inquiry_title')"
            clearable
          >
          </el-input>
          <custom-check-box
            v-if="$auth.user.user_type == 1 && parent_id == 0"
            :is-checked="type"
            :label="$t('inquiry.announce')"
            class="announce-checkbox"
            @checkChanged="announceCheckChange"
          />

          <custom-check-box
            :is-checked="notice_reply === 'Y'?true:false"
            :label="$t('inquiry.notice_reply')"
            class="announce-checkbox"
            @checkChanged="noticeReplyChange"
          />

          <custom-check-box
            :is-checked="notice_comment === 'Y'?true:false"
            :label="$t('inquiry.notice_comment')"
            class="announce-checkbox"
            @checkChanged="noticeCommentChange"
          />
        </div>
      </el-row>
      <el-row class="mb20">
        <label>{{ $t('inquiry.content') }}</label>
        <client-only>
          <editor v-model="form.content" use-custom-image-handler @image-added="handleImageAdded" />
        </client-only>
      </el-row>
      <el-row class="mb10">
        <label class="mr10">{{ $t('inquiry.attachment') }}</label>
        <el-upload
          ref="btnUpload"
          :action="uploadActionUrl"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChanges"
          multiple
          class="mb10 btnUpload"
          style="display: inline"
        >
          <el-button slot="trigger" size="small" type="primary">
            {{ $t('inquiry.addfile') }}
          </el-button>
        </el-upload>
      </el-row>
      <el-row class="mb30">
        <el-upload
          drag
          :action="uploadActionUrl"
          :auto-upload="false"
          multiple
          :on-change="handleFileChanges"
          :show-file-list="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            {{ $t('inquiry.drag_drop') }}
          </div>
        </el-upload>

        <ul v-for="(file, i) in fileList" :key="i" class="el-upload-list el-upload-list--text">
          <li tabindex="0" class="el-upload-list__item is-ready">
            <a class="el-upload-list__item-name">
              <i class="el-icon-document"></i>{{ file.name }}
            </a>
            <label class="el-upload-list__item-status-label">
              <i class="el-icon-close" @click="delFile(i)"></i><i class="el-icon-close-tip">press delete to remove</i>
            </label>
          </li>
        </ul>
      </el-row>
      <el-row class="mb20 btn-actions">
        <el-button type="primary" class="btn-save" :disabled="loading" @click="onSubmit">
          {{ $t('common.save') }}
        </el-button>
        <el-button type="primary" class="btn-cancel" @click="handleCancel">
          {{ $t('common.cancel') }}
        </el-button>
      </el-row>
    </el-card>
  </div>
</template>

<script>
export default {
  middleware: ['auth', 'stats'],
  name: 'AddInquiry',
  layout: 'default',
  data () {
    return {
      loading: false,
      editorOptions: {
        hideModeSwitch: true
      },
      uploadActionUrl: 'http://b2b.ku-min.com:3001',
      fileList: [],
      form: {
        title: '',
        content: ''
      },
      type: false,
      parent_id: 0,
      depth: -1,
      notice_reply: 'Y',
      notice_comment: 'Y',
      customToolbar: [
        [{ header: [false, 1, 2, 3, 4, 5, 6] }],
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        [
          { align: '' },
          { align: 'center' },
          { align: 'right' },
          { align: 'justify' }
        ],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' },
          { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
        [{
          color: []
        }, {
          background: []
        }],
        ['link'], ['clean'] // remove formatting button
      ]
    }
  },
  created () {
    if (this.$route.query.parent_id) {
      this.parent_id = this.$route.query.parent_id
    }
    if (this.$route.query.depth > -1) {
      this.depth = this.$route.query.depth
    }
    if (this.$auth.user.user_type === 1 && this.parent_id === 0) {
      this.type = true
    }
    console.log(this.depth)
  },
  methods: {
    handleImageAdded (file, Editor, cursorLocation, resetUploader) {
      this.loading = true
      const formData = new FormData()
      formData.append('file', file)
      this.$axios.post('/inquiry/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then((resp) => {
          this.loading = false
          const { errorCode, url } = resp.data
          if (errorCode === 0) {
            Editor.insertEmbed(cursorLocation, 'image', url)
            resetUploader()
          }
        })
        .catch((err) => {
          this.loading = false
          console.log(err)
        })
    },
    handleCancel () {
      this.$router.push('/inquiry')
    },
    handleFileChanges (file, fileList) {
      this.fileList.push(file)
    },
    calcFileSize (byteSize) {
      const sizes = ['b', 'kb', 'mb', 'gb', 'tb']
      if (byteSize === 0) {
        return '0b'
      }
      const i = parseInt(Math.floor(Math.log(byteSize) / Math.log(1024)))
      return Math.round(byteSize / Math.pow(1024, i), 2) + ' ' + sizes[i]
    },
    delFile (index) {
      this.fileList.splice(index, 1)
    },
    onEditorChange () {
      this.form.content = this.$refs.inquiryContent.invoke('getHtml')
    },
    announceCheckChange (value) {
      this.type = value
    },
    noticeReplyChange (value) {
      if (value) { this.notice_reply = 'Y' } else { this.notice_reply = 'N' }
    },
    noticeCommentChange (value) {
      if (value) { this.notice_comment = 'Y' } else { this.notice_comment = 'N' }
    },
    onSubmit () {
      if (this.form.title.trim() === '' || this.form.content.trim() === '') {
        this.$message.error(this.$t('inquiry.title_content_required'))
      } else {
        this.$confirm(this.$t('inquiry.save_confirm'), this.$t('common.warning'), {
          confirmButtonText: this.$t('common.yes'),
          cancelButtonText: this.$t('common.no'),
          type: 'warning'
        }).then(() => {
          this.loading = true
          const formData = new FormData()
          let titlePrefix = ''
          for (let i = 0; i <= this.depth; i++) {
            titlePrefix += '[RE]'
          }
          if (this.depth >= 0) {
            formData.append('title', titlePrefix + this.form.title)
          } else {
            formData.append('title', this.form.title)
          }
          formData.append('content', this.form.content)
          if (this.$auth.user.user_type === 1 && this.type) {
            formData.append('type', 2)
          }
          if (this.parent_id) {
            formData.append('parent_id', this.parent_id)
          }
          formData.append('notice_reply', this.notice_reply)
          formData.append('notice_comment', this.notice_comment)
          if (this.fileList.length > 0) {
            for (let i = 0; i < this.fileList.length; i++) {
              formData.append('files', this.fileList[i].raw)
            }
          }
          this.$axios.post('/inquiry/register-inquiry', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then((resp) => {
            this.loading = false
            const { errorCode, id } = resp.data
            if (errorCode === 0) {
              this.$notify({
                title: this.$t('common.success'),
                message: this.$t('inquiry.save_success'),
                type: 'success'
              })
              this.$router.push('/inquiry/detail/' + id)
            } else {
              this.$notify({
                title: this.$t('common.fail'),
                message: this.$t('inquiry.save_fail'),
                type: 'error'
              })
            }
          })
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.box-card {
  padding: 10px;
  label {
    display: inline-block;
    margin-bottom: 10px;
    font-size: 16px;
  }
  .reply-depth {
    display: inline-flex;
    padding: 2px;
    background: $gray60;
    color: white;
    border-radius: 5px;
  }
  .title-container {
    display: flex;
    align-items: center;
    .el-input {
      width: 60%;
      min-width: 150px;
      margin-right: 15px;
    }
    .announce-checkbox {
      height: $inputNormalHeight;
      padding: 5px;
      margin-bottom: 0px;
    }
  }
}
.file-list-table, th {
  border: 1px solid $gray50;
  border-collapse: collapse;
}
.file-list-table {
  width: 100%;
  tbody {
    min-height: 50px;
    padding: 5px;
    font-size: 14px;
  }
  th {
    background-color: $gray20;
  }
  td.file-name {
    padding-left: 10px;
    .el-icon-delete {
      margin-left: 5px;
      margin-top: 1px;
      padding: 3px;
      border: 1px solid $gray50;
      border-radius: 2px;
      font-size: 16px;
      cursor: pointer;
    }
  }
  td.file-size {
    text-align: center;
  }
}
.btn-actions {
  text-align: center;
}
</style>
