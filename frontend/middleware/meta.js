export default ({ store, route }) => {
  route.meta.map((meta) => {
    console.log(meta)
    if (meta && meta.icon !== undefined) {
      return meta
    }
    return ''
  })
}
