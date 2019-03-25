
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
let UsersPath = "users";
let UsersMetaPath = "users";
let RoomsPath = "threads";
let PublicRoomsPath = "public-threads";
let MessagesPath = 'messages';
let FlaggedPath = 'flagged';
let TypingPath = 'typing';
let FriendsPath = 'friends';
let BlockedPath = 'blocked';
let UpdatedPath = 'updated';
let OnlineUserCountKey = 'onlineUserCount';
let LastMessagePath = "lastMessage";
let FlaggedMessagesPath = "flagged";

let SenderEntityID = "sender-entity-id";
let CreatorEntityID = "creator-entity-id";

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
let roomCreatorEntityID = CreatorEntityID;

let ReadKey = 'read';
let DateKey = "date";
let MessageKey = "message";
let MetaKey = "meta";
let DetailsKey = "details";
let ImageKey = "image";
let TimeKey = "time";
let UserCountKey = "user-count";
let ConfigKey = "config";

let OnlineKey = "online";
let TypeKey = "type";

let UserName = "name";
let UserCountryCode = "country-code";
let UserLocation = "location";
let UserImageURL = "pictureURL";
let UserGender = "gender";
let UserStatus = "status";
let UserProfileLink = "profile-link";
let UserHomepageLink = "homepage-link";
let UserHomepageText = "homepage_text";
let UserProfileHTML = "profile-html";
let UserAllowInvites = "allow-invites";

// TODO:
let DefaultUserPrefix = "ChatSDK";

let UserStatusOwner = 'owner';
let UserStatusMember = 'member';
//let bUserStatusInvited = 'invited'; // Depricated
let bUserStatusClosed = 'closed';

//let RoomType1to1 = '1to1';
//let RoomTypeGroup = 'group';
//let RoomTypePublic = 'public';
//let RoomTypeInvalid = 'invalid';

let RoomTypeInvalid = 0x0;
let RoomTypeGroup = 0x1;
let RoomType1to1 = 0x2;
let RoomTypePublic = 0x4;

let RoomTypePrivateV3 = 0;
let RoomTypePublicV3 = 1;

let UserAllowInvitesEveryone = 'Everyone';
let UserAllowInvitesFriends = 'Friends';
let UserAllowInvitesNobody = 'Nobody';

// Tabs
let UsersTab = 'users';
let RoomsTab = 'rooms';
let FriendsTab = 'friends';
let InboxTab = 'inbox';
let MessagesTab = 'messages';

let ProviderTypeCustom = 'custom';

let ProfileSettingsBox = 'profileSettingsBox';
let LoginBox = 'loginBox';
let MainBox = 'mainBox';
let CreateRoomBox = 'createRoomBox';
let ErrorBox = 'errorBox';

let ShowProfileSettingsBox = 'showProfileSettingsBox';
let ShowCreateChatBox = 'showCreateChatBox';

let VisibilityChangedNotification = 'VisibilityChangedNotification';

let PublicRoomAddedNotification = 'PublicRoomAddedNotification';
let PublicRoomRemovedNotification = 'PublicRoomRemovedNotification';

let RoomAddedNotification = 'RoomAddedNotification';
let RoomRemovedNotification = 'RoomRemovedNotification';

let RoomOpenedNotification = 'RoomOpenedNotification';
let RoomClosedNotification = 'RoomClosedNotification';

let AnimateRoomNotification = 'AnimateRoomNotification';

let RoomUpdatedNotification = 'RoomUpdatedNotification';
let RoomPositionUpdatedNotification = 'RoomPositionUpdatedNotification';
let RoomSizeUpdatedNotification = 'RoomSizeUpdatedNotification';
let UpdateRoomActiveStatusNotification = 'UpdateRoomActiveStatusNotification';

let LazyLoadedMessagesNotification = 'LazyLoadedMessagesNotification';

let ChatUpdatedNotification = 'ChatUpdatedNotification';

let UserOnlineStateChangedNotification = 'UserOnlineStateChangedNotification';
let UserValueChangedNotification = 'UserValueChangedNotification';

let ScreenSizeChangedNotification = 'ScreenSizeChangedNotification';

let LoginCompleteNotification = 'LoginCompleteNotification';
let LogoutNotification = 'LogoutNotification';

let StartSocialLoginNotification = 'StartSocialLoginNotification';

let RoomFlashHeaderNotification = 'RoomFlashHeaderNotification';
let RoomBadgeChangedNotification = 'RoomBadgeChangedNotification';

let OnlineUserAddedNotification = 'OnlineUserAddedNotification';
let OnlineUserRemovedNotification = 'OnlineUserRemovedNotification';

let UserBlockedNotification = 'UserBlockedNotification';
let UserUnblockedNotification = 'UserUnblockedNotification';

let FriendAddedNotification = 'FriendAddedNotification';
let FriendRemovedNotification = 'FriendRemovedNotification';

let DeleteMessageNotification = 'DeleteMessageNotification';
let EditMessageNotification = 'EditMessageNotification';

let ConfigUpdatedNotification = "ConfigUpdatedNotification";

let LoginModeSimple = "simple";
// let bLoginModeSingleSignOn = "singleSignOn";
// let bLoginModeToken = "token";
let LoginModeAuthenticating = "authenticating";
let LoginModeClickToChat = "clickToChat";

let MessageTypeText = 0;
let MessageTypeLocation = 1;
let MessageTypeImage = 2;
let MessageTypeFile = 3;

// Chat width
let ChatRoomWidth = 230;
let ChatRoomHeight = 300;

let ChatRoomTopMargin = 60;
let ChatRoomSpacing = 15;

let MainBoxWidth = 250;
let MainBoxHeight = 300;

let RoomListBoxWidth = 200;
let RoomListBoxHeight = 300;

let ProfileBoxWidth = 300;

// Notifications

let NotificationTypeWaiting = 'waiting';
let NotificationTypeAlert = 'alert';
