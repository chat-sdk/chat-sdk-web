import * as angular from 'angular';
import { Observable, Subject } from 'rxjs';

import { ITabService } from './tab.service';

export interface ISearch {
  getQueryForActiveTab(): string;
  getQueryForTab(tabId: string): string;
  queryForActiveTabObservable(): Observable<string>;
  queryForTabObservable(tabId: string): Observable<string>;
  setQueryForActiveTab(query: string): void;
  setQueryForTab(tabId: string, query: string): void;
}

class Search implements ISearch {

  static $inject = ['TabService'];

  constructor(private TabService: ITabService) { }

  private queryForTabs: { [tabId: string]: string } = {};
  private queryForTabObservables: { [tabId: string]: Subject<string> } = {};

  queryForActiveTabObservable(): Observable<string> {
    return this.queryForTabObservable(this.TabService.getActiveTabForMainBox().id);
  }

  queryForTabObservable(tabId: string): Observable<string> {
    return this.queryForTabSubject(tabId).asObservable();
  }

  getQueryForActiveTab(): string {
    return this.getQueryForTab(this.TabService.getActiveTabForMainBox().id);
  }

  getQueryForTab(tabId: string): string {
    return this.queryForTabs[tabId];
  }

  setQueryForActiveTab(query: string) {
    this.setQueryForTab(this.TabService.getActiveTabForMainBox().id, query);
  }

  setQueryForTab(tabId: string, query: string) {
    this.queryForTabs[tabId] = query;
    this.queryForTabSubject(tabId).next(query);
  }

  private queryForTabSubject(tabId: string): Subject<string> {
    if (!this.queryForTabObservables[tabId]) {
      this.queryForTabObservables[tabId] = new Subject<string>();
    }
    return this.queryForTabObservables[tabId];
  }

}

angular.module('myApp.services').service('Search', Search);
