import * as angular from 'angular';
import { Observable, Subject } from 'rxjs';

export interface ITab {
  activeTabForMainBoxObservable(): Observable<string>;
  activeTabForRoomObservable(rid: string): Observable<string>;
  getActiveTabForMainBox(): string;
  getActiveTabForRoom(rid: string): string;
  setActiveTabForMainBox(tab: string): void;
  setActiveTabForRoom(rid: string, tab: string): void;
}

class Tab implements ITab {

  private activeTabForMainBox: string;
  private activeTabForMainBoxSubject = new Subject<string>();
  private activeTabForRooms: { [rid: string]: string } = {};
  private activeTabForRoomSubjects: { [rid: string]: Subject<string> } = {};

  activeTabForMainBoxObservable(): Observable<string> {
    return this.activeTabForMainBoxSubject.asObservable();
  }

  activeTabForRoomObservable(rid: string): Observable<string> {
    return this.activeTabForRoomSubject(rid).asObservable();
  }

  getActiveTabForMainBox(): string {
    return this.activeTabForMainBox;
  }

  setActiveTabForMainBox(tab: string) {
    this.activeTabForMainBox = tab;
    this.activeTabForMainBoxSubject.next(tab);
  }

  getActiveTabForRoom(rid: string): string {
    return this.activeTabForRooms[rid];
  }

  setActiveTabForRoom(rid: string, tab: string) {
    this.activeTabForRooms[rid] = tab;
    this.activeTabForRoomSubject(rid).next(tab);
  }

  private activeTabForRoomSubject(rid: string): Subject<string> {
    if (!this.activeTabForRoomSubjects[rid]) {
      this.activeTabForRoomSubjects[rid] = new Subject<string>();
    }
    return this.activeTabForRoomSubjects[rid];
  }

}

angular.module('myApp.services').service('Tab', Tab);
