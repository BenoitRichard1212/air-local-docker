/**
 * Removes slashes at the BEGINNING of a string
 *
 * @param {string} string The string to remove slashes from
 */
function unleadingslashit (string) {
  return string.replace(/^\/+/g, '')
}

/**
 * Removes slashes at the END of a string
 *
 * @param {string} string The string to remove slashes from
 */
function untrailingslashit (string) {
  return string.replace(/\/$/, '')
}

/**
 * Removes slashes from beginning and end of a string
 *
 * @param {string} string The string to remove slashes from
 */
function removeEndSlashes (string) {
  return unleadingslashit(untrailingslashit(string))
}

/**
 * Check if required field is empty and return message
 *
 * @param {*} value
 * @returns {string|boolean}
 */
function validateNotEmpty (value) {
  return value.trim().length !== 0 ? true : 'This field is required'
}

/**
 * Logic for validating yes or no questions
 *
 * @param {*} value
 * @returns {*}
 */
function validateBool (value) {
  var y = new RegExp(/^y(es)?$/i)
  var n = new RegExp(/^no?$/i)

  if (typeof value !== 'string') {
    return value
  }

  if (value.match(y) !== null) {
    return 'true'
  } else if (value.match(n) !== null) {
    return 'false'
  }

  return value
}

/**
 * Not foolproof, but should catch some more common issues with entering hostnames
 *
 * @param {string} value
 * @returns string
 */
function parseHostname (value) {
  // Get rid of any http(s):// prefix
  value = value.replace(/^https?:\/\//i, '')

  // Get rid of any spaces
  value = value.replace(/\s/i, '')

  const parts = value.split('/')

  const hostname = parts[0]

  return hostname
}

/**
 * Check to make sure proxy URLs have a protcol attached
 *
 * @param  {string} value Proxy URL to check against
 * @return {string} The validated/modified proxy URL
 */
function parseProxyUrl (value) {
  const re = /^https?:\/\//i

  if (value.length > 3 && !re.test(value)) {
    value = 'http://' + value
  }

  return removeEndSlashes(value)
}

module.exports = {
  parseProxyUrl,
  parseHostname,
  validateBool,
  validateNotEmpty,
  removeEndSlashes,
  unleadingslashit,
  untrailingslashit
}
