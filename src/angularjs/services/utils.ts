import { StringAnyObject } from '../interfaces/string-any-object';

export class Utils {

    static unORNull(object: any): boolean {
        return object === 'undefined' || object == null;
    }

    static empty(object: any[]): boolean {
        return this.unORNull(object) || object.length === 0;
    }

    static stopDefault(e: Event) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        else {
            window.event.returnValue = false;
        }
        return false;
    }

    static toObject(map: Map<string, any>): StringAnyObject {
        const obj = {};
        map.forEach((value: any, key: string) => {
            obj[key] = map.get(key);
        });
        return obj;
    }

    static sameMinute(date1: Date, date2: Date): boolean {
        return date1.getDay() == date2.getDay() &&
            date1.getHours() == date2.getHours() &&
            date1.getMinutes() == date2.getMinutes();
    }

}
