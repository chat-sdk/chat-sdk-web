
let DEBUG = false;
let FIREBASE_REF_DEBUG = false;

let RoomDefaultNameEmpty = "Empty Chat";
let RoomDefaultName1To1 = "Private Chat";
let RoomDefaultNameGroup = "Group Chat";
let RoomDefaultNamePublic = "Public Chat";

let DefaultAvatarProvider = "http://flathash.com";

let Minute = 60;
let Hour = Minute * 60;
let Day = Hour * 24;

// Last visited
// Show the click to chat box if the user has visited more than x hours
let LastVisitedTimeout = Hour;

// Paths
let bUsersPath = "users";
let bUsersMetaPath = "users";
let bRoomsPath = "threads";
let bPublicRoomsPath = "public-threads";
let bMessagesPath = 'messages';
let bFlaggedPath = 'flagged';
let bTypingPath = 'typing';
let bFriendsPath = 'friends';
let bBlockedPath = 'blocked';
let bUpdatedPath = 'updated';
let bOnlineUserCountKey = 'onlineUserCount';
let bLastMessagePath = "lastMessage";
let bFlaggedMessagesPath = "flagged";
let bCreatorEntityID = "creator-entity-id";
let bDate = "date";
let bMessage = "message";
let bSenderEntityID = "sender-entity-id";

let messageUID = "user-firebase-id";
//let messageRID = "rid";
let messageType = "type";
let messagePayload = "payload";
let messageTime = "date";
let messageJSON = "JSON";
let messageJSONv2 = "json_v2";
let messageUserName = "userName";
let messageUserFirebaseID = "user-firebase-id";

// JSON Keys
let messageText = "text";
let messageFileURL = "file-url";
let messageImageURL = "image-url";
let messageMimeType = "mime-type";
let messageThumbnailURL = "thumbnail-url";

let messageImageWidth = "image-width";
let messageImageHeight = "image-height";

let userUID = "uid";

let roomCreated = "creation-date";
let roomRID = "rid";
let roomUserCreated = "userCreated";
let roomName = "name";
let roomInvitesEnabled = "invitesEnabled";
let roomDescription = "description";
let roomWeight = "weight";
let roomType = "type_v4";
let roomTypeV3 = "type";
let roomCreatorEntityID = bCreatorEntityID;



let bReadKey = 'read';

let bMetaKey = "meta";
let bDetailsKey = "details";
let bImageKey = "image";
let bTimeKey = "time";
let bUserCountKey = "user-count";
let bConfigKey = "config";

let bOnlineKey = "online";
let bTypeKey = "type";

let bUserName = "name";
let bUserCountryCode = "country-code";
let bUserLocation = "location";
let bUserImageURL = "pictureURL";
let bUserGender = "gender";
let bUserStatus = "status";
let bUserProfileLink = "profile-link";
let bUserHomepageLink = "homepage-link";
let bUserHomepageText = "homepage_text";
let bUserProfileHTML = "profile-html";
let bUserAllowInvites = "allow-invites";

// TODO:
let bDefaultUserPrefix = "ChatSDK";

let bUserStatusOwner = 'owner';
let bUserStatusMember = 'member';
//let bUserStatusInvited = 'invited'; // Depricated
let bUserStatusClosed = 'closed';

//let bRoomType1to1 = '1to1';
//let bRoomTypeGroup = 'group';
//let bRoomTypePublic = 'public';
//let bRoomTypeInvalid = 'invalid';

let bRoomTypeInvalid = 0x0;
let bRoomTypeGroup = 0x1;
let bRoomType1to1 = 0x2;
let bRoomTypePublic = 0x4;

let bRoomTypePrivateV3 = 0;
let bRoomTypePublicV3 = 1;

let bUserAllowInvitesEveryone = 'Everyone';
let bUserAllowInvitesFriends = 'Friends';
let bUserAllowInvitesNobody = 'Nobody';

// Tabs
let bUsersTab = 'users';
let bRoomsTab = 'rooms';
let bFriendsTab = 'friends';
let bInboxTab = 'inbox';
let bMessagesTab = 'messages';

let bProviderTypeCustom = 'custom';

let bProfileSettingsBox = 'profileSettingsBox';
let bLoginBox = 'loginBox';
let bMainBox = 'mainBox';
let bCreateRoomBox = 'createRoomBox';
let bErrorBox = 'errorBox';

let bShowProfileSettingsBox = 'showProfileSettingsBox';
let bShowCreateChatBox = 'showCreateChatBox';

let bVisibilityChangedNotification = 'bVisibilityChangedNotification';

let bPublicRoomAddedNotification = 'bPublicRoomAddedNotification';
let bPublicRoomRemovedNotification = 'bPublicRoomRemovedNotification';

let bRoomAddedNotification = 'bRoomAddedNotification';
let bRoomRemovedNotification = 'bRoomRemovedNotification';

let bRoomOpenedNotification = 'bRoomOpenedNotification';
let bRoomClosedNotification = 'bRoomClosedNotification';

let bAnimateRoomNotification = 'bAnimateRoomNotification';

let bRoomUpdatedNotification = 'bRoomUpdatedNotification';
let bRoomPositionUpdatedNotification = 'bRoomPositionUpdatedNotification';
let bRoomSizeUpdatedNotification = 'bRoomSizeUpdatedNotification';
let bUpdateRoomActiveStatusNotification = 'bUpdateRoomActiveStatusNotification';

let bLazyLoadedMessagesNotification = 'bLazyLoadedMessagesNotification';

let bChatUpdatedNotification = 'bChatUpdatedNotification';

let bUserOnlineStateChangedNotification = 'bUserOnlineStateChangedNotification';
let bUserValueChangedNotification = 'bUserValueChangedNotification';

let bScreenSizeChangedNotification = 'bScreenSizeChangedNotification';

let bLoginCompleteNotification = 'bLoginCompleteNotification';
let bLogoutNotification = 'bLogoutNotification';

let bStartSocialLoginNotification = 'bStartSocialLoginNotification';

let bRoomFlashHeaderNotification = 'bRoomFlashHeaderNotification';
let bRoomBadgeChangedNotification = 'bRoomBadgeChangedNotification';

let bOnlineUserAddedNotification = 'bOnlineUserAddedNotification';
let bOnlineUserRemovedNotification = 'bOnlineUserRemovedNotification';

let bUserBlockedNotification = 'bUserBlockedNotification';
let bUserUnblockedNotification = 'bUserUnblockedNotification';

let bFriendAddedNotification = 'bFriendAddedNotification';
let bFriendRemovedNotification = 'bFriendRemovedNotification';

let bDeleteMessageNotification = 'bDeleteMessageNotification';
let bEditMessageNotification = 'bEditMessageNotification';

let bConfigUpdatedNotification = "bConfigUpdatedNotification";

let LoginModeSimple = "simple";
// let bLoginModeSingleSignOn = "singleSignOn";
// let bLoginModeToken = "token";
let LoginModeAuthenticating = "authenticating";
let LoginModeClickToChat = "clickToChat";

let bMessageTypeText = 0;
let bMessageTypeLocation = 1;
let bMessageTypeImage = 2;
let bMessageTypeFile = 3;

// Chat width
let bChatRoomWidth = 230;
let bChatRoomHeight = 300;

let bChatRoomTopMargin = 60;
let bChatRoomSpacing = 15;

let bMainBoxWidth = 250;
let bMainBoxHeight = 300;

let bRoomListBoxWidth = 200;
let bRoomListBoxHeight = 300;

let bProfileBoxWidth = 300;

// Notifications

let NotificationTypeWaiting = 'waiting';
let NotificationTypeAlert = 'alert';
