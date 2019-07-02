const FirebaseConfig = {
    apiKey: "AIzaSyASm9RYrr3u_Bc22eglk0OtsC2GnnTQp_c",
    authDomain: "chat-sdk-v4.firebaseapp.com",
    databaseURL: "https://chat-sdk-v4.firebaseio.com",
    projectId: "chat-sdk-v4",
    storageBucket: "chat-sdk-v4.appspot.com",
    messagingSenderId: "1088435112418"
};

export const ChatSDKConfig = {

    firebaseConfig: FirebaseConfig,

    rootPath: 'modules_test_june_19',

    facebookAppID: '735373466519297',

    cloudImageToken: 'cag084en',

    // This defaults to 5 minutes min 2 minutes, max 15 minutes
    inactivityTimeout: 5,

    // 1) 24hour - show time in 24 hour format
    clockType: '24hour',

    // Users can create public chat rooms?
    // If this is true users will be able to setup new
    // public rooms
    usersCanCreatePublicRooms: true,

    // Allow anonymous login?
    anonymousLoginEnabled: true,

    // Enable social login - please email us to get your domain whitelisted
    socialLoginEnabled: false,

    // The URL to contact for single sign on
    singleSignOnURL: '',

    environment: 'test',

    imageMessagesEnabled: true,

    fileMessagesEnabled: true,

    hideMainBox: false,

    // resourceRootURL: 'http://test.com',
};

