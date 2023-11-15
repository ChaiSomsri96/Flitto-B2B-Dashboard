<template>
  <el-row>
    <label class="worker-type">{{ workerNames[workerType] }}</label>
    <el-select v-model="assignOption" @change="assignTypeChange">
      <el-option
        v-for="item in assignOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <template v-if="assignOption == 1">
      <label class="tag">{{ $t('common.tag') }}</label>
      <search-multi-select
        :options="tagOptions"
        :default-options="defaultTagOptions"
        class="search-multi-select"
        :placeholder="$t('common.all')"
        @optionChanged="tagOptionChanged"
      />
      <span v-if="assignNumbers > 0">
        {{ $t('company.worker_assign_num', { workerType: workerNames[workerType], num: assignNumbers }) }}
      </span>
    </template>
  </el-row>
</template>
<script>
import SearchMultiSelect from '@/components/common/SearchMultiSelect.vue'

export default {
  name: 'WorkerAssignItem',
  components: { SearchMultiSelect },
  props: {
    workerType: {
      type: String,
      default: 'tc'
    },
    defaultAssignOption: {
      type: Number,
      default: 1
    },
    tagOptions: {
      type: Array,
      default () {
        return []
      }
    },
    defaultTagOptions: {
      type: Array,
      default () {
        return []
      }
    },
    assignNumbers: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      assignOptions: [
        { value: 1, label: this.$t('company.push_notification') },
        { value: 2, label: this.$t('company.manual_assign') }
      ],
      assignOption: this.defaultAssignOption,
      workerNames: {
        tc: this.$t('user_type.tc'),
        translator: this.$t('user_type.translator'),
        reviewer: this.$t('user_type.reviewer')
      }
    }
  },
  watch: {
    defaultAssignOption (newVal) {
      this.assignOption = newVal
    }
  },
  methods: {
    assignTypeChange () {
      this.$emit('assignTypeChanged', {
        workerType: this.workerType,
        assignOption: this.assignOption
      })
    },
    tagOptionChanged (data) {
      this.$emit('tagOptionChanged', {
        workerType: this.workerType,
        selOptions: data
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.el-row {
  margin-bottom: 10px;
  .worker-type {
    display: inline-block;
    width: 80px;
    margin-right: 5px
  }
  .el-select {
    width: 150px;
    margin-right: 5px
  }
  .tag {
    width: 60px;
    margin-right: 5px
  }
  .search-multi-select {
    min-width: 220px;
    margin-right: 5px;
  }
}
</style>
