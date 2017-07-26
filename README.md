# Chat SDK Web

### Running on a local server 

- In the termainal run `gulp` to start the Gulp script which will build the distribution and release versions of the app

- Inside the **app** directory run `bower install` to update the modules

- To test set your local web server to point to `app/dist`

- Add the web app in the Firebase dashboard and add the config details to the `index.html` file. For Social login, add your Facebook ID to the same file. Follow the Firebase instructions to [setup social login](https://firebase.google.com/docs/auth/web/start). 
