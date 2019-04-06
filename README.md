# conservative-normalize-url

> Normalize URLs conservatively, taking into account old specs to avoid breaking things.

## Background
I created this library, because I was frustrated by the lack of backwards-compatibility of existing URL normalizers. If you're normalizing a URL, it's likely you're dealing with a user-supplied URL. After working on software that handles bookmarks for a long time, I realized quite how diverse those can be. This is what I'm using now.

## What does it do?

* path normalization (`/foo//bar/../baz` => `/foo/baz`; when the protocol is known)
* url encoding non-ASCII characters and unprintable characters (including space)
* sorting query parameters
* punycode encoding domains
* omitting ports if the port is the default port for the given protocol

## What does it *not* do?

* omitting trailing slashes in paths
* omitting `www.`
* omitting any query parameters
* adding or changing the protocol
* removing the auth portion of the URL
* breaking URLs with use `;` as a query parameter separator

## Usage
```
const normalizeUrl = require('conservative-normalize-url')

normalizeUrl('HtTp://foobar.com/bla bla h/shake?this=öppa&oppa=this') // http://foobar.com/bla%20bla%20h/shake?oppa=this&this=%C3%B6ppa
```

## License
(c) Marcel Klehr
MIT License
