<template>
  <div class="app-container">
    <div class="page-title">
      {{ $t('caption.list') }}
    </div>
    <el-card class="box-card search-box">
      <div class="filter-container">
        <div class="period">
          <label>{{ $t('caption.duration') }}</label>
          <el-select v-model="search.date_type" class="date-range-option">
            <el-option
              v-for="item in dateTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
          <el-select v-model="period" class="period-options" @change="onPeriodChange">
            <el-option
              v-for="(item, i) in periods"
              :key="i"
              :label="item"
              :value="i"
            >
            </el-option>
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="2020-04-01"
            end-placeholder="2020-07-01"
            value-format="timestamp"
          >
          </el-date-picker>
        </div>
        <div class="work-finish-status">
          <label>{{ $t('caption.status') }}</label>
          <el-select v-model="search.finish_work_type" :placeholder="$t('common.select')">
            <el-option
              v-for="item in finishStatus"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="work-progress-status">
          <label>{{ $t('caption.prog_status') }}</label>
          <el-select v-model="search.status" multiple :placeholder="$t('common.select')">
            <el-option
              v-for="item in progressList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="original-language">
          <label>{{ $t('caption.orglang') }}</label>
          <el-select v-model="search.original_language">
            <el-option
              v-for="(item, i) in orglangs"
              :key="i"
              :label="$t('common.' + item.name)"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="translate-language">
          <label>{{ $t('caption.translang') }}</label>
          <el-select v-model="search.translate_language">
            <el-option
              v-for="(item, i) in translangs"
              :key="i"
              :label="$t('common.' + item.name)"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-container">
        <div class="amount">
          <input-filter-range
            :start-value="search.start_work_price"
            :end-value="search.end_work_price"
            :pre-option="search.price_type"
            :option-list="amountOptions"
            :label="$t('common.cost')"
            @minValChanged="minAmtChange"
            @maxValChanged="maxAmtChange"
            @selectChanged="priceTypeChange"
          />
        </div>
        <div class="select-company">
          <label>{{ $t('caption.choose_company') }}</label>
          <el-select v-model="search.companies" multiple filterable :placeholder="$t('common.select')" @change="onCompanyChange">
            <el-option
              v-for="item in companyList"
              :key="item.id"
              :label="item.company_name + '(' + item.user_id + ')'"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="select-requester">
          <label>{{ $t('caption.choose_requester') }}</label>
          <el-select v-model="search.requesters" multiple filterable :placeholder="$t('common.select')">
            <el-option
              v-for="item in requesterList"
              :key="item.id"
              :label="item.user_name + '(' + item.user_id + ')'"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="other-option">
          <label>{{ $t('common.other') }}</label>
          <el-select v-model="search.extras" multiple :placeholder="$t('common.select')">
            <el-option
              v-for="item in extraOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="select-tc">
          <label>{{ $t('user_type.tc') }}</label>
          <el-select v-model="search.tc_users" multiple filterable :placeholder="$t('common.select')">
            <el-option
              v-for="item in tcList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-container">
        <div class="select-translator">
          <label>{{ $t('user_type.translator') }}</label>
          <el-select v-model="search.translate_users" multiple filterable :placeholder="$t('common.select')">
            <el-option
              v-for="item in translatorList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <div class="select-reviewer">
          <label>{{ $t('user_type.reviewer') }}</label>
          <el-select v-model="search.review_users" multiple filterable :placeholder="$t('common.select')">
            <el-option
              v-for="item in reviewerList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
        <search-filter-item
          :sel-preset="search.keyword_type"
          :search-fields="searchFields"
          :search-word="search.search_keyword"
          :option1="$t('common.include')"
          :option2="$t('common.match')"
          @searchWordChanged="searchWordChanged"
          @optionChanged="optionChanged"
          @handleSearch="handleSearch"
          @keywordTypeChanged="keywordTypeChanged"
        >
        </search-filter-item>
        <div class="btn-search">
          <el-button class="btn-search" type="primary" icon="el-icon-search" @click="handleFilter">
            {{ $t('common.search') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <input
      id="file"
      ref="file"
      type="file"
      style="display:none;"
      @change="handleFileUpload()"
    />

    <el-card class="box-card table-card">
      <label class="total-count">
        {{ $t('table.total_count', { total: total }) }}
      </label>
      <div class="table-header">
        <div class="table-header-actions">
          <el-button class="btn-add" type="primary" icon="el-icon-plus" @click="goToRequestPage">
            {{ $t('caption.require_trans') }}
          </el-button>
          <el-button :loading="downloadLoading" class="btn-excel-download" type="primary" icon="el-icon-download" @click="handleDownload">
            {{ $t('common.excel_download') }}
          </el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-button class="filter-item" icon="el-icon-s-tools">
              </el-button>
            </span>
            <el-dropdown-menu slot="dropdown" class="column-control-dropdown">
              <div>
                {{ $t('common.column_control_desc') }}
              </div>
              <el-checkbox v-model="checkAllColumns" class="mt10" :indeterminate="isIndeterminate" @change="handleCheckAllColumnChange">
                {{ $t('common.all') }}
              </el-checkbox>
              <el-checkbox-group v-model="columnCheckVal" @change="handleCheckedColumnChange">
                <draggable
                  v-model="totalColumns"
                  class="list-group admin"
                  ghost-class="ghost"
                  @start="dragging = true"
                  @end="dragging = false"
                >
                  <el-checkbox v-for="(item, i) in totalColumns" :key="i" :label="item">
                    {{ $t('table.' + item) }}
                  </el-checkbox>
                </draggable>
              </el-checkbox-group>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <el-table
        ref="captionList"
        :key="tableKey"
        v-loading="listLoading"
        :data="list"
        fit
        border
        highlight-current-row
        style="width: 100%;"
        :row-class-name="tableRowClassName"
        @header-dragend="headerwidthChange"
      >
        <el-table-column
          :label="$t('table.no')"
          type="index"
          sortable="custom"
          width="70"
          align="center"
          prop=""
          :index="indexMethod"
        >
        </el-table-column>
        <el-table-column
          v-for="item in tableColumnOptions"
          :key="item"
          :label="$t('table.' + item)"
          :width="columnWidths[item]"
          :prop="item"
          align="center"
        >
          <template slot-scope="{row, $index}">
            <template v-if="$index == 0">
              <span v-if="item == 'duration'">
                {{ formatDuration(row['duration_sum']) }}
              </span>
              <span v-else-if="item == 'translate_price_JPY'">
                {{ '¥' + row['jpy_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'translate_price_KRW'">
                {{ '₩' + row['krw_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'translate_price_USD'">
                {{ '$' + row['usd_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'sum_work_price'">
                {{ '$' + row['total_work_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'tc_work_price'">
                {{ '$' + row['tc_work_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'translate_work_price'">
                {{ '$' + row['translate_work_price_sum'] | numberFormat }}
              </span>
              <span v-else-if="item == 'review_work_price'">
                {{ '$' + row['review_work_price_sum'] | numberFormat }}
              </span>
              <span v-else>
                -
              </span>
            </template>
            <template v-else>
              <template v-if="item == 'detail'">
                <i v-if="!row['can_expand'] || row['can_expand'] == 'N'" class="el-icon-document" @click="viewDetail(row)"></i>
                <template v-else>
                  <i v-if="isExpanded($index)" class="el-icon-circle-plus-outline" @click="toggleExpand(row, $index)"></i>
                  <i v-else class="el-icon-remove-outline" @click="toggleExpand(row, $index)"></i>
                </template>
              </template>
              <template v-else-if="item == 'is_end'">
                <el-tag v-if="row[item] == 'Y'" type="danger" effect="dark">
                  {{ $t('caption.completion_status') }}
                </el-tag><!--전체작업완료-->
                <el-tag v-if="row[item] == 'N'" type="warning" effect="plain">
                  {{ $t('caption.in_progress') }}
                </el-tag><!--미완료-->
              </template>
              <template v-else-if="item == 'can_push'">
                <!--Push-->
                <!--
                <el-tag v-if="row[item] == 'Y'" type="success" effect="dark" class="can-push">
                  Push
                </el-tag>
                -->
                <!--
                <el-tag v-else type="success" effect="plain">
                  Push
                </el-tag>
                -->
                <el-button v-if="row[item] == 'Y'" type="success" class="can_push" @click="pushAction(row['work_no'])">
                  Push
                </el-button>
                <el-button v-else type="success" class="can_push" disabled>
                  Push
                </el-button>
              </template>
              <el-tag v-else-if="item == 'status'" class="progress-status" :class="row[item] + ' ' + $i18n.locale">
                {{ status[row[item]] }}
              </el-tag>
              <span v-else-if="item == 'work_no'">{{ row['can_expand'] == 'Y' ? '-' : row[item] }}</span>
              <span v-else-if="item == 'tc_work_no'">
                {{ row['no_need_tc_work'] ? '-' : row[item] }}
              </span>
              <div v-else-if="item == 'title'" class="title" :title="row[item]">
                <a :href="row['youtube_url']" target="_blank">
                  <svg-icon icon-class="youtube" class-name="youtube-icon" />
                </a>
                {{ row[item] }}
              </div>
              <template v-else-if="item.indexOf('translate_price_') > -1">
                <span v-if="item.indexOf(row['currency_type']) > -1">
                  {{ currencySymbols[row['currency_type']] + row['work_price'] | numberFormat }}
                </span>
                <span v-else>
                  -
                </span>
              </template>
              <template v-else-if="item == 'tc_work_price'">
                <span v-if="row['no_need_tc_work']">
                  -
                </span>
                <div v-else>
                  {{ '$' + row[item] | numberFormat }}&nbsp;
                  <svg-icon
                    v-if="row['status'] == 'preparing'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="openPriceDialog(row, 'tc')"
                  />
                </div>
              </template>
              <div v-else-if="item == 'translate_work_price'">
                {{ '$' + row[item] | numberFormat }}&nbsp;
                <svg-icon
                  v-if="row['status'] == 'preparing' || row['status'] == 'tc_ing' || row['status'] == 'tc_complete'"
                  icon-class="edit"
                  class-name="edit-svg-icon"
                  @click="openPriceDialog(row, 'translate')"
                />
              </div>
              <template v-else-if="item == 'review_work_price'">
                <span v-if="row['native_review_check'] == 'N'">
                  -
                </span>
                <div v-else>
                  {{ '$' + row[item] | numberFormat }}&nbsp;
                  <svg-icon
                    v-if="row['status'] == 'preparing' || row['status'] == 'tc_ing' ||
                      row['status'] == 'tc_complete' || row['status'] == 'translating' ||
                      row['status'] == 'translation_complete'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="openPriceDialog(row, 'review')"
                  />
                </div>
              </template>
              <span v-else-if="item == 'sum_work_price'">{{ '$' + row[item] | numberFormat }}</span>
              <span v-else-if="item == 'duration'">{{ formatDuration(row[item]) }}</span>
              <span v-else-if="item == 'original_language' || item == 'translate_language'" class="lang-tag" :class="row[item]">{{ row[item] }}</span>
              <span v-else-if="item == 'payment_method'" class="support-service" :class="row[item]">{{ row[item] }}</span>

              <template v-else-if="item == 'original_video' || item == 'tc_video' || item == 'translate_video' || item == 'review_video'">
                <span v-if="!row[item]">-</span>
                <div v-else>
                  <span class="scene-file-info" @click="downloadFile(row[item])"><i class="el-icon-download"></i></span>
                  <svg-icon
                    v-if="item == 'original_video'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="uploadAnotherVideo(row['tc_id'], 'original')"
                  />
                  <svg-icon
                    v-else-if="item == 'tc_video'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="uploadAnotherVideo(row['tc_id'], 'tc')"
                  />
                  <svg-icon
                    v-else-if="item == 'translate_video'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="uploadAnotherVideo(row['work_no'], 'translator')"
                  />
                  <svg-icon
                    v-else
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="uploadAnotherVideo(row['work_no'], 'reviewer')"
                  />
                </div>
              </template>

              <span v-else-if="serviceParams.includes(item)" class="support-service" :class="row[item]">{{ row[item] }}</span>
              <span v-else-if="item == 'requester_memo'" class="requester-memo" :title="row['requester_memo']">
                {{ row['requester_memo'] }}
              </span>
              <template v-else-if="item == 'company'">
                <span v-if="row['company_name']" class="company-detail" @click="companyDetail(row['company_user_no'])">
                  {{ row['company_name'] }}<br />({{ row['company_user_id'] }})
                </span>
                <span v-else>
                  -
                </span>
              </template>
              <template v-else-if="item == 'requester'">
                <span v-if="row['user_name']" class="requester-detail" @click="requesterDetail(row['user_no'])">
                  {{ row['user_name'] }}<br />({{ row['user_id'] }})
                </span>
                <template v-else>
                  -
                </template>
              </template>
              <template v-else-if="item == 'tc'">
                <span v-if="row['original_video'] || row['no_need_tc_work']">
                  -
                </span>
                <div v-else-if="row['status'] == 'preparing'">
                  -
                  <svg-icon
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="openWorkerDialog(row['tc_id'], 'tc')"
                  />
                </div>
                <div v-else-if="row['status'] == 'tc_ing'">
                  <span class="worker-detail" @click="workerDetail(row['tc_user_no'])">
                    {{ row['tc_user_name'] }}<br />({{ row['tc_user_id'] }})
                  </span>
                  <svg-icon
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="openWorkerDialog(row['tc_id'], 'tc', row['tc_user_no'])"
                  />
                </div>
                <template v-else>
                  <span class="worker-detail" @click="workerDetail(row['tc_user_no'])">
                    {{ row['tc_user_name'] }}<br />({{ row['tc_user_id'] }})
                  </span>
                </template>
              </template>
              <template v-else-if="item == 'translator'">
                <template v-if="row['original_video'] || row['no_need_tc_work']">
                  <div v-if="row['status'] == 'preparing'">
                    -
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'translator')"
                    />
                  </div>
                  <div v-else-if="row['status'] == 'translating'">
                    <span class="worker-detail" @click="workerDetail(row['translate_user_no'])">
                      {{ row['translate_user_name'] }}<br />({{ row['translate_user_id'] }})
                    </span>
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'translator', row['translate_user_no'])"
                    />
                  </div>
                  <template v-else>
                    <span class="worker-detail" @click="workerDetail(row['translate_user_no'])">
                      {{ row['translate_user_name'] }}<br />({{ row['translate_user_id'] }})
                    </span>
                  </template>
                </template>
                <template v-else>
                  <span v-if="row['status'] == 'preparing' || row['status'] == 'tc_ing'">
                    -
                  </span>
                  <div v-else-if="row['status'] == 'tc_complete'">
                    -
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'translator')"
                    />
                  </div>
                  <div v-else-if="row['status'] == 'translating'">
                    <span class="worker-detail" @click="workerDetail(row['translate_user_no'])">
                      {{ row['translate_user_name'] }}<br />({{ row['translate_user_id'] }})
                    </span>
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'translator', row['translate_user_no'])"
                    />
                  </div>
                  <template v-else>
                    <span class="worker-detail" @click="workerDetail(row['translate_user_no'])">
                      {{ row['translate_user_name'] }}<br />({{ row['translate_user_id'] }})
                    </span>
                  </template>
                </template>
              </template>
              <template v-else-if="item == 'reviewer'">
                <template v-if="row['native_review_check'] == 'N'">
                  -
                </template>
                <template v-else>
                  <span v-if="row['status'] == 'preparing' || row['status'] == 'tc_ing' || row['status'] == 'tc_complete' || row['status'] == 'translating'">
                    -
                  </span>
                  <div v-else-if="row['status'] == 'translation_complete'">
                    -
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'reviewer')"
                    />
                  </div>
                  <div v-else-if="row['status'] == 'reviewing'">
                    <span class="worker-detail" @click="workerDetail(row['review_user_no'])">
                      {{ row['review_user_name'] }}<br />({{ row['review_user_id'] }})
                    </span>
                    <svg-icon
                      icon-class="edit"
                      class-name="edit-svg-icon"
                      @click="openWorkerDialog(row['work_no'], 'reviewer', row['review_user_no'])"
                    />
                  </div>
                  <template v-else>
                    <span class="worker-detail" @click="workerDetail(row['review_user_no'])">
                      {{ row['review_user_name'] }}<br />({{ row['review_user_id'] }})
                    </span>
                  </template>
                </template>
              </template>
              <span v-else-if="item == 'req_date'">
                {{ row[item] | date }}
              </span>
              <template v-else-if="item == 'tc_predict_end_date'">
                <span v-if="row['original_video'] || row['no_need_tc_work']">
                  -
                </span>
                <div v-else>
                  {{ formatPredictDate(row['tc_predict_end_date'], row['status'], 'tc') }}&nbsp;
                  <svg-icon
                    v-if="row['status'] == 'preparing'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="setPredEndDate(row['tc_id'], row['tc_predict_end_date'], 'tc')"
                  />
                </div>
              </template>
              <div v-else-if="item == 'translate_predict_end_date'">
                {{ formatPredictDate(row['translate_predict_end_date'], row['status'], 'translate') }}&nbsp;
                <svg-icon
                  v-if="row['status'] == 'tc_complete' || (row['status'] == 'preparing' && row['no_need_tc_work'])"
                  icon-class="edit"
                  class-name="edit-svg-icon"
                  @click="setPredEndDate(row['work_no'], row['translate_predict_end_date'], 'translate')"
                />
              </div>
              <template v-else-if="item == 'review_predict_end_date'">
                <span v-if="row['native_review_check'] == 'N'">
                  -
                </span>
                <div v-else>
                  {{ formatPredictDate(row['review_predict_end_date'], row['status'], 'review') }}&nbsp;
                  <svg-icon
                    v-if="row['status'] == 'translation_complete'"
                    icon-class="edit"
                    class-name="edit-svg-icon"
                    @click="setPredEndDate(row['work_no'], row['review_predict_end_date'], 'review')"
                  />
                </div>
              </template>
              <span v-else-if="item == 'predict_end_date' || item == 'end_date' || item == 'tc_end_date' || item == 'translate_end_date' || item == 'review_end_date'">
                <template v-if="!row[item]">-</template>
                <template v-else>{{ row[item] | date }}</template>
              </span>
              <span v-else>{{ row[item] ? row[item] : '-' }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column type="expand" width="1" class-name="expand-icon">
          <template slot-scope="{row}">
            <el-table
              ref="captionChildList"
              :data="row['child']"
              fit
              border
              style="width: 100%;"
              :header-row-class-name="childTableHeaderClassName"
            >
              <el-table-column
                type="index"
                width="70"
                align="center"
              >
                <i class="el-icon-right"></i>
              </el-table-column>
              <el-table-column
                v-for="item in tableColumnOptions"
                :key="item"
                :width="columnWidths[item]"
                align="center"
              >
                <template slot-scope="child">
                  <template v-if="item == 'detail'">
                    <i class="el-icon-document" @click="viewDetail(child.row)"></i>
                  </template>
                  <template v-else-if="item == 'end_type'">
                    <i v-if="row['end_date']" class="el-icon-success"></i><!--전체작업완료-->
                    <i v-else class="el-icon-minus"></i><!--미완료-->
                  </template>
                  <el-tag v-else-if="item == 'status'" class="progress-status" :class="child.row[item] + ' ' + $i18n.locale">
                    {{ status[child.row[item]] }}
                  </el-tag>
                  <div v-else-if="item == 'title'" class="title">
                    <a :href="row['youtube_url']" target="_blank">
                      <svg-icon icon-class="youtube" class-name="youtube-icon" />
                    </a>{{ child.row[item] }}
                  </div>
                  <span v-else-if="item == 'work_price'">{{ currencySymbols[$auth.user.currency_type] + child.row[item] | numberFormat }}</span>
                  <span v-else-if="item == 'duration'">{{ formatDuration(child.row[item]) }}</span>
                  <span v-else-if="item == 'original_language'" class="lang-tag" :class="child.row[item]">{{ child.row[item] }}</span>
                  <span v-else-if="item == 'translate_languages'" class="lang-tag" :class="child.row['translate_language']">{{ child.row['translate_language'] }}</span>
                  <template v-else-if="item == 'original_video' || item == 'translate_video'">
                    <span v-if="!child.row[item]">-</span>
                    <span v-else class="scene-file-info" @click="downloadFile(child.row[item])"><i class="el-icon-download"></i></span>
                  </template>
                  <span v-else-if="serviceParams.includes(item)" class="support-service" :class="row[item]">{{ row[item] }}</span>
                  <span v-else-if="item == 'request_date' || item == 'predict_end_date'">{{ row[item] | date }}</span>
                  <span v-else-if="item == 'end_date'">
                    <template v-if="!child.row[item]">-</template>
                    <template v-else>{{ child.row[item] | date }}</template>
                  </span>
                  <span v-else>{{ child.row[item] ? child.row[item] : '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="table.page"
        :limit.sync="table.page_length"
        @pagination="getList"
      />
    </el-card>
    <!-- Change work price -->
    <el-dialog
      :title="priceDialogTitle"
      :visible.sync="priceDialogVisible"
      class="price-change-dialog"
      @close="closePriceDialog"
    >
      <el-row type="flex" align="middle" justify="space-around">
        <div>
          $&nbsp;
          <el-input v-model="changeWorkPrice" type="number"></el-input>
        </div>
        <el-button type="primary" @click="confirmPriceDialog">
          {{ $t('common.save') }}
        </el-button>
      </el-row>
    </el-dialog>
    <!-- Change worker -->
    <el-dialog
      :title="$t('caption.worker_change')"
      :visible.sync="workerDialogVisible"
      class="worker-change-dialog"
      @close="closeWorkerDialog"
    >
      <el-row type="flex" align="middle" justify="space-around">
        <span class="worker-type">{{ changeWorkerLabel }}&nbsp;</span>
        <template v-if="changeWorkerType == 'tc'">
          <el-select v-model="changeWorkerId" filterable placeholder="">
            <el-option
              v-for="item in tcList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </template>
        <template v-if="changeWorkerType == 'translator'">
          <el-select v-model="changeWorkerId" filterable placeholder="">
            <el-option
              v-for="item in translatorList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </template>
        <template v-if="changeWorkerType == 'reviewer'">
          <el-select v-model="changeWorkerId" filterable placeholder="">
            <el-option
              v-for="item in reviewerList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </template>
        <el-button type="primary" @click="confirmWorkerDialog">
          {{ $t('common.apply') }}
        </el-button>
      </el-row>
    </el-dialog>
    <!-- Set predict end time -->
    <el-dialog
      :title="$t('caption.predict_end_date_set')"
      :visible.sync="predDialogVisible"
      class="end-date-dialog"
      @close="closePredEndDialog"
    >
      <el-row type="flex" align="middle" justify="space-around">
        <span>{{ $t('caption.after_accept') }}</span>
        <el-input v-model="predDialogHour" type="number"></el-input>
        <span>{{ $t('caption.hour') }}</span>
        <el-input v-model="predDialogMin" type="number"></el-input>
        <span>{{ $t('caption.min') }}&nbsp;{{ $t('caption.later') }}</span>
        <el-button type="primary" @click="confirmPredictTimeDialog">
          {{ $t('common.apply') }}
        </el-button>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
// eslint-disable-next-line no-unused-vars
import list from '@/mixin/list'
import * as exportExcel from '@/utils/Export2Excel'

const currencySymbols = {
  JPY: '¥',
  KRW: '₩',
  USD: '$'
}
const defaultColumns = [
  'detail',
  'is_end', // 작업완료
  'can_push', // 작업자푸시
  'status', // 진행상태
  'work_no', // 작업번호
  'tc_work_no', // TC 작업번호
  'title', // 제목
  'duration', // 영상길이
  'original_language', // 원본언어
  'translate_language', // 번역언어
  'payment_method', // 선결제
  'translate_price_JPY',
  'translate_price_KRW',
  'translate_price_USD',
  'sum_work_price', // 작업금액(합)
  'tc_work_price',
  'translate_work_price',
  'review_work_price',
  'original_video', // 원본자막
  'tc_video', // TC자막
  'translate_video', // 번역자막
  'review_video',
  'emergency_request_check',
  'title_request_check',
  'native_review_check',
  'youtube_apply_check',
  'requester_memo',
  'company',
  'requester',
  'tc',
  'translator',
  'reviewer',
  'req_date',
  'predict_end_date',
  'end_date',
  'tc_predict_end_date',
  'tc_end_date',
  'translate_predict_end_date',
  'translate_end_date',
  'review_predict_end_date',
  'review_end_date'
]

const columnWidths = {
  detail: 75,
  is_end: 120,
  can_push: 100,
  status: 120,
  work_no: 85,
  tc_work_no: 95,
  title: 300,
  duration: 120,
  original_language: 90,
  translate_language: 90,
  payment_method: 90,
  translate_price_JPY: 120,
  translate_price_KRW: 120,
  translate_price_USD: 120,
  sum_work_price: 120, // 작업금액(합)
  tc_work_price: 120,
  translate_work_price: 120,
  review_work_price: 120,
  original_video: 100, // 원본자막
  tc_video: 100, // TC자막
  translate_video: 100, // 번역자막
  review_video: 100, // 검수자막
  emergency_request_check: 100,
  title_request_check: 120,
  native_review_check: 120,
  youtube_apply_check: 100,
  requester_memo: 200,
  company: 120,
  requester: 120,
  tc: 120,
  translator: 120,
  reviewer: 120,
  req_date: 180,
  predict_end_date: 180,
  end_date: 180,
  tc_predict_end_date: 200,
  tc_end_date: 180,
  translate_predict_end_date: 200,
  translate_end_date: 180,
  review_predict_end_date: 200,
  review_end_date: 180
}

export default {
  // middleware: ['auth', 'auth-admin'],
  middleware: ['auth', 'stats'],
  name: 'CaptionListForAdmin',
  mixins: [list],
  async asyncData ({ $axios, params, error }) {
    try {
      const response = await $axios.post('/basic/get-table-info', { list_type: 'caption_list' })
      const { errorCode, data } = response.data

      if (errorCode !== 0) {
        const resp = await $axios.post('/basic/set-table-property', { columns: defaultColumns, list_type: 'caption_list' })
        const { errorCode } = resp.data
        console.log(errorCode)
        return {
          totalColumns: defaultColumns,
          tableColumnOptions: defaultColumns,
          columnCheckVal: defaultColumns,
          columnWidths
        }
      } else {
        const _columnWidths = columnWidths
        const _tableColumnOptions = []
        for (let i = 0; i < defaultColumns.length; i++) {
          if (data[defaultColumns[i]] !== undefined) {
            _tableColumnOptions.push(defaultColumns[i])
            if (data[defaultColumns[i]] !== 0) {
              _columnWidths[defaultColumns[i]] = data[defaultColumns[i]]
            }
          }
        }

        return {
          totalColumns: defaultColumns,
          tableColumnOptions: _tableColumnOptions,
          columnCheckVal: _tableColumnOptions,
          columnWidths: _columnWidths
        }
      }
    } catch (err) {
    }
  },
  data () {
    return {
      list_type: 'caption_list',
      file: '',
      dialogWorkNo: '',

      priceDialogVisible: false,
      priceDialogTitle: '',
      changeWorkPrice: '',
      changeWorkType: '',
      changeWorkerLabel: '',

      workerDialogVisible: false,
      changeWorkerId: '',
      changeWorkerType: '',

      predDialogVisible: false,
      predDialogHour: 0,
      predDialogMin: 0,

      currencySymbols,
      search: {
        date_type: 1, // 1: 작업요청일시, 2: 작업완료일시, 3: 작업완료예정일시
        start_date: '',
        end_date: '',
        finish_work_type: 0, // 1: 작업완료, 2: 작업미완료
        price_type: 1,
        start_work_price: '',
        end_work_price: '',
        requesters: [],
        tc_users: [], // TC작업자
        translate_users: [],
        review_users: [],
        companies: [],
        extras: [],
        status: [], // preset: 전체, ['preparing', 'tc_ings']: 준비중, TC작업중
        original_language: 0, // 0: 전체
        translate_language: 0, // 0: 전체
        keyword_type: 1, // 1: 제목, 2: 작업번호, 3: 요청자메모
        search_keyword: '',
        search_type: 1 // 1: 포함, 2: 일치
      },
      dateTypes: [
        { value: 1, label: this.$t('caption.work_require_time') },
        { value: 2, label: this.$t('caption.work_finish_time') },
        { value: 3, label: this.$t('caption.work_finish_predict_date') },
        { value: 4, label: this.$t('table.tc_end_date') },
        { value: 5, label: this.$t('table.translate_end_date') },
        { value: 6, label: this.$t('table.review_end_date') }
      ],
      amountOptions: [
        { value: 1, label: this.$t('caption.trans_amount') + '(¥)' },
        { value: 2, label: this.$t('caption.trans_amount') + '(₩)' },
        { value: 3, label: this.$t('caption.trans_amount') + '($)' },
        { value: 4, label: this.$t('table.sum_work_price') },
        { value: 5, label: this.$t('table.tc_work_price') },
        { value: 6, label: this.$t('table.translate_work_price') },
        { value: 7, label: this.$t('table.review_work_price') }
      ],
      // columnWidths,
      serviceParams: [
        'emergency_request_check',
        'title_request_check',
        'native_review_check',
        'youtube_apply_check'
      ],
      finishStatus: [
        { value: 0, label: this.$t('caption.select') },
        { value: 1, label: this.$t('caption.work_finish') }, // 작업완료
        { value: 2, label: this.$t('caption.work_no_finish') } // 작업미완료
      ],
      progressList: [
        { value: 'preparing', label: this.$t('caption.prog_ready') },
        { value: 'tc_ing', label: this.$t('caption.prog_tc_do') },
        { value: 'tc_complete', label: this.$t('caption.prog_tc_finish') },
        { value: 'translating', label: this.$t('caption.prog_trans_do') },
        { value: 'translation_complete', label: this.$t('caption.prog_trans_finish') },
        { value: 'reviewing', label: this.$t('caption.prog_review_do') },
        { value: 'review_complete', label: this.$t('caption.prog_review_finish') },
        { value: 'subtitle_apply', label: this.$t('caption.prog_cation_apply') },
        { value: 'subtitle_apply_failed', label: this.$t('caption.subtitle_apply_failed') }
      ],
      requesterList: [],
      companyList: [],
      orglangs: [],
      translangs: [],
      searchFields: [
        { value: 1, label: this.$t('caption.title') },
        { value: 2, label: this.$t('caption.work_no') },
        { value: 3, label: this.$t('caption.requester_memo') }
      ],
      status: {
        preparing: this.$t('caption.prog_ready'), // 준비중
        tc_ing: this.$t('caption.prog_tc_do'), // TC중
        tc_complete: this.$t('caption.prog_tc_finish'), // TC완료
        translating: this.$t('caption.prog_trans_do'), // 번역중
        translation_complete: this.$t('caption.prog_trans_finish'), // 번역완료
        reviewing: this.$t('caption.prog_review_do'), // 검수중
        review_complete: this.$t('caption.prog_review_finish'), // 검수완료
        subtitle_apply: this.$t('caption.prog_cation_apply'), // 자막적용
        subtitle_apply_failed: this.$t('caption.subtitle_apply_failed') // 자막적용 실패
      },
      extraOptions: [
        { value: 0, label: this.$t('caption.org_scene') + 'Y' },
        { value: 1, label: this.$t('caption.org_scene') + 'N' },
        { value: 2, label: this.$t('caption.urg_trans') + 'Y' },
        { value: 3, label: this.$t('caption.urg_trans') + 'N' },
        { value: 4, label: this.$t('table.title_request_check') + 'Y' },
        { value: 5, label: this.$t('table.title_request_check') + 'N' },
        { value: 6, label: this.$t('table.native_review_check') + 'Y' },
        { value: 7, label: this.$t('table.native_review_check') + 'N' },
        { value: 8, label: this.$t('table.youtube_apply_check') + 'Y' },
        { value: 9, label: this.$t('table.youtube_apply_check') + 'N' },
        { value: 10, label: this.$t('table.payment_method') + 'Y' },
        { value: 11, label: this.$t('table.payment_method') + 'N' },
        { value: 12, label: this.$t('table.payment_method') + 'F' }
      ],
      tcList: [],
      translatorList: [],
      reviewerList: []
    }
  },
  computed: {
    ...mapGetters({ rowExpand: 'app/rowExpand' })
  },
  created () {
    // set route params from other pages
    this.setRouteParams()
    this.setRouteQuery()
    if (this.$route.params.period === undefined && !this.$route.params.startDate && !this.$route.query.startDate) {
      this.initDateRange()
    }
    this.$store.dispatch('app/initRowExpand')
    // this.initTableColumnData()
    this.getList()
    this.getWorkLangs()
    this.getCompanyList()
    this.getRequesterList()
    this.getWorkerList()
  },
  methods: {
    // eslint-disable-next-line camelcase
    async pushAction (work_no) {
      // eslint-disable-next-line camelcase
      try {
        const response = await this.$axios.post('/subtitle-worker/push-notice', {
          work_no
        })
        const { errorCode } = response.data
        if (errorCode > 0) {
          this.$message.error(this.$t('caption.apply_failed'))
        } else {
          this.$message.success(this.$t('caption.method_success'))
        }
      } catch (err) {
        console.log(err)
      }
    },
    onCompanyChange () {
      this.getRequesterList()
    },
    async handleFileUpload () {
      this.file = this.$refs.file.files[0]
      const formData = new FormData()
      formData.append('work_no', this.dialogWorkNo)
      formData.append('video_type', this.changeWorkerType)
      formData.append('file', this.file)
      const response = await this.$axios.post('/subtitle-worker/change-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const { errorCode, data } = response.data
      if (errorCode === 0) {
        this.$message.success(this.$t('caption.apply_success'))
        for (let i = 1; i < this.list.length; i++) {
          if (this.changeWorkerType === 'original' && this.list[i].tc_id === this.dialogWorkNo) {
            this.list[i].original_video = data.file_name
          }
          if (this.changeWorkerType === 'tc' && this.list[i].tc_id === this.dialogWorkNo) {
            this.list[i].tc_video = data.file_name
          }
          if (this.changeWorkerType === 'translator' && this.list[i].work_no === this.dialogWorkNo) {
            this.list[i].translate_video = data.file_name
            break
          }
          if (this.changeWorkerType === 'reviewer' && this.list[i].work_no === this.dialogWorkNo) {
            this.list[i].review_video = data.file_name
            break
          }
        }
      } else {
        this.$message.error(this.$t('caption.apply_failed'))
      }
    },
    uploadAnotherVideo (workNo, videoType) {
      console.log(workNo, videoType)
      this.dialogWorkNo = workNo
      this.changeWorkerType = videoType
      this.$refs.file.click()
    },
    companyDetail (companyId) {
      window.open('/company/detail/' + companyId, '_blank', 'width=1200,height=700')
    },
    requesterDetail (requesterId) {
      window.open('/requester/detail/' + requesterId, '_blank', 'width=1200,height=700')
    },
    workerDetail (workerId) {
      window.open('/worker/detail/' + workerId, '_blank', 'width=1200,height=700')
    },
    formatPredictDate (predictDate, status, workType) {
      if (!predictDate) { // predictDate 단위 분
        return '-'
      }
      if ((workType === 'tc' && status === 'preparing') ||
      (workType === 'translate' && status === 'tc_complete') ||
      (workType === 'review' && status === 'translation_complete')) {
        const predictTime = parseInt(predictDate, 10)
        const hour = Math.floor(predictTime / 60)
        const minute = predictTime % 60
        if (hour === 0 && minute !== 0) {
          return this.$t('caption.wait_min_pred_date', { minute })
        }
        if (hour !== 0 && minute === 0) {
          return this.$t('caption.wait_hour_pred_date', { hour })
        }
        return this.$t('caption.wait_pred_date', { hour, minute })
      } else {
        return this.$options.filters.date(predictDate)
      }
    },
    openWorkerDialog (workNo, workerType, workerId = null) {
      this.dialogWorkNo = workNo
      this.changeWorkerType = workerType
      this.changeWorkerLabel = this.$t('user_type.' + workerType)
      this.changeWorkerId = workerId
      this.workerDialogVisible = true
    },
    closeWorkerDialog () {
      this.dialogWorkNo = ''
      this.changeWorkerType = ''
      this.changeWorkerId = ''
    },
    setPredEndDate (workNo, predEndDate, workerType) {
      const predictTime = parseInt(predEndDate, 10)
      this.predDialogHour = Math.floor(predictTime / 60)
      this.predDialogMin = predictTime % 60
      this.dialogWorkNo = workNo
      this.changeWorkerType = workerType
      this.predDialogVisible = true
    },
    closePredEndDialog () {
      this.predDialogHour = 0
      this.predDialogMin = 0
      this.dialogWorkNo = ''
    },
    openPriceDialog (row, workType) {
      if (workType === 'tc') { this.dialogWorkNo = row.tc_id } else { this.dialogWorkNo = row.work_no }
      this.changeWorkPrice = row[workType + '_work_price']
      this.changeWorkType = workType
      this.priceDialogTitle = this.$t('caption.' + workType + '_work_price_change')
      this.priceDialogVisible = true
    },
    closePriceDialog () {
      this.changeWorkPrice = ''
      this.changeWorkType = ''
      this.priceDialogTitle = ''
      this.dialogWorkNo = ''
    },
    async confirmPredictTimeDialog () {
      try {
        const tempWorkerId = this.dialogWorkNo; const workerType = this.changeWorkerType
        const response = await this.$axios.post('/subtitle-worker/set-end-time', {
          work_no: this.dialogWorkNo,
          hour: this.predDialogHour,
          minute: this.predDialogMin,
          user_type: this.changeWorkerType
        })
        const { errorCode } = response.data
        if (errorCode === 400) {
          this.$message.error(this.$t('caption.set_predict_endtime_failed'))
        } else if (errorCode > 0) {
          this.$message.error(this.$t('caption.apply_failed'))
        } else {
          this.$message.success(this.$t('caption.apply_success'))
          for (let i = 1; i < this.list.length; i++) {
            if (workerType === 'tc' && this.list[i].tc_id === tempWorkerId) {
              this.list[i].tc_predict_end_date = parseInt(this.predDialogHour) * 60 + parseInt(this.predDialogMin)
            }
            if (workerType === 'translate' && this.list[i].work_no === tempWorkerId) {
              this.list[i].translate_predict_end_date = parseInt(this.predDialogHour) * 60 + parseInt(this.predDialogMin)
              break
            }
            if (workerType === 'review' && this.list[i].work_no === tempWorkerId) {
              this.list[i].review_predict_end_date = parseInt(this.predDialogHour) * 60 + parseInt(this.predDialogMin)
              break
            }
          }
        }
        this.predDialogVisible = false
      } catch (err) {
        console.log(err)
      }
    },
    async confirmWorkerDialog () {
      try {
        let response; let workerType = ''; const tempWorkerId = this.dialogWorkNo
        workerType = this.changeWorkerType
        if (this.changeWorkerType === 'tc') {
          response = await this.$axios.post('/subtitle-worker/tc-assign-work', {
            worker_id: this.changeWorkerId,
            work_no: this.dialogWorkNo,
            manual: true
          })
        } else {
          response = await this.$axios.post('/subtitle-worker/assign-work', {
            worker_id: this.changeWorkerId,
            work_no: this.dialogWorkNo,
            manual: true
          })
        }
        const { errorCode, data } = response.data
        if (errorCode === 400) {
          this.$message.error(this.$t('caption.set_worker_failed'))
        } else if (errorCode > 0) {
          this.$message.error(this.$t('caption.apply_failed'))
        } else {
          this.$message.success(this.$t('caption.apply_success'))
          for (let i = 1; i < this.list.length; i++) {
            if (workerType === 'tc' && this.list[i].tc_id === tempWorkerId) {
              this.list[i].tc_user_no = data.user_no
              this.list[i].tc_user_id = data.user_id
              this.list[i].tc_user_name = data.user_name
              this.list[i].status = data.status
            }
            if (workerType === 'translator' && this.list[i].work_no === tempWorkerId) {
              this.list[i].translate_user_name = data.user_name
              this.list[i].translate_user_id = data.user_id
              this.list[i].translate_user_no = data.user_no
              this.list[i].status = data.status
              break
            }
            if (workerType === 'reviewer' && this.list[i].work_no === tempWorkerId) {
              this.list[i].review_user_name = data.user_name
              this.list[i].review_user_id = data.user_id
              this.list[i].review_user_no = data.user_no
              this.list[i].status = data.status
              break
            }
          }
        }
        this.workerDialogVisible = false
      } catch (err) {
        console.log(err)
      }
    },
    async confirmPriceDialog () {
      try {
        const response = await this.$axios.post('/subtitle-worker/set-price', {
          work_no: this.dialogWorkNo,
          work_price: this.changeWorkPrice,
          user_type: this.changeWorkType
        })
        const { errorCode } = response.data
        if (errorCode === 400) {
          this.$message.error(this.$t('caption.set_price_failed'))
        } else if (errorCode > 0) {
          this.$message.error(this.$t('caption.apply_failed'))
        } else {
          this.$message.success(this.$t('caption.apply_success'))
          for (let i = 1; i < this.list.length; i++) {
            if (this.changeWorkType === 'tc' && this.list[i].tc_id === this.dialogWorkNo) {
              this.list[0].tc_work_price_sum = this.list[0].tc_work_price_sum - this.list[i].tc_work_price
              this.list[i].tc_work_price = this.changeWorkPrice
              this.list[0].tc_work_price_sum = parseFloat(this.list[0].tc_work_price_sum) + parseFloat(this.list[i].tc_work_price)
            }
            if (this.changeWorkType === 'translate' && this.list[i].work_no === this.dialogWorkNo) {
              this.list[0].translate_work_price_sum = this.list[0].translate_work_price_sum - this.list[i].translate_work_price
              this.list[i].translate_work_price = this.changeWorkPrice
              this.list[0].translate_work_price_sum = parseFloat(this.list[0].translate_work_price_sum) + parseFloat(this.list[i].translate_work_price)
              break
            }
            if (this.changeWorkType === 'review' && this.list[i].work_no === this.dialogWorkNo) {
              this.list[0].review_work_price_sum = this.list[0].review_work_price_sum - this.list[i].review_work_price
              this.list[i].review_work_price = this.changeWorkPrice
              this.list[0].review_work_price_sum = parseFloat(this.list[0].review_work_price_sum) + parseFloat(this.list[i].review_work_price)
              break
            }
          }
        }
      } catch (err) {
        console.log(err)
      }
      this.priceDialogVisible = false
    },
    initTableColumnData () {
      this.totalColumns = defaultColumns
      this.tableColumnOptions = defaultColumns
      this.columnCheckVal = defaultColumns
    },
    async getWorkerList () {
      try {
        const resp = await this.$axios.post('/worker/get-worker-list')
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          if (data.list.length === 0) {
            this.tcList = this.translatorList = this.reviewerList = []
          } else {
            data.list.map((item) => {
              if (item.user_type === 'tc') {
                this.tcList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              } else if (item.user_type === 'translator') {
                this.translatorList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              } else {
                this.reviewerList.push({
                  id: item.id,
                  label: item.user_name + '(' + item.user_id + ')'
                })
              }
            })
          }
        } else {
        }
      } catch (err) {
      }
    },
    async getCompanyList () {
      try {
        const resp = await this.$axios.post('/company/get-company-list')
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.companyList = data.list
        } else {
          this.companyList = []
        }
      } catch (err) {
        this.companyList = []
      }
    },
    async getRequesterList () {
      try {
        let resp
        if (this.search.companies.length === 0) { resp = await this.$axios.post('/requester/get-requester-list') } else {
          resp = await this.$axios.post('/requester/get-requester-list', {
            search: { company_ids: this.search.companies }
          })
        }
        const { errorCode, data } = resp.data
        if (errorCode === 0) {
          this.requesterList = data.list
        } else {
          this.requesterList = []
        }
      } catch (err) {
        this.requesterList = []
      }
    },
    async getWorkLangs () {
      const resp = await this.$axios.post('/basic/get-working-languages')
      this.orglangs = resp.data.data.map(item => item)
      this.orglangs.unshift({ id: 0, name: 'all' })
      this.translangs = resp.data.data.map(item => item)
      this.translangs.unshift({ id: 0, name: 'all' })
    },
    isExpanded (rowIndex) {
      const matched = this.rowExpand.filter(item => item.rowIndex === rowIndex)
      if (matched.length > 0) {
        return matched[0].isExpanded
      } else {
        return true
      }
    },
    formatDuration (duration) {
      if (!duration) {
        return '0h 0m 0s'
      }
      const secNum = parseInt(duration, 10) // don't forget the second param
      const hours = Math.floor(secNum / 3600)
      const minutes = Math.floor((secNum - (hours * 3600)) / 60)
      const seconds = secNum - (hours * 3600) - (minutes * 60)
      return hours + 'h ' + minutes + 'm ' + seconds + 's'
    },
    indexMethod (index) {
      if (index === 0) {
        return this.$t('table.sum')
      }
      return this.total - ((this.table.page - 1) * this.table.page_length + index) + 1 // descending order
    },
    goToRequestPage () {
      this.$router.push('/caption/add')
    },
    async handleDownload () {
      const tHeader = [this.$t('table.no')]
      const filterVal = ['no']
      for (let i = 0; i < this.tableColumnOptions.length; i++) {
        if (this.tableColumnOptions[i] === 'detail') {
          continue
        }
        tHeader.push(this.$t('table.' + this.tableColumnOptions[i]))
        filterVal.push(this.tableColumnOptions[i])
      }
      // filterVal.push('child') // for child data
      this.downloadLoading = true
      const data = await this.formatJson(filterVal)
      exportExcel.exportJsonToExcel({
        header: tHeader,
        data,
        filename: 'list_of_caption'
      })
      this.downloadLoading = false
    },
    async formatJson (filterVal) {
      const searchParams = Object.assign({}, this.search)
      if (this.dateRange.length === 2) {
        searchParams.start_date = Math.floor(this.dateRange[0] / 1000)
        searchParams.end_date = Math.floor(this.dateRange[1] / 1000)

        console.log(searchParams.start_date, searchParams.end_date)
      }
      if (searchParams.status.length === 0) {
        delete searchParams.status
      }
      if (searchParams.original_language === 0) {
        delete searchParams.original_language
      }
      if (searchParams.translate_language === 0) {
        delete searchParams.translate_language
      }
      if (searchParams.finish_work_type === 0) {
        delete searchParams.finish_work_type
      }
      if (searchParams.requesters.length === 0) {
        delete searchParams.requesters
      }
      if (searchParams.companies.length === 0) {
        delete searchParams.companies
      }
      if (searchParams.extras.length === 0) {
        delete searchParams.extras
      }
      try {
        const response = await this.$axios.post('/subtitle-history/get-admin-request-list', {
          search: searchParams
        })
        this.excelList = response.data.data.list
        /* this.excelList.unshift({
          duration: response.data.data.duration_sum,
          work_price: response.data.data.work_price_sum
        }) */
      } catch (err) {
        this.excelList = []
      }

      const totalCount = this.excelList.length

      return this.excelList.map((v, index) => filterVal.map((j) => {
        if (j === 'no') {
          return (totalCount - index)
        } else if (j === 'is_end') {
          if (v[j] === 'Y') {
            return this.$t('caption.completion_status')
          } else {
            return this.$t('caption.in_progress')
          }
        } else if (j === 'status') {
          return this.status[v[j]]
        } else if (j === 'duration') {
          return this.formatDuration(v[j])
        } else if (j.includes('translate_price_')) {
          if (j.includes(v.currency_type)) {
            return this.currencySymbols[v.currency_type] +
            this.$options.filters.numberFormat(v.work_price)
          } else {
            return ''
          }
        } else if (j.includes('_work_price')) {
          return '$' + this.$options.filters.numberFormat(v[j])
        } else if (j === 'company') {
          return v.company_name + '(' + v.company_user_id + ')'
        } else if (j === 'requester') {
          return v.user_name + '(' + v.user_id + ')'
        } else if (j === 'tc') {
          if (v.original_video) {
            return ''
          } else if (v.status === 'preparing') {
            return ''
          } else {
            return v.tc_user_name + '(' + v.tc_user_id + ')'
          }
        } else if (j === 'translator') {
          if (v.original_video) {
            if (v.status === 'preparing') {
              return ''
            } else {
              return v.translate_user_name + '(' + v.translate_user_id + ')'
            }
          } else if (v.status === 'preparing' || v.status === 'tc_ing' || v.status === 'tc_complete') {
            return ''
          } else {
            return v.translate_user_name + '(' + v.translate_user_id + ')'
          }
        } else if (j === 'reviewer') {
          if (v.native_review_check === 'N') {
            return ''
          // eslint-disable-next-line unicorn/prefer-includes
          } else if (['preparing', 'tc_ing', 'tc_complete', 'translating', 'translation_complete'].indexOf(v.status) > -1) {
            return ''
          } else {
            return v.review_user_name + '(' + v.review_user_id + ')'
          }
        } else if (j === 'req_date') {
          return this.$options.filters.date(v[j])
        } else if (j === 'tc_predict_end_date') {
          if (v.original_video) {
            return ''
          } else {
            return this.formatPredictDate(v.tc_predict_end_date, v.status, 'tc') === '-' ? '' : this.formatPredictDate(v.tc_predict_end_date, v.status, 'tc')
          }
        } else if (j === 'translate_predict_end_date') {
          return this.formatPredictDate(v.translate_predict_end_date, v.status, 'translate') === '-' ? '' : this.formatPredictDate(v.translate_predict_end_date, v.status, 'translate')
        } else if (j === 'review_predict_end_date') {
          if (v.native_review_check === 'N') {
            return ''
          } else {
            return this.formatPredictDate(v.review_predict_end_date, v.status, 'review') === '-' ? '' : this.formatPredictDate(v.review_predict_end_date, v.status, 'review')
          }
        // eslint-disable-next-line unicorn/prefer-includes
        } else if (['predict_end_date', 'end_date', 'tc_end_date', 'translate_end_date', 'review_end_date'].indexOf(j) > -1) {
          if (v[j]) {
            return this.$options.filters.date(v[j])
          } else {
            return ''
          }
        } else {
          return v[j]
        }
      }))
    },
    minAmtChange (val) {
      this.search.start_work_price = val
    },
    maxAmtChange (val) {
      this.search.end_work_price = val
    },
    async getList () {
      this.listLoading = true
      const searchParams = Object.assign({}, this.search)
      if (this.dateRange && this.dateRange.length === 2) {
        const startDate = this.setDateFormat((isNaN(parseInt(this.dateRange[0])) ? this.dateRange[0] : new Date(parseInt(this.dateRange[0]))))
        const endDate = this.setDateFormat((isNaN(parseInt(this.dateRange[1])) ? this.dateRange[1] : new Date(parseInt(this.dateRange[1]))))
        searchParams.start_date = Math.floor(new Date(startDate).getTime() / 1000) + (new Date()).getTimezoneOffset() * 60
        searchParams.end_date = Math.floor(new Date(endDate).getTime() / 1000) + 86399 + (new Date()).getTimezoneOffset() * 60
      }
      if (searchParams.status.length === 0) {
        delete searchParams.status
      }
      if (searchParams.original_language === 0) {
        delete searchParams.original_language
      }
      if (searchParams.translate_language === 0) {
        delete searchParams.translate_language
      }
      if (searchParams.finish_work_type === 0) {
        delete searchParams.finish_work_type
      }
      if (searchParams.requesters.length === 0) {
        delete searchParams.requesters
      }
      if (searchParams.companies.length === 0) {
        delete searchParams.companies
      }
      if (searchParams.extras.length === 0) {
        delete searchParams.extras
      }
      try {
        const response = await this.$axios.post('/subtitle-history/get-admin-request-list', {
          table: this.table,
          search: searchParams
        })
        this.list = response.data.data.list
        this.list.unshift({
          duration_sum: response.data.data.duration_sum,
          jpy_price_sum: response.data.data.jpy_price_sum,
          krw_price_sum: response.data.data.krw_price_sum,
          usd_price_sum: response.data.data.usd_price_sum,
          total_work_price_sum: response.data.data.total_work_price_sum,
          tc_work_price_sum: response.data.data.tc_work_price_sum,
          translate_work_price_sum: response.data.data.translate_work_price_sum,
          review_work_price_sum: response.data.data.review_work_price_sum
        })
        this.total = response.data.data.totalCount
      } catch (err) {
        this.list = []
        this.total = 0
        console.log(err)
      } finally {
        this.listLoading = false
      }
    },
    priceTypeChange (priceType) {
      this.search.price_type = priceType
    },
    searchWordChanged (searchWord) {
      this.search.search_keyword = searchWord
    },
    optionChanged (option) {
      this.search.search_type = option
    },
    handleSearch () {
      this.table.page = 1
      this.getList()
    },
    keywordTypeChanged (keywordType) {
      this.search.keyword_type = keywordType
    },
    handleFilter (searchWord) {
      this.table.page = 1
      this.getList()
    },
    tableRowClassName ({ row, rowIndex }) {
      if (rowIndex === 0) {
        return 'sum-row'
      } else {
        return 'odd-row'
      }
    },
    childTableHeaderClassName ({ row, rowIndex }) {
      return 'child-table-header'
    },
    viewDetail (row) {
      const popupSize = 'width=' + this.variables.popupWidth + ',height=' + this.variables.popupHeight
      window.open('/caption/detail/' + row.work_no, '_blank', popupSize)
    },
    toggleExpand (row, index) {
      this.$store.dispatch('app/toggleRowExpand', index)
      this.$refs.captionList.toggleRowExpansion(row)
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.can_push {
  height: 32px;
  padding: 0px 20px;
}

.search-box {
  margin-bottom: $searchboxMgBottom;
  .filter-container {
    display: inline-flex;
    margin-bottom: $filterContainerMg;
    & > div {
      display: inline-flex;
      align-items: center;
      margin-right: $filterDivMgRight;
    }
  }
  .filter-container:nth-child(3) {
    margin-bottom: 0px;
  }
}
.period {
  .date-range-option {
    width: 160px;
    margin-right: 5px;
  }
  .period-options {
    width: 100px;
    margin-right: 5px;
  }
  .el-date-editor {
    width: 270px;
    margin-right: 30px;
  }
}

.work-finish-status {
  .el-select {
    width: 200px;
  }
}

.work-progress-status,
.select-company,
.select-requester,
.select-tc,
.select-translator,
.select-reviewer {
  .el-select {
    width: 220px;
  }
}
.other-option {
  .el-select {
    width: 250px;
  }
}
.original-language, .translate-language {
  .el-select {
    width: 140px;
  }
}

.btn-search {
  margin-right: 20px;
}

.table-card {
  .table-header {
    justify-content: flex-end;
  }
  .svg-icon {
    width: calc(#{$svgSize/1.5});
    height: calc(#{$svgSize/1.5});
    margin-right: 5px;
  }
  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  i {
    font-size: 18px;
  }
  .el-icon-document, .el-icon-circle-plus-outline {
    cursor: pointer;
  }
}
.youtube-icon {
  vertical-align: middle;
}
.company-detail, .requester-detail, .worker-detail {
  cursor: pointer;
}
.scene-file-info {
  cursor: pointer;
}
.requester-memo {
  white-space: nowrap;
}

::v-deep {
  .search-item .search-input {
    min-width: 240px;
    margin-right: 5px;
  }
  .edit-svg-icon {
    width: $editIconSize !important;
    height: $editIconSize !important;
    cursor: pointer;
    vertical-align: middle;
    margin-left: 5px;
  }
  .el-dialog__header { // dialog header background color
    background-color: $blue50;
  }
  .el-dialog__title {
    font-size: 18px;
    color: white;
  }
  .el-dialog__body {
    .el-input__inner {
      line-height: 1 !important;
    }
  }
  .el-dialog__headerbtn { // dialog close icon style
    font-size: 18px;
    font-weight: bold;
    .el-dialog__close {
      color: white;
    }
  }
  .worker-change-dialog {
    .el-dialog {
      width: 400px;
    }
    .el-select {
      width: 200px;
    }
    span.worker-type {
      min-width: 70px;
    }
  }
  .end-date-dialog {
    word-break: break-word;
    .el-dialog {
      width: 450px;
    }
    .el-input {
      min-width: 60px;
      margin-left: 5px;
      margin-right: 5px;
    }
    span {
      word-break: break-word;
      min-width: 50px;
      flex: none;
    }
  }
  .price-change-dialog {
    .el-dialog {
      width: 400px;
    }
    .el-input {
      width: 120px;
    }
  }
  .amount {
    .el-select {
      width: 140px !important;
    }
  }
  // hidden expand icon
  .table-card .expand-icon {
    div.cell {
      padding: 0px !important;
    }
  }
  .child-table-header {
    display: none;
  }
  td.el-table__expanded-cell {
    padding: 0px;
    .el-table__body-wrapper {
      overflow: hidden;
      .el-table__row {
        background: #f3f3f3;
      }
    }
  }
}
</style>
