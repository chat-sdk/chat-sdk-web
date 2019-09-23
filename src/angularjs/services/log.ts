import * as Defines from '../keys/defines';

export class Log {
  public static notification(notification, context) {
    if (Defines.DEBUG) {
      if (!context) {
        context = ''
      } else {
        context = ', context: ' + context
      }
      console.log('Notification: ' + notification + context)
    }
  }
}
