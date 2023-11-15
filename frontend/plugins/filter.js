import Vue from 'vue'
import moment from 'moment'

Vue.filter('date', (value) => {
  return moment(value * 1000).format('YYYY.MM.DD HH:mm:ss')
})

Vue.filter('notice_date', (value, lang) => {
  if (lang === 'jp') { lang = 'ja' } else if (lang === 'en') { lang = 'en-gb' } else if (lang === 'cn') { lang = 'ja' }
  return moment(value * 1000).format('YYYY.MM.DD') + '(' + moment(value * 1000).locale(lang).format('ddd') + ')'
})

/* Vue.filter('formatDuration', (value) => {
  console.log('format duration filter')
  if (!value) {
    return '0h 0m 0s'
  }
  const secNum = parseInt(value, 10) // don't forget the second param
  const hours = Math.floor(secNum / 3600)
  const minutes = Math.floor((secNum - (hours * 3600)) / 60)
  const seconds = secNum - (hours * 3600) - (minutes * 60)
  return hours + 'h ' + minutes + 'm ' + seconds + 's'
})
 */
Vue.filter('numberFormat', (value) => {
//  return value.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
  return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
})
