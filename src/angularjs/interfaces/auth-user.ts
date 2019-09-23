export interface IAuthUserData {
  [key: string]: any;
  avatar_url: string;
  description: string;
  gender: string;
  id: string;
  location: string;
  name: string;
  picture: string;
  profile_image_url: string;
}

export interface IAuthUser extends firebase.User {
  provider?: string;
  thirdPartyData?: IAuthUserData;
  [key: string]: any;
}
