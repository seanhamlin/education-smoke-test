var fs = require('fs');
var utils = require('utils');

casper.options.verbose = true;
casper.options.logLevel = casper.cli.get("logLevel") || 'debug';
casper.options.exitOnError = false; // Keep going on error.
casper.options.timeout = 10 * 60 * 1000; // 10 minutes.
casper.options.clientScripts.push('js/jquery-2.1.4.min.js');
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
casper.on('resource.error', function(resource) {
  if (resource.url != "" &&
    !resource.url.match(/.*google-analytics\.com.*/) &&
    !resource.url.match(/.*fonts\.net.*/) &&
    !resource.url.match(/.*pbs\.twimg\.com.*/) &&
    !resource.url.match(/.*twitter\.com.*/)
  ) {
    this.echo(resource.url + " not found.", "RED_BAR");
  }
});

// Screenshot fails.
casper.on('step.error', function(failure) {
  this.capture('fail.png');
});

var site = casper.cli.get("site");
var timestamp = casper.cli.get("timestamp") || 1;


/**
 * Homepage tests.
 *
 * @see http://casperjs.readthedocs.org/en/latest/modules/tester.html
 */
casper.test.begin('Homepage', 11, function suite(test) {

  casper.start(site + '?' + timestamp, function() {
    this.echo(this.getTitle());
    globalPageTests(this);

    // Latest News block
    // #block-views-deewr-news-block-1
    test.assertSelectorHasText('#block-views-deewr-news-block-1 h2', 'Latest News');
    test.assertEvalEquals(function() {
      return $('#block-views-deewr-news-block-1 .news-block-title').length;
    }, 8, 'Found 8 news articles in the latest news block');
  });

  casper.run(function() {
    test.done();
  });

});
