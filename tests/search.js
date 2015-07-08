/**
 * Homepage tests.
 *
 * @see http://casperjs.readthedocs.org/en/latest/modules/tester.html
 */
casper.test.begin('Search results', 13, function suite(test) {

  casper.start(site + 'search/site/English?' + timestamp, function() {
    this.echo(this.getTitle());
    globalPageTests(this);

    // Search form.
    test.assertExists('#search-form');
    test.assertVisible('#search-form .form-item-keys label');
    test.assertVisible('#search-form .form-item-keys input[name=keys]');

    // Search results.
    test.assertEvalEquals(function() {
      return $('ol.search-results h3.title').length;
    }, 15, 'Found 15 search results');
  });

  casper.run(function() {
    test.done();
  });

});
