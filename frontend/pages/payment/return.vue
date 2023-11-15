<template>
  <div></div>
</template>
<script>
export default {
  layout: 'detail',
  mounted () {
    self.close()
    self.opener.document.getElementById('btnPayReturn').click()
  }
}
</script>
