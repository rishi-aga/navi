/**
 * Copyright 2018, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import { A as arr } from '@ember/array';
import { run } from '@ember/runloop';
import { searchRecords } from 'navi-core/utils/search';

export default Route.extend({
  /**
   * @property { Service } user
   */
  user: inject(),

  /**
   * @method _searchItems
   * @private
   * Search and rank through items when a search query is available
   * @param {Array} items 
   * @param {String} queryString - search query
   */
  _searchItems(items, queryString) {
    return queryString.length ? searchRecords(items, queryString, 'title') : items;
  },

  /**
   * @method _fetchItems
   * @private
   * @param {Object} user 
   * @param {Object} queryParams - all directory query params 
   */
  async _fetchItems(user, { type, filter, sortBy, q }){
    let reports,
        dashboards,
        items = arr();

    if(type === null || type === 'reports'){
      reports = filter === 'favorites' ? await get(user, 'favoriteReports') : await get(user, 'reports');
      run(() => items.push(...reports.toArray()));
    }
    if(type === null || type === 'dashboards'){
      await run(async () => {
        dashboards = filter === 'favorites' ? await get(user, 'favoriteDashboards') : await get(user, 'dashboards');
        items.push(...dashboards.toArray())
      });
    }

    items = this._searchItems(items, q);

    return arr(items).sortBy(sortBy);
  },

  /**
   * @method model
   * @override
   */
  model() {
    let user = get(this, 'user').getUser(),
        directoryParams = this.paramsFor('directory');

    return this._fetchItems(user, directoryParams);
  }
});
