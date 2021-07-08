function mapAsync(array, callback) {
  return Promise.all(array.map(callback))
}

async function filterAsync(array, callback) {
  const filterMap = await mapAsync(array, callback)
  return array.filter((_, index) => filterMap[index])
}

module.exports = {
  filterAsync,
  mapAsync,
}
