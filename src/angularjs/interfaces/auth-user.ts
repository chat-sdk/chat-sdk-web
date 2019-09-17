export interface IAuthUserData { 
    id: string;
    name: string;
    gender: string;
    profile_image_url: string;
    description: string;
    location: string;
    avatar_url: string;
    picture: string;
    [key: string]: any;
}

export interface IAuthUser extends firebase.User {
    provider?: string;
    thirdPartyData?: IAuthUserData;
    [key: string]: any;
}
