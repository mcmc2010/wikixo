import warehouse from 'warehouse';
import { moment } from '../../plugins/helper/date';
declare class SchemaTypeMoment extends warehouse.SchemaType<moment.Moment> {
    options: any;
    constructor(name: any, options?: {});
    cast(value?: any, data?: any): any;
    validate(value: any, data?: any): any;
    match(value: any, query: any, data?: any): boolean;
    compare(a?: any, b?: any): number;
    parse(value?: any): moment.Moment;
    value(value?: any, data?: any): any;
    q$day(value: any, query: any, data?: any): boolean;
    q$month(value: any, query: any, data?: any): boolean;
    q$year(value: any, query: any, data?: any): boolean;
    u$inc(value: any, update: any, data?: any): any;
    u$dec(value: any, update: any, data?: any): any;
}
export = SchemaTypeMoment;
