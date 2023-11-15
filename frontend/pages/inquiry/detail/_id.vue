<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('inquiry.detail') }}
    </div>
    <el-card class="box-card">
      <el-row type="flex" justify="end">
        <el-button size="medium" type="primary" @click="goToList">
          {{ $t('common.list') }}
        </el-button>
      </el-row>
      <el-row type="flex" justify="space-between" class="inquiry-info">
        <div class="title-date">
          <el-tag v-if="inquiry.type == 2" type="danger" effect="dark">
            {{ $t('inquiry.announce') }}
          </el-tag>
          <span class="title">{{ inquiry.title }}</span>
          <div class="date mt10">
            <span class="reg-date">{{ inquiry.reg_date | date }}</span> {{ formatDate(inquiry.update_date) }}
          </div>
        </div>
        <div class="creator-info">
          <img :src="inquiry.creator_avatar ? inquiry.creator_avatar : defaultAvatar" class="profile-avatar mr5" />{{ inquiry.creator_name }}({{ inquiry.creator_user_id }})
        </div>
      </el-row>
      <el-row class="inquiry-content mb10">
        <!--eslint-disable-next-line vue/no-v-html-->
        <div class="content" v-html="inquiry.content">
        </div>
      </el-row>
      <el-row type="flex" justify="end">
        <el-button v-if="inquiry.type != 2" size="medium" type="primary" @click="goToComment">
          {{ $t('common.comment') }}
        </el-button>
        <el-button v-if="$auth.user.user_type == 1 || $auth.user.id == inquiry.creator_id" size="medium" type="primary" @click="goToEdit">
          {{ $t('common.update') }}
        </el-button>
        <el-button v-if="$auth.user.user_type == 1 || $auth.user.id == inquiry.creator_id" size="medium" type="primary" @click="delInquiry">
          {{ $t('common.delete') }}
        </el-button>
      </el-row>
      <el-row v-if="inquiry.attaches.length > 0" class="attachment">
        <div class="file-count mb10">
          {{ $t('inquiry.attachment') }}({{ inquiry.attaches.length }})
        </div>
        <div class="file-list">
          <a v-for="(attach, i) in inquiry.attaches" :key="i" class="attach-info mr5" :href="attach.file_link" download>
            <i class="el-icon-document mr5"></i>{{ attach.file_name }}({{ calcFileSize(attach.file_size) }})
          </a>
        </div>
      </el-row>
      <el-row v-if="inquiry.type != 2" v-loading="loading" class="comments">
        <el-col class="comments-count mb10">
          {{ $t('inquiry.comment') }}({{ inquiry.comments.length }})
        </el-col>
        <el-col v-if="inquiry.comments.length == 0" class="comment-item mb20">
          {{ $t('inquiry.no_comment') }}
        </el-col>
        <el-col v-else>
          <div v-for="(item, i) in inquiry.comments" :key="i" class="comment-item mb20">
            <template v-if="!item.isModify">
              <div>
                <div class="creator-info">
                  <img :src="item.avatar ? item.avatar : defaultAvatar" class="profile-avatar mr10" />
                  <span>{{ item.user_name }}({{ item.user_id }})</span><br />
                </div>
                <div class="content mt10">
                  <div v-for="(line, i) in item.comment.split('\n')" :key="i">
                    {{ line }}<br />
                  </div>
                </div>
              </div>
              <div class="timestamp">
                <div class="comment-reg-date mb5">
                  {{ item.reg_date | date }}
                </div>
                <div class="comment-update-date mb5">
                  {{ formatDate(item.update_date) }}
                </div>
                <div class="actions">
                  <el-button v-if="item.can_modify == 'Y'" type="primary" size="small" @click="onModify(i)">
                    {{ $t('common.update') }}
                  </el-button>
                  <el-button v-if="$auth.user.user_type == 1" type="primary" size="small" @click="delComment(i, item.comment_id)">
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <template v-else>
              <el-input v-model="item.comment" type="textarea" :rows="3" class="mr5"></el-input>
              <el-button type="primary" size="small" @click="modifyComment(i, item)">
                {{ $t('common.save') }}
              </el-button>
            </template>
          </div>
        </el-col>
        <el-col class="mb10">
          <el-input v-model="comment" type="textarea" :rows="4"></el-input>
        </el-col>
        <el-col>
          <el-row type="flex" justify="end">
            <el-button size="medium" type="primary" @click="regComment">
              {{ $t('inquiry.register') }}
            </el-button>
          </el-row>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
export default {
  middleware: ['auth', 'stats'],
  name: 'InquiryDetail',
  async asyncData ({ $axios, params, error }) {
    const inquiryId = params.id
    try {
      const response = await $axios.post('/inquiry/detail', { id: inquiryId })
      const { errorCode, data } = response.data

      if (errorCode === 0) {
        return {
          inquiry: data
        }
      } else {
        error({ statusCode: 500, message: 'Post not found' })
      }
    } catch (err) {
      error({ statusCode: 404, message: 'Post not found' })
    }
  },
  data () {
    return {
      loading: false,
      defaultAvatar: '/imgs/default-avatar.png',
      comment: ''
    }
  },
  methods: {
    goToList () {
      this.$router.push('/inquiry')
    },
    goToComment () {
      this.$router.push({ path: '/inquiry/add', query: { parent_id: this.inquiry.id, depth: this.inquiry.depth } })
    },
    goToEdit () {
      this.$router.push('/inquiry/edit/' + this.inquiry.id)
    },
    delInquiry () {
      this.$confirm(this.$t('inquiry.del_inquiry'), this.$t('validation.delete'), {
        confirmButtonText: this.$t('common.ok'),
        cancelButtonText: this.$t('common.no')
      }).then(() => {
        this.$axios.post('/inquiry/delete-inquiry', {
          inquiry_ids: [this.inquiry.id]
        }).then((resp) => {
          const { errorCode } = resp.data
          if (errorCode === 0) {
            this.$message.success(this.$t('inquiry.del_success'))
          }
          this.$router.push('/inquiry')
        })
      })
    },
    calcFileSize (byteSize) {
      const sizes = ['b', 'kb', 'mb', 'gb', 'tb']
      if (byteSize === 0) {
        return '0b'
      }
      const i = parseInt(Math.floor(Math.log(byteSize) / Math.log(1024)))
      return Math.round(byteSize / Math.pow(1024, i), 2) + ' ' + sizes[i]
    },
    regComment () {
      if (this.comment === '') {
        this.$message.error(this.$t('inquiry.comment_required'))
      } else {
        console.log(this.comment)

        this.$axios.post('/inquiry/register-comment', {
          comment: this.comment,
          inquiry_id: this.inquiry.id
        }).then((resp) => {
          const { errorCode, data } = resp.data
          if (errorCode === 0) {
            this.inquiry.comments.push({
              user_id: this.$auth.user.userid,
              user_name: this.$auth.user.user_name,
              reg_date: data.reg_date,
              comment_id: data.id,
              avatar: this.$auth.user.avatar,
              comment: this.comment,
              can_modify: 'Y'
            })
            this.comment = ''
          }
        })
      }
    },
    onModify (index) {
      const newObj = this.inquiry.comments[index]
      newObj.isModify = true
      this.inquiry.comments.splice(index, 1, newObj)
    },
    modifyComment (index, item) {
      if (!item.comment) {
        this.$message.error(this.$t('inquiry.modified_comment_required'))
      } else {
        this.loading = true
        this.$axios.post('/inquiry/register-comment', {
          id: item.comment_id,
          comment: item.comment,
          inquiry_id: this.inquiry.id
        }).then((resp) => {
          const { errorCode, data } = resp.data
          if (errorCode === 0) {
            const newObj = {
              id: item.comment_id,
              comment: item.comment,
              user_id: this.$auth.user.userid,
              user_name: this.$auth.user.user_name,
              reg_date: data.reg_date,
              update_date: data.update_date,
              can_modify: 'Y',
              avatar: this.$auth.user.avatar
            }
            this.inquiry.comments.splice(index, 1, newObj)
          }
          this.loading = false
        })
      }
    },
    delComment (index, commentId) {
      this.$confirm(this.$t('inquiry.del_comment'), this.$t('validation.delete'), {
        confirmButtonText: this.$t('common.ok'),
        cancelButtonText: this.$t('common.no')
      }).then(() => {
        this.loading = true
        this.$axios.post('/inquiry/delete-comment', {
          id: commentId,
          inquiry_id: this.inquiry.id
        }).then((resp) => {
          const { errorCode } = resp.data
          if (errorCode === 0) {
            this.$message.success(this.$t('inquiry.del_success'))
            this.inquiry.comments.splice(index, 1)
          }
          this.loading = false
        })
      })
    },
    formatDate (timestamp) {
      let formatedDate = ''
      if (timestamp) {
        formatedDate = this.$options.filters.date(timestamp)
        return '(' + formatedDate + ' ' + this.$t('common.update') + ')'
      } else {
        return ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
.pre-formatted {
  white-space: pre;
}
.box-card {
  padding: 10px;
  .inquiry-info, .inquiry-content, .attachment, .comments {
    border: 1px solid $gray30;
    border-radius: 5px;
    padding: 20px;
  }
  .el-row {
    margin-bottom: 20px;
  }
}
.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.inquiry-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title-date {
    .el-tag {
      font-size: 14px;
    }
    .title {
      font-size: 20px;
    }
    .date {
      font-size: 14px;
      .reg-date {
        font-weight: bold;
      }
    }
  }

  .creator-info {
    display: inline-flex;
    align-items: center;
  }
}
.attachment {
  .file-count {
    font-size: 14px;
    font-weight: bold;
  }
  .file-list {
    display: flex;
    flex-wrap: wrap;
    .attach-info {
      padding: 2px;
      border: 1px solid $gray30;
      border-radius: 3px;
      font-size: 14px;
    }
  }
}
.comments {
  .comments-count {
    font-size: 14px;
    font-weight: bold;
  }
  .comment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid $gray30;
    border-radius: 5px;
    padding: 10px;
    font-size: 14px;
    .creator-info {
      display: inline-flex;
      align-items: center;
      img {
        width: 40px;
        height: 40px;
      }
    }
    .timestamp {
      min-width: 160px;
      text-align: right;
      .comment-reg-date{
        font-weight: bold;
      }
      .comment-update-date {
        font-size: 12px;
      }
    }
  }
}
</style>
