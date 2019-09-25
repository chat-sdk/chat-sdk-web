import * as angular from 'angular';
import { Observable, Subject } from 'rxjs';

import { ITab } from './tab';

export interface ISearch {
  getQueryForActiveTab(): string;
  getQueryForTab(tab: string): string;
  queryForActiveTabObservable(): Observable<string>;
  queryForTabObservable(tab: string): Observable<string>
  setQueryForActiveTab(query: string): void;
  setQueryForTab(tab: string, query: string): void;
}

class Search implements ISearch {

  constructor(private Tab: ITab) { }

  private queryForTabs: { [tab: string]: string } = {};
  private queryForTabObservables: { [tab: string]: Subject<string> } = {};

  queryForActiveTabObservable(): Observable<string> {
    return this.queryForTabObservable(this.Tab.getActiveTabForMainBox());
  }

  queryForTabObservable(tab: string): Observable<string> {
    return this.queryForTabSubject(tab).asObservable();
  }

  getQueryForActiveTab(): string {
    return this.getQueryForTab(this.Tab.getActiveTabForMainBox());
  }

  getQueryForTab(tab: string): string {
    return this.queryForTabs[tab];
  }

  setQueryForActiveTab(query: string) {
    this.setQueryForTab(this.Tab.getActiveTabForMainBox(), query);
  }

  setQueryForTab(tab: string, query: string) {
    this.queryForTabs[tab] = query;
    this.queryForTabSubject(tab).next(query);
  }

  private queryForTabSubject(tab: string): Subject<string> {
    if (!this.queryForTabObservables[tab]) {
      this.queryForTabObservables[tab] = new Subject<string>();
    }
    return this.queryForTabObservables[tab];
  }

}

angular.module('myApp.services').service('Search', Search);
