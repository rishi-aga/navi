import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Unit | Service | navi-report-search-provider', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    // Load metadata needed for request fragment
    await this.owner.lookup('service:bard-metadata').loadMetadata();
    this.service = this.owner.lookup('service:navi-report-search-provider');
    const store = this.owner.lookup('service:store'),
      mockAuthor = store.createRecord('user', { id: 'navi_user' });
    this.owner.register(
      'service:user',
      Service.extend({
        getUser: () => mockAuthor
      })
    );
  });

  test('it exists', function(assert) {
    const service = this.owner.lookup('service:navi-report-search-provider');
    assert.ok(service);
  });

  test('construct full search query', function(assert) {
    assert.deepEqual(this.service._constructSearchQuery({ title: 'Hyrule', request: 'clicks' }, 'navi_user'), {
      filter: { reports: '(title==*Hyrule*,request==*clicks*);author==*navi_user*' }
    });
  });

  test('construct only query parameters search query', function(assert) {
    assert.deepEqual(this.service._constructSearchQuery({ title: 'Hyrule', request: 'clicks' }), {
      filter: { reports: '(title==*Hyrule*,request==*clicks*)' }
    });
  });

  test('construct only author search query', function(assert) {
    assert.deepEqual(this.service._constructSearchQuery(null, 'navi_user'), {
      filter: { reports: 'author==*navi_user*' }
    });
  });

  test('search by user', async function(assert) {
    const results = await this.service.search('Hyrule');
    const author = await results.get('firstObject.author.id');
    assert.ok(
      results.get('firstObject').title.includes('Hyrule'),
      'The service returns a report that includes the requested title.'
    );
    assert.ok(
      JSON.stringify(results.get('firstObject').request)
        .toLowerCase()
        .includes('click'),
      'The service returns a report that includes the requested request parameter.'
    );
    assert.ok(author.includes('navi_user'), 'The service returns a report from the requested user.');
  });

  test('search with no results for search parameters', async function(assert) {
    const results = await this.service.search('something');
    assert.equal(results.content.length, 0, 'No results are being returned');
  });

  test('search with empty parameters', async function(assert) {
    const results = await this.service.search();
    assert.equal(results.content.length, 0, 'No results are being returned');
  });
});