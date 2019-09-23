import { IFirebaseConfig } from '../interfaces/firebase-config';
import { IChatSDKConfig } from '../interfaces/chat-sdk-config';

const FirebaseConfig: IFirebaseConfig = {
  apiKey: 'AIzaSyASm9RYrr3u_Bc22eglk0OtsC2GnnTQp_c',
  authDomain: 'chat-sdk-v4.firebaseapp.com',
  databaseURL: 'https://chat-sdk-v4.firebaseio.com',
  projectId: 'chat-sdk-v4',
  storageBucket: 'chat-sdk-v4.appspot.com',
  messagingSenderId: '1088435112418',
};

export const ChatSDKConfig: IChatSDKConfig = {
  firebaseConfig: FirebaseConfig,
  rootPath: '111_web_aug_19',
  facebookAppID: '735373466519297',
  cloudImageToken: 'cag084en',
  inactivityTimeout: 5,
  clockType: '24hour',
  usersCanCreatePublicRooms: true,
  anonymousLoginEnabled: true,
  socialLoginEnabled: false,
  singleSignOnURL: '',
  environment: 'test',
  imageMessagesEnabled: true,
  fileMessagesEnabled: true,
  hideMainBox: false,
  showOnPaths: null,
  resourceRootURL: null,
};
