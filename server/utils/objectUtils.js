function assignIfDefined(target, source, fields) {
    for (const field of fields) {
      if (source[field] !== undefined) {
        target[field] = source[field];
      }
    }
  }
  
  module.exports = { assignIfDefined };
  