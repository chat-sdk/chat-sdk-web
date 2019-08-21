import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setAngularJSGlobal } from '@angular/upgrade/static'
import * as angular from 'angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setAngularJSGlobal(angular);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
