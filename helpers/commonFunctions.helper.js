const processInBatchesWithLimit = async (items, callback, concurrency = 5) => {
  const pool = [];
  for (const item of items) {
    pool.push(callback(item));

    if (pool.length >= concurrency) {
      await Promise.all(pool);
      pool.length = 0;
    }
  }
  if (pool.length) {
    await Promise.all(pool);
  }
};

module.exports = {
  processInBatchesWithLimit
};
