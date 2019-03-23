const punycode = require('punycode')

const SCHEMES = [
  'http',
  'https',
  'ftp',
  'sftp',
  'file',
  'gopher',
  'imap',
  'mms',
  'news',
  'nntp',
  'telnet',
  'prospero',
  'rsync',
  'rtsp',
  'rtspu',
  'svn',
  'git',
  'ws',
  'wss'
]
const DEFAULT_SCHEME = {}

const SCHEME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const IP_CHARS = '0123456789.:'
const DEFAULT_PORT = {
  http: '80',
  https: '443',
  ws: '80',
  wss: '443',
  ftp: '21',
  sftp: '22',
  ldap: '389'
}
const QUOTE_EXCEPTIONS = {
  path: ' /?+#',
  query: ' &=+#',
  fragment: ' +#'
}

/**
 * @brief Normalize Url
 * @param string url Url to load and analyze
 * @return string Normalized url;
 */
module.exports = function(input_url) {
  let url = input_url
  while (~' \t\n'.indexOf(url[0])) url = url.substr(1)
  while (~' \t\n'.indexOf(url[url.length - 1])) {
    url = url.substr(0, url.length - 1)
  }
  if (url === '') {
    return ''
  }
  const parts = split(url)

  let netloc
  let path

  if (parts['scheme'] && parts['scheme'].length > 0 || parts['scheme'] == DEFAULT_SCHEME) {
    netloc = parts['netloc']
    if (~SCHEMES.indexOf(parts['scheme'])) {
      path = normalize_path(parts['path'])
    } else {
      path = parts['path']
    }
    // url is relative, netloc (if present) is part of path
  } else {
    netloc = parts['path']
    path = ''
    let pos
    if ((pos = netloc.indexOf('/')) !== -1) {
      const newnetloc = netloc.substr(0, pos)
      path_raw = netloc.substr(pos + 1)
      netloc = newnetloc
      path = normalize_path('/' + path_raw)
    }
  }
  let [username, password, host, port] = split_netloc(netloc)
  host = normalize_host(host)
  port = normalize_port(parts['scheme'], port)
  let query = normalize_query(parts['query'])
  let fragment = normalize_fragment(parts['fragment'])
  return construct({
    scheme: parts['scheme'],
    username: username,
    password: password,
    host: host,
    port: port,
    path: path,
    query: query,
    fragment: fragment
  })
}

function construct(parts) {
  let url = ''

  if (parts['scheme'].length > 0) {
    if (~SCHEMES.indexOf(parts['scheme'])) {
      url += parts['scheme'] + '://'
    } else {
      url += parts['scheme'] + ':'
    }
  }else if (parts['scheme'] === DEFAULT_SCHEME) {
    url += '//'
  }
  if (parts['username'].length > 0 && parts['password'].length > 0) {
    url += parts['username'] + ':' + parts['password'] + '@'
  } else if (parts['username'].length > 0) {
    url += parts['username'] + '@'
  }
  if (parts['scheme'] && !parts['host']) {
    throw new Error('URIError')
  }
  url += parts['host']
  if (parts['port'].length > 0) {
    url += ':' + parts['port']
  }
  if (parts['path'].length > 1 || parts['query'].length > 0 || parts['fragment'] > 0) {
    url += parts['path']
  }
  if (parts['query'].length > 0) {
    url += '?' + parts['query']
  }
  if (parts['fragment'].length > 0) {
    url += '#' + parts['fragment']
  }
  return url
}

function normalize_host(host) {
  if (~host.indexOf('xn--')) {
    return host
  }
  return punycode.toASCII(host)
}

function normalize_port(scheme, port) {
  if (!scheme) {
    return port
  }
  if (port && port != DEFAULT_PORT[scheme]) {
    return port
  }
  return ''
}

function normalize_path(path) {
  if (~['//', '/', ''].indexOf(path)) {
    return '/'
  }
  let npath = get_absolute_path(unquote(path, QUOTE_EXCEPTIONS['path']))
  if (path[path.length - 1] === '/' && npath != '/') {
    npath += '/'
  }
  return npath
}

function get_absolute_path(path) {
  const parts = path.split('/').filter(part => part.length)
  const absolutes = []
  for (let part of parts) {
    if ('.' == part) {
      continue
    }
    if ('..' == part) {
      absolutes.pop()
    } else {
      absolutes.push(part)
    }
  }
  return '/' + absolutes.join('/')
}

function normalize_query(query) {
  if (query === '' || query.length <= 2) {
    return ''
  }
  const nquery = unquote(query, QUOTE_EXCEPTIONS['query'])
  if (~nquery.indexOf(';') && !~nquery.indexOf('&')) {
    return nquery
  }
  const params = nquery.split('&')
  const nparams = []
  for (let param of params) {
    if (~param.indexOf('=')) {
      let k = param.substr(0, param.indexOf('='))
      let v = param.substr(param.indexOf('=') + 1)
      nparams.push(k + '=' + v)
    } else {
      nparams.push(param)
    }
  }
  nparams.sort()
  return nparams.join('&')
}

function normalize_fragment(fragment) {
  return unquote(fragment, QUOTE_EXCEPTIONS['fragment'])
}

function unquote(text, exceptions = []) {
  let r = ''
  let k = 0
  while (k < text.length) {
    let c = text[k]
    let s
    if (c !== '%') {
      if (c.charCodeAt(0) >= 128 || c.charCodeAt(0) <= 32 || (!(/[a-zA-Z0-9]/).test(c) && !~exceptions.indexOf(c))) {
        s = encodeURIComponent(c)
      } else {
        s = c
      }
    } else {
      let start = k
      if (k + 2 >= text.length) throw new Error('URIError')
      if (
        !~'0123456789abcdef'.indexOf(text[k + 1].toLowerCase()) ||
        !~'0123456789abcdef'.indexOf(text[k + 2].toLowerCase())
      ) {
        throw new Error('URIError')
      }
      let b = parseInt(text[k + 1] + text[k + 2], 16)
      k += 2
      if (b <= 32) {
        // noop
        s = text.substr(start, k - start + 1)
      } else if ((b & (1 << 7)) === 0) {
        c = String.fromCharCode(b)
        if (!~exceptions.indexOf(c)) {
          s = c
        } else {
          s = text.substr(start, k - start + 1)
        }
      } else {
        let n = 0
        while (((b << n) & 0x80) !== 0) n++
        if (n === 1 || n > 4) {
          throw new Error('URIError')
        }
        let octets = new Uint8Array(n)
        octets[0] = b
        if (k + 3 * (n - 1) > text.length) {
          throw new Error('URIError')
        }
        let j = 1
        while (j < n) {
          k++
          if (text[k] !== '%') {
            throw new Error('URIError')
          }
          if (
            !~'01234567889abcdef'.indexOf(text[k + 1].toLowerCase()) ||
            !~'0123456789abcdef'.indexOf(text[k + 2].toLowerCase())
          ) {
            throw new Error('URIError')
          }
          let b = parseInt(text[k + 1] + text[k + 2], 16)
          k += 2
          octets[j] = b
          j++
        }
        // we don't actually decode this here, we just validate
        s = text.substr(start, k - start + 1)
      }
    }
    r += s
    k++
  }
  return r
}

function split(url) {
  let scheme = ''
  let netloc = ''
  let path = ''
  let query = ''
  let fragment = ''
  let rest = ''

  const ip6_start = url.indexOf('[')
  let scheme_end = url.indexOf(':')
  if (
    !~ip6_start !== false &&
    !~scheme_end !== false &&
    ip6_start < scheme_end
  ) {
    scheme_end = -1
  }
  if(url.substr(0,2) === '//'){
    scheme = DEFAULT_SCHEME
    rest = url.substr(2)
  }
  if (!scheme && scheme_end > 0) {
    for (let i = 0; i < scheme_end; i++) {
      const c = url[i]
      if (!~SCHEME_CHARS.indexOf(c)) {
        break
      } else {
        scheme = url.substr(0, scheme_end).toLowerCase()
        rest = url.substr(scheme_end)
        // ltrim ':/'
        while (~':/'.indexOf(rest[0])) rest = rest.substr(1)
      }
    }
  }
  if (!scheme){
    rest = url
  }
  let l_path = rest.indexOf('/')
  let l_query = rest.indexOf('?')
  let l_frag = rest.indexOf('#')
  if (l_path > 0) {
    if (l_query > 0 && l_frag > 0) {
      netloc = rest.substr(0, l_path)
      path = rest.substr(l_path, Math.min(l_query, l_frag) - l_path)
    } else if (l_query > 0) {
      if (l_query > l_path) {
        netloc = rest.substr(0, l_path)
        path = rest.substr(l_path, l_query - l_path)
      } else {
        netloc = rest.substr(0, l_query)
        path = ''
      }
    } else if (l_frag > 0) {
      netloc = rest.substr(0, l_path)
      path = rest.substr(l_path, l_frag - l_path)
    } else {
      netloc = rest.substr(0, l_path)
      path = rest.substr(l_path)
    }
  } else {
    if (l_query > 0) {
      netloc = rest.substr(0, l_query)
    } else if (l_frag > 0) {
      netloc = rest.substr(0, l_frag)
    } else {
      netloc = rest
    }
  }
  if (l_query > 0) {
    if (l_frag > 0) {
      query = rest.substr(l_query + 1, l_frag - (l_query + 1))
    } else {
      query = rest.substr(l_query + 1)
    }
  }
  if (l_frag > 0) {
    fragment = rest.substr(l_frag + 1)
  }
  if (!scheme) {
    path = netloc + path
    netloc = ''
  }
  return {
    scheme: scheme,
    netloc: netloc,
    path: path,
    query: query,
    fragment: fragment
  }
}

function _clean_netloc(netloc) {
  // rtrim(netloc, '.:')
  while (~'.:'.indexOf(netloc[netloc.length - 1])) {
    netloc = netloc.substr(0, netloc.length - 1)
  }
  return netloc.toLowerCase()
}

function split_netloc(input_netloc) {
  let username = ''
  let password = ''
  let host = ''
  let port = ''
  let netloc = input_netloc
  if (~netloc.indexOf('@')) {
    const user_pw = netloc.substr(0, netloc.indexOf('@'))
    netloc = netloc.substr(netloc.indexOf('@') + 1)
    if (~user_pw.indexOf(':')) {
      username = user_pw.substr(0, user_pw.indexOf(':'))
      password = user_pw.substr(user_pw.indexOf(':') + 1)
    } else {
      username = user_pw
    }
  }
  netloc = _clean_netloc(netloc)
  if (~netloc.indexOf(':') && netloc[netloc.length - 1] !== ']') {
    host = netloc.substr(0, netloc.indexOf(':'))
    port = netloc.substr(netloc.indexOf(':') + 1)
  } else {
    host = netloc
  }
  return [username, password, host, port]
}
