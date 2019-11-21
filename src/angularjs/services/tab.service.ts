import * as angular from 'angular';
import { Observable, Subject } from 'rxjs';

export interface ITab {
  id: string;
  label: string;
  title?: string;
}

export interface ITabService {
  activeTabForMainBoxObservable(): Observable<ITab>;
  activeTabForRoomObservable(rid: string): Observable<ITab>;
  getActiveTabForMainBox(): ITab;
  getActiveTabForRoom(rid: string): ITab;
  getMainBoxTabForID(tabId: string): ITab;
  getRoomTabForID(tabId: string): ITab;
  setActiveTabForMainBox(tab: ITab): void;
  setActiveTabForRoom(rid: string, tab: ITab): void;
}

class TabService implements ITabService {

  // Default MainBox Tabs
  readonly mainBoxUsersTab: ITab;
  readonly mainBoxRoomsTab: ITab;
  readonly mainBoxInboxTab: ITab;
  readonly mainBoxFriendsTab: ITab;
  readonly defaultMainBoxTabs: ITab[];

  // Default Room Tabs
  readonly roomMessagesTab: ITab;
  readonly roomUsersTab: ITab;
  readonly roomSettingsTab: ITab;
  readonly defaultRoomTabs: ITab[];

  private activeTabForMainBox: ITab;
  private activeTabForMainBoxSubject = new Subject<ITab>();
  private activeTabForRooms: { [rid: string]: ITab } = {};
  private activeTabForRoomSubjects: { [rid: string]: Subject<ITab> } = {};

  constructor() {
    this.mainBoxUsersTab = {
      id: 'users',
      label: 'USERS',
      title: 'Who\'s online',
    };
    this.mainBoxRoomsTab = {
      id: 'rooms',
      label: 'ROOMS',
      title: 'Chat rooms',
    };
    this.mainBoxInboxTab = {
      id: 'inbox',
      label: 'INBOX',
      title: 'Inbox',
    };
    this.mainBoxFriendsTab = {
      id: 'friends',
      label: 'FRIENDS',
      title: 'My friends',
    };
    this.defaultMainBoxTabs = [
      this.mainBoxUsersTab,
      this.mainBoxRoomsTab,
      this.mainBoxInboxTab,
      this.mainBoxFriendsTab,
    ];

    this.roomMessagesTab = {
      id: 'messages',
      label: 'Messages',
    };
    this.roomUsersTab = {
      id: 'users',
      label: 'Users',
    };
    this.roomSettingsTab = {
      id: 'settings',
      label: 'Settings',
    };
    this.defaultRoomTabs = [
      this.roomMessagesTab,
      this.roomUsersTab,
      this.roomSettingsTab,
    ];
  }

  activeTabForMainBoxObservable(): Observable<ITab> {
    return this.activeTabForMainBoxSubject.asObservable();
  }

  activeTabForRoomObservable(rid: string): Observable<ITab> {
    return this.activeTabForRoomSubject(rid).asObservable();
  }

  getActiveTabForMainBox(): ITab {
    return this.activeTabForMainBox;
  }

  setActiveTabForMainBox(tab: ITab) {
    this.activeTabForMainBox = tab;
    this.activeTabForMainBoxSubject.next(tab);
  }

  getActiveTabForRoom(rid: string): ITab {
    return this.activeTabForRooms[rid];
  }

  setActiveTabForRoom(rid: string, tab: ITab) {
    this.activeTabForRooms[rid] = tab;
    this.activeTabForRoomSubject(rid).next(tab);
  }

  getMainBoxTabForID(tabId: string): ITab {
    for (const tab of this.defaultMainBoxTabs) {
      if (tab.id === tabId) {
        return tab;
      }
    }
  }

  getRoomTabForID(tabId: string): ITab {
    for (const tab of this.defaultRoomTabs) {
      if (tab.id === tabId) {
        return tab;
      }
    }
  }

  private activeTabForRoomSubject(rid: string): Subject<ITab> {
    if (!this.activeTabForRoomSubjects[rid]) {
      this.activeTabForRoomSubjects[rid] = new Subject<ITab>();
    }
    return this.activeTabForRoomSubjects[rid];
  }

}

angular.module('myApp.services').service('TabService', TabService);
