
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';


export interface Location {
    lng: Double;
    lat: Double;
    alt?: Double;
};

export interface ResponseBase {
    uuid: string;
    nativeNodeHandle: Int32;
};

export interface ErrorBase {
    nativeStackAndroid?: any[];
    userInfo: {
        errorMsg: string;
    };
    code?: string;
};
