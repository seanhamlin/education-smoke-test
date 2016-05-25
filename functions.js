var fs = require('fs');
var utils = require('utils');

casper.options.verbose = true;
casper.options.logLevel = casper.cli.get("logLevel") || 'debug';
casper.options.exitOnError = false; // Keep going on error.
casper.options.timeout = 10 * 60 * 1000; // 10 minutes.
// Uncomment if you need jQuery for your tests.
//casper.options.clientScripts.push('js/jquery-2.2.4.min.js');
casper.options.pageSettings = {
  javascriptEnabled: true,
  loadImages: true,
  loadPlugins: false,
  userAgent: 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36'
};
casper.options.viewportSize = {
  width: 1280,
  height: 800
};

// Do not track CasperJS in GA.
casper.options.onResourceRequested = function(casper, requestData, request) {
  if (requestData.url.match(/google-analytics\.com/)) {
    casper.log('Request to GA. Aborting: ' + requestData.url, 'debug');
    request.abort();
  }
};

// HTML logging.
casper.on('open', function (location) {
  this.echo(location + ' opened');
});

// Catch JS errors on the page.
casper.on('page.error', function(msg, trace) {
  this.test.fail('JavaScript Error: ' + msg);
});

// Catch load errors for the page resources.
casper.on('resource.error', function(resourceError) {
  if (resourceError.url != "" &&
     !resourceError.url.match(/.*fonts\.net.*/) &&
     !resourceError.url.match(/.*pbs\.twimg\.com.*/) &&
     !resourceError.url.match(/.*twitter\.com.*/)
  ) {
    casper.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')', 'warning');
    casper.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString, 'warning');
  }
});

// Screenshot fails.
casper.on('step.error', function(failure) {
  this.capture('fail.png');
});

var site = casper.cli.get("site");
var timestamp = casper.cli.get("timestamp") || 1;


// Turn a (possibly) relative URI into a full RFC 3986-compliant URI
// With minor modifications, courtesy: https://gist.github.com/Yaffle/1088850
function absoluteUri(base, href) {

  // Parse a URI and return its constituent parts
  function parseUri(url) {
    var match = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
    return (match ? { href: match[0] || '', protocol: match[1] || '', authority: match[2] || '', host: match[3] || '', hostname: match[4] || '',
      port: match[5] || '', pathname: match[6] || '', search: match[7] || '', hash: match[8] || '' } : null);
  }

  // Resolve dots in the path
  function resolvePathDots(input) {
    var output = [];
    input.replace(/^(\.\.?(\/|$))+/, '')
      .replace(/\/(\.(\/|$))+/g, '/')
      .replace(/\/\.\.$/, '/../')
      .replace(/\/?[^\/]*/g, function (part) { part === '/..' ? output.pop() : output.push(part); });
    return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
  }

  // Parse base and href
  href = parseUri(href || '');
  base = parseUri(base || '');

  // Build and return the URI
  return !href || !base ? null : (href.protocol || base.protocol) +
  (href.protocol || href.authority ? href.authority : base.authority) +
  (resolvePathDots(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname))) +
  (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) + href.hash;

}

/**
 * Global pages tests, that are able to run on all valid Drupal pages.
 *
 * 9 test so far in here (with the caching tests commented out).
 */
function globalPageTests(casp) {
  casp.test.assertHttpStatus(200);
  casp.test.assertExists('title');
  casp.test.assertTitleMatch(/Department of Education and Training/, 'Found the site name in the title');
  casp.test.assertDoesntExist('.warning', 'No Drupal warnings found');
  casp.test.assertDoesntExist('.error', 'No Drupal errors found');
  casp.test.assertDoesntExist('.node-unpublished', 'No unpublished nodes found');
  casp.test.assertTextDoesntExist('PHP Fatal', 'No PHP fatals found');

  // GA tracker.
  casp.test.assertMatch(casp.getPageContent(), /.*UA-18570220-13.*/i, 'Found the Google Analytics tracker');

  // Try to find a fonts.com broken font banner.
  casp.test.assertDoesntExist('#mti_wfs_colophon', 'No fonts.com banner found');

  // Caching headers.
  //var foundCacheHeader = false;
  //casp.currentResponse.headers.forEach(function(header) {
  //  if (header.name == 'Cache-Control') {
  //    foundCacheHeader = true;
  //    casp.test.assertMatch(header.value, /public, max-age=\d{3,}/, 'Page is cacheable in Varnish');
  //    var cacheSecondsMatches = header.value.match(/max-age=(\d+)/);
  //    if (cacheSecondsMatches.length > 1) {
  //      var cacheSeconds = parseInt(cacheSecondsMatches[1], 10);
  //      if (cacheSeconds >= 300) {
  //        casp.test.pass('Page cache lifetime is >= than 5 minutes (' + cacheSeconds + ' seconds)');
  //      }
  //      else {
  //        casp.test.fail('Page cache lifetime is < than 5 minutes (' + cacheSeconds + ' seconds)');
  //      }
  //    }
  //  }
  //});
  //if (!foundCacheHeader) {
  //  casp.test.fail('Found no "Cache-Control" header');
  //  casp.test.fail('Page cache lifetime is < than 5 minutes');
  //}
}
