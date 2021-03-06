import { reject } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import $ from 'jquery';

const TEMPLATE = hbs`
      <CommonActions::GetApi
        @request={{this.TestRequest}}
        @buttonClassNames={{this.buttonClassNames}}
        @beforeAction={{this.beforeAction}}
      >
        Get API
      </CommonActions::GetApi>
    `;
let Store;

module('Integration | Component | common actions/get api', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    Store = this.owner.lookup('service:store');
    this.TestRequestElide = Store.createFragment('bard-request-v2/request', {
      table: 'tableA',
      columns: [
        { field: 'datestamp', parameters: {}, type: 'timeDimension' },
        { field: 'userCount', parameters: {}, type: 'metric' }
      ],
      filters: [],
      sorts: [],
      requestVersion: '2.0',
      dataSource: 'elideOne'
    });

    this.TestRequestBard = Store.createFragment('bard-request-v2/request', {
      table: 'network',
      filters: [
        {
          type: 'timeDimension',
          field: 'network.dateTime',
          parameters: { grain: 'day' },
          operator: 'bet',
          values: ['current', 'next'],
          source: 'bardOne'
        }
      ],
      columns: [{ type: 'timeDimension', field: 'network.dateTime', parameters: { grain: 'day' }, source: 'bardOne' }],
      sorts: [],
      requestVersion: '2.0',
      dataSource: 'bardOne'
    });
  });

  test('Component renders', async function(assert) {
    assert.expect(1);

    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    assert.dom('.get-api').hasText('Get API', 'Component yields given text');
  });

  test('Custom button classes', async function(assert) {
    assert.expect(1);

    this.set('buttonClassNames', 'a-custom-class');
    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    assert.ok($('button').is('.a-custom-class'), 'Class names for the button element can be configured');
  });

  test('beforeAction', async function(assert) {
    assert.expect(3);

    this.set('beforeAction', () => {
      assert.step('beforeAction is called');
    });
    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    await click('.get-api > button');

    // Check if modal was opened
    if ($('.ember-modal-dialog').is(':visible')) {
      assert.step('Copy modal is opened');
    }

    assert.verifySteps(
      ['beforeAction is called', 'Copy modal is opened'],
      'beforeAction is called before modal is opened'
    );
  });

  test('beforeAction - prevent modal', async function(assert) {
    assert.expect(2);

    this.set('beforeAction', () => {
      assert.ok(true, 'Component can accept an extra action to run before opening the modal');

      return reject();
    });
    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    await click('.get-api > button');

    assert
      .dom('.ember-modal-dialog')
      .isNotVisible('Copy modal does not open if `beforeAction` returns a rejected promise');
  });

  test('Modal Bard', async function(assert) {
    assert.expect(5);

    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    assert.dom('.ember-modal-dialog').isNotVisible('Copy modal is not visible before clicking the component');

    await click('.get-api > button');

    assert.dom('.ember-modal-dialog').isVisible('Copy modal dialog pops up on clicking the component');

    assert
      .dom('.navi-modal__header--secondary')
      .hasText('Select the Copy button to copy to clipboard.', 'Secondary header is visible with instructions');

    assert
      .dom('.navi-modal__input')
      .hasValue(
        'https://data.naviapp.io/v1/data/network/day/?dateTime=current%2Fnext&metrics=&format=json',
        'Modal input box has link to the current page'
      );

    let buttons = findAll('.btn-container .btn');
    assert.deepEqual(
      buttons.map(el => el.textContent.trim()),
      ['Copy Link', 'Run API Query in New Tab', 'Cancel'],
      'Copy, New Tab, and Cancel buttons are rendered'
    );
  });

  test('Modal Elide', async function(assert) {
    assert.expect(5);

    this.set('TestRequest', this.TestRequestElide);
    await render(TEMPLATE);

    assert.dom('.ember-modal-dialog').isNotVisible('Copy modal is not visible before clicking the component');

    await click('.get-api > button');

    assert.dom('.ember-modal-dialog').isVisible('Copy modal dialog pops up on clicking the component');

    assert
      .dom('.navi-modal__header--secondary')
      .hasText('Select the Copy button to copy to clipboard.', 'Secondary header is visible with instructions');

    assert
      .dom('.navi-modal__input')
      .hasValue(
        '{"query":"{ tableA { edges { node { datestamp userCount } } } }"}',
        'Modal input box has link to the current page'
      );

    let buttons = findAll('.btn-container .btn');
    assert.deepEqual(
      buttons.map(el => el.textContent.trim()),
      ['Copy Link', 'Cancel'],
      'Copy, New Tab, and Cancel buttons are rendered'
    );
  });

  test('Copy Link Notification', async function(assert) {
    assert.expect(2);

    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    await click('.get-api > button');

    assert.dom('.modal-notification').isNotVisible('Copy notification is not visible before clicking copy button');

    // Click Copy Link
    await click($('.btn-container button:contains(Copy Link)')[0]);

    assert.dom('.modal-notification').isVisible('Copy notification message is shown after clicking copy button');
  });

  test('Cancel button', async function(assert) {
    assert.expect(3);

    this.set('TestRequest', this.TestRequestBard);
    await render(TEMPLATE);

    assert.dom('.ember-modal-dialog').isNotVisible('Copy modal is not visible before clicking the component');

    // Click component
    await click('.get-api > button');

    assert.dom('.ember-modal-dialog').isVisible('Copy modal dialog pops up on clicking the component');

    // Click Cancel
    await click($('.btn-container button:contains(Cancel)')[0]);

    assert.dom('.ember-modal-dialog').isNotVisible('Copy modal is closed after clicking cancel button');
  });
});
