import { DEBUG } from '../keys/defines';

export class Log {

  public static notification(notification: string, context: string) {
    if (DEBUG) {
      if (!context) {
        context = ''
      } else {
        context = ', context: ' + context
      }
      console.log('Notification: ' + notification + context)
    }
  }

}
