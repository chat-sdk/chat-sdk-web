import * as angular from 'angular'

angular.module('myApp.services', []).value('version', '0.1');

// Entity
import '../entities/message'
import '../entities/room'
import '../entities/user'

// Services
import '../services/array-utils'
import '../services/before-unload'
import '../services/cloud-image'
import '../services/config'
import '../services/entity'
import '../services/environment'
import '../services/log'
import '../services/marquee'
import '../services/partials'
import '../services/path-analyser'
import '../services/room-open-queue'
import '../services/room-position-manager'
import '../services/screen'
import '../services/sound-effects'
import '../services/state-manager'
import '../services/time'
import '../services/upgrade'
import '../services/utils'
import '../services/visibility'
import '../services/emoji'

// Persistence
import '../persistence/cache'
import '../persistence/local-storage'
import '../persistence/room-store'
import '../persistence/user-store'
import '../persistence/web-storage'

// Network
import '../network/auth'
import '../network/auto-login'
import '../network/credential'
import '../network/firebase-upload-handler'
import '../network/network-manager'
import '../network/paths'
import '../network/presence'
import '../network/single-sign-on'

// Connectors
import '../connectors/friend-connector'
import '../connectors/online-connector'
import '../connectors/public-rooms-connector'