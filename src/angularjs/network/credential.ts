import * as angular from 'angular'

export interface ICredential {
    customToken(token: string): ICredential;
    emailAndPassword(email: string, password: string): ICredential;
    getEmail(): string;
    getPassword(): string;
    getToken(): string;
    getType(): string;
}

export enum CredentialType {
    Email = 'email',
    Facebook = 'facebook',
    Twitter = 'twitter',
    Google = 'google',
    Github = 'github',
    Anonymous = 'anonymous',
    CustomToken = 'custom',
}

class Credential implements ICredential {

    email: string;
    password: string;
    type: CredentialType;
    token: string;

    emailAndPassword(email: string, password: string): ICredential {
        this.email = email;
        this.password = password;
        this.type = CredentialType.Email;
        return this;
    }

    facebook(): ICredential {
        this.type = CredentialType.Facebook;
        return this;
    }

    twitter(): ICredential {
        this.type = CredentialType.Twitter;
        return this;
    }

    google(): ICredential {
        this.type = CredentialType.Google;
        return this;
    }

    github(): ICredential {
        this.type = CredentialType.Github;
        return this;
    }

    anonymous(): ICredential {
        this.type = CredentialType.Anonymous;
        return this;
    }

    customToken(token: string): ICredential {
        this.token = token;
        this.type = CredentialType.CustomToken;
        return this;
    }

    getEmail(): string {
        return this.email;
    }

    getPassword(): string {
        return this.password;
    }

    getToken(): string {
        return this.token;
    }

    getType(): CredentialType {
        return this.type;
    }

}

angular.module('myApp.services').service('Credential', Credential);
