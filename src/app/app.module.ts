import { BrowserModule } from '@angular/platform-browser';
import { NgModule, DoBootstrap } from '@angular/core';
import { UpgradeModule } from '@angular/upgrade/static';

import './../angularjs/app/app';

import { AppComponent } from './app.component';
import { myApp } from '../angularjs/app/app';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    UpgradeModule,
  ],
  providers: [],
  // bootstrap: [AppComponent],
})
export class AppModule implements DoBootstrap {

  constructor(private upgrade: UpgradeModule) {
    console.log('Angular Running!')
  }

  ngDoBootstrap() {
    console.log('Bootstrap');
    this.upgrade.bootstrap(document.body, [myApp.name], { staticDi: true })
  }

}
