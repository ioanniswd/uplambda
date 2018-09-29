"use strict";

module.exports = function(lambda_name) {
  // make camelCase without spaces and underscores
  return lambda_name
    .split(/[_\s]+/)
    .map(str => {
      const tmp = str.split('');

      if (tmp.length > 0) tmp[0] = tmp[0].toUpperCase();

      return tmp.join('');
    })
    .join('')
    .trim();
};
