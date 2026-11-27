// Return a new object containing only the listed keys that exist on obj
module.exports = (obj, keys) => {
  const result = {};
  if (!obj || typeof obj !== 'object') return result;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};
