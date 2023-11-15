<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('inquiry.edit') }}
    </div>
    <el-card v-loading="loading" class="box-card">
      <el-row class="mb20">
        <label>{{ $t('inquiry.title') }}</label>
        <div class="title-container">
          <el-input
            v-model="inquiry.title"
            :placeholder="$t('placeholder.inquiry_title')"
            clearable
          >
          </el-input>

          <custom-check-box
            v-if="$auth.user.user_type == 1"
            :is-checked="inquiry.type == 2 ? true : false"
            :label="$t('inquiry.announce')"
            class="announce-checkbox"
            @checkChanged="announceCheckChange"
          />

          <custom-check-box
            :is-checked="inquiry.notice_reply === 'Y'?true:false"
            :label="$t('inquiry.notice_reply')"
            class="announce-checkbox"
            @checkChanged="noticeReplyChange"
          />

          <custom-check-box
            :is-checked="inquiry.notice_comment === 'Y'?true:false"
            :label="$t('inquiry.notice_comment')"
            class="announce-checkbox"
            @checkChanged="noticeCommentChange"
          />
        </div>
      </el-row>
      <el-row class="mb20">
        <label>{{ $t('inquiry.content') }}</label>
        <client-only>
          <editor v-model="inquiry.content" use-custom-image-handler @image-added="handleImageAdded" />
        </client-only>
      </el-row>
      <el-row class="mb30">
        <el-upload
          ref="btnUpload"
          :action="uploadActionUrl"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChanges"
          multiple
          class="mb10"
        >
          <el-button slot="trigger" size="small" type="primary">
            {{ $t('inquiry.addfile') }}
          </el-button>
        </el-upload>
        <table class="file-list-table">
          <thead>
            <tr>
              <th>{{ $t('common.filename') }}</th>
              <th>{{ $t('common.filesize') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(attach, i) in inquiry.attaches" :key="attach.id">
              <td colspan="1" class="file-name">
                <span>{{ attach.file_name }}</span>
                <i class="el-icon-delete" @click="delAttachedFile(i, attach.id)"></i>
              </td>
              <td colspan="1" class="file-size">
                {{ calcFileSize(attach.file_size) }}
              </td>
            </tr>
            <tr v-for="(file, i) in fileList" :key="i">
              <td colspan="1" class="file-name">
                <span>{{ file.name }}</span>
                <i class="el-icon-delete" @click="delUploadFile(i)"></i>
              </td>
              <td colspan="1" class="file-size">
                {{ calcFileSize(file.size) }}
              </td>
            </tr>

            <tr>
              <td colspan="2" class="drag-upload">
                <el-upload
                  drag
                  :action="uploadActionUrl"
                  :auto-upload="false"
                  multiple
                  :on-change="handleFileChanges"
                  :show-file-list="false"
                >
                  <i v-if="!inquiry.hasOwnProperty('attaches') || (fileList.length + inquiry.attaches.length < 1)" class="el-icon-upload"></i>
                  <div v-if="!inquiry.hasOwnProperty('attaches') || (fileList.length + inquiry.attaches.length < 1)" class="el-upload__text">
                    {{ $t('inquiry.drag_drop') }}
                  </div>
                </el-upload>
              </td>
            </tr>
          </tbody>
        </table>
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
  name: 'EditInquiry',
  layout: 'default',
  async fetch () {
    this.loading = true
    const inquiryId = this.$route.params.id
    try {
      const response = await this.$axios.post('/inquiry/detail', { id: inquiryId })
      const { errorCode, data } = response.data
      if (errorCode === 0) {
        this.inquiry = data
      } else {
        this.$nuxt.error({ statusCode: 500, message: 'Post not found' })
      }
    } catch (err) {
      this.$nuxt.error({ statusCode: 404, message: 'Post not found' })
    } finally {
      this.loading = false
    }
  },
  data () {
    return {
      loading: false,
      editorOptions: {
        hideModeSwitch: true
      },
      uploadActionUrl: 'http://b2b.ku-min.com:3001',
      fileList: [],
      inquiry: {},
      type: true,
      deletedFiles: [],
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
  watch: {
    inquiry: {
      handler (newVal) {
        if (newVal.content) {
          this.onEditorLoad()
        }
      },
      deep: true
    }
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
    delAttachedFile (index, attachId) {
      this.deletedFiles.push(attachId)
      this.inquiry.attaches.splice(index, 1)
    },
    delUploadFile (index) {
      this.fileList.splice(index, 1)
    },
    onEditorChange () {
      this.inquiry.content = this.$refs.inquiryContent.invoke('getHtml')
    },
    onEditorLoad () {
      const initialContent = this.inquiry.content
      console.log(initialContent)
      // this.$refs.inquiryContent.invoke('setHtml', initialContent)
    },
    announceCheckChange (value) {
      if (value) {
        this.inquiry.type = 2
      } else {
        this.inquiry.type = 1
      }
    },
    noticeReplyChange (value) {
      if (value) { this.inquiry.notice_reply = 'Y' } else { this.inquiry.notice_reply = 'N' }
    },
    noticeCommentChange (value) {
      if (value) { this.inquiry.notice_comment = 'Y' } else { this.inquiry.notice_comment = 'N' }
    },
    onSubmit () {
      if (this.inquiry.title === '' || this.inquiry.content === '') {
        this.$message.error(this.$t('inquiry.title_content_required'))
      } else {
        this.$confirm(this.$t('inquiry.modify_confirm'), this.$t('common.warning'), {
          confirmButtonText: this.$t('common.yes'),
          cancelButtonText: this.$t('common.no'),
          type: 'warning'
        }).then(() => {
          this.loading = true
          const formData = new FormData()
          formData.append('id', this.inquiry.id)
          formData.append('title', this.inquiry.title)
          formData.append('content', this.inquiry.content)
          formData.append('type', this.inquiry.type)
          formData.append('notice_reply', this.inquiry.notice_reply)
          formData.append('notice_comment', this.inquiry.notice_comment)
          if (this.fileList.length > 0) {
            for (let i = 0; i < this.fileList.length; i++) {
              formData.append('files', this.fileList[i].raw)
            }
          }
          if (this.deletedFiles.length > 0) {
            for (let i = 0; i < this.deletedFiles.length; i++) {
              formData.append('file_delete_ids[]', this.deletedFiles[i])
            }
          }
          this.$axios.post('/inquiry/register-inquiry', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then((resp) => {
            this.loading = false
            const { errorCode } = resp.data
            if (errorCode === 0) {
              this.$notify({
                title: this.$t('common.success'),
                message: this.$t('inquiry.modify_success'),
                type: 'success'
              })
              this.$router.push('/inquiry/detail/' + this.inquiry.id)
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
  .comment {
    display: inline-block;
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
