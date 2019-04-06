import test from 'ava';
import normalizeUrl from '.';

test('main', t => {
	t.is(normalizeUrl('sindresorhus.com'), 'sindresorhus.com');
	t.is(normalizeUrl('sindresorhus.com '), 'sindresorhus.com');
	t.is(normalizeUrl('sindresorhus.com.'), 'sindresorhus.com');
	t.is(normalizeUrl('HTTP://sindresorhus.com'), 'http://sindresorhus.com');
	t.is(normalizeUrl('//sindresorhus.com'), '//sindresorhus.com');
	t.is(normalizeUrl('http://sindresorhus.com'), 'http://sindresorhus.com');
	t.is(normalizeUrl('http://sindresorhus.com:80'), 'http://sindresorhus.com');
	t.is(normalizeUrl('https://sindresorhus.com:443'), 'https://sindresorhus.com');
	t.is(normalizeUrl('ftp://sindresorhus.com:21'), 'ftp://sindresorhus.com');
	t.is(normalizeUrl('http://www.sindresorhus.com'), 'http://www.sindresorhus.com');
	t.is(normalizeUrl('www.com'), 'www.com');
	t.is(normalizeUrl('http://www.www.sindresorhus.com'), 'http://www.www.sindresorhus.com');
	t.is(normalizeUrl('www.sindresorhus.com'), 'www.sindresorhus.com');
	t.is(normalizeUrl('http://sindresorhus.com/foo/'), 'http://sindresorhus.com/foo/');
	t.is(normalizeUrl('sindresorhus.com/?foo=bar baz'), 'sindresorhus.com/?foo=bar%20baz');
	//t.is(normalizeUrl('https://foo.com/https://bar.com'), 'https://foo.com/https://bar.com');
	//t.is(normalizeUrl('https://foo.com/https://bar.com/foo//bar'), 'https://foo.com/https://bar.com/foo/bar');
	//t.is(normalizeUrl('https://foo.com/http://bar.com'), 'https://foo.com/http://bar.com');
	//t.is(normalizeUrl('https://foo.com/http://bar.com/foo//bar'), 'https://foo.com/http://bar.com/foo/bar');
	t.is(normalizeUrl('https://foo.com/?foo=http://bar.com'), 'https://foo.com/?foo=http%3A%2F%2Fbar.com');
	t.is(normalizeUrl('http://sindresorhus.com/%7Efoo/'), 'http://sindresorhus.com/~foo/', 'decode URI octets');
	t.is(normalizeUrl('http://sindresorhus.com/foo/######/blablabla'), 'http://sindresorhus.com/foo/######/blablabla', 'fragments');
  t.is(normalizeUrl('https://mylink.com/#/#/#/#/#/'), 'https://mylink.com#/#/#/#/#/')
  t.is(normalizeUrl('http://google.com####/foobar'), 'http://google.com####/foobar')
	t.is(normalizeUrl('http://sindresorhus.com/?'), 'http://sindresorhus.com');
	t.is(normalizeUrl('http://êxample.com'), 'http://xn--xample-hva.com');
	t.is(normalizeUrl('http://sindresorhus.com/?b=bar&a=foo'), 'http://sindresorhus.com/?a=foo&b=bar');
	t.is(normalizeUrl('http://sindresorhus.com/?foo=bar*|<>:"'), 'http://sindresorhus.com/?foo=bar*%7C%3C%3E%3A%22');
	t.is(normalizeUrl('http://sindresorhus.com:5000'), 'http://sindresorhus.com:5000');
	t.is(normalizeUrl('//sindresorhus.com:80/'), '//sindresorhus.com:80');
	t.is(normalizeUrl('http://sindresorhus.com/foo#bar'), 'http://sindresorhus.com/foo#bar');
	t.is(normalizeUrl('http://sindresorhus.com/foo/bar/../baz'), 'http://sindresorhus.com/foo/baz');
	t.is(normalizeUrl('http://sindresorhus.com/foo/bar/./baz'), 'http://sindresorhus.com/foo/bar/baz');
	//t.is(normalizeUrl('sindre://www.sorhus.com'), 'sindre://sorhus.com');
	//t.is(normalizeUrl('sindre://www.sorhus.com/'), 'sindre://sorhus.com');
	//t.is(normalizeUrl('sindre://www.sorhus.com/foo/bar'), 'sindre://sorhus.com/foo/bar');
	t.is(normalizeUrl('https://i.vimeocdn.com/filter/overlay?src0=https://i.vimeocdn.com/video/598160082_1280x720.jpg&src1=https://f.vimeocdn.com/images_v6/share/play_icon_overlay.png'), 'https://i.vimeocdn.com/filter/overlay?src0=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F598160082_1280x720.jpg&src1=https%3A%2F%2Ff.vimeocdn.com%2Fimages_v6%2Fshare%2Fplay_icon_overlay.png');

  // authorization
	t.is(normalizeUrl('https://user:password@www.sindresorhus.com'), 'https://user:password@www.sindresorhus.com');
	t.is(normalizeUrl('https://user:password@www.sindresorhus.com/@user'), 'https://user:password@www.sindresorhus.com/%40user');
	t.is(normalizeUrl('http://user:password@www.êxample.com'), 'http://user:password@www.xn--xample-hva.com');
	//t.is(normalizeUrl('sindre://user:password@www.sorhus.com'), 'sindre://user:password@www.sorhus.com');

	// query params
	t.is(normalizeUrl('http://sindresorhus.com/?a=Z&b=Y&c=X&d=W'), 'http://sindresorhus.com/?a=Z&b=Y&c=X&d=W');
	t.is(normalizeUrl('http://sindresorhus.com/?b=Y&c=X&a=Z&d=W'), 'http://sindresorhus.com/?a=Z&b=Y&c=X&d=W');
	t.is(normalizeUrl('http://sindresorhus.com/?a=Z&d=W&b=Y&c=X'), 'http://sindresorhus.com/?a=Z&b=Y&c=X&d=W');

	// encoding
	t.is(normalizeUrl('http://sindresorhus.com/foo%0cbar/?a=Z&d=W&b=Y&c=X%0c'), 'http://sindresorhus.com/foo%0cbar/?a=Z&b=Y&c=X%0c&d=W');
});

test('invalid urls', t => {
	t.throws(() => {
		normalizeUrl('http://');
	}, 'URIError');
});

test('remove duplicate pathname slashes', t => {
	t.is(normalizeUrl('http://sindresorhus.com////foo/bar'), 'http://sindresorhus.com/foo/bar');
	t.is(normalizeUrl('http://sindresorhus.com////foo////bar'), 'http://sindresorhus.com/foo/bar');
	t.is(normalizeUrl('//sindresorhus.com//foo'), '//sindresorhus.com//foo'); // cannot normalize path if we don't know the protocol
	t.is(normalizeUrl('http://sindresorhus.com:5000///foo'), 'http://sindresorhus.com:5000/foo');
	t.is(normalizeUrl('http://sindresorhus.com///foo'), 'http://sindresorhus.com/foo');
	t.is(normalizeUrl('http://sindresorhus.com:5000//foo'), 'http://sindresorhus.com:5000/foo');
	t.is(normalizeUrl('http://sindresorhus.com//foo'), 'http://sindresorhus.com/foo');
});
