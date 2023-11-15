const https = require('https');
import config from './../config/config';
//이메일
export const sendEmail = async(_receiveEmail: string, _systemLang: string, _emailTitle: string, _templateCode: string, _templateObj: Object) => {
    console.log("---- send Email Method ----")
    console.log("-receive email: " + _receiveEmail)
    console.log("-system language: " + _systemLang)
    console.log("-email title: " + _emailTitle)
    console.log("-Template Code: " + _templateCode)
    console.log("-Template Object: " + _templateObj)
    console.log(_templateObj)
}
//알림톡
export const sendTalk = async(_countryCode: number, _receiveMobile: string, _systemLang: string, _templateCode: string, _templateObj: Object ) => {
    console.log("---- send Talk Method ----")
    console.log("-country code: " + _countryCode)
    console.log("-receive mobile: " + _receiveMobile)
    console.log("-system language: " + _systemLang)
    console.log("-Template Code: " + _templateCode)
    console.log("-Template Object: " + _templateObj)
    console.log(_templateObj)
}
//SMS
export const sendSms = async(_countryCode: number, _receiveMobile: string, _systemLang: string, _smsMsg: string) => {
    console.log("---- send Sms Method ----")
    console.log("-country code: " + _countryCode)
    console.log("-receive mobile: " + _receiveMobile)
    console.log("-system language: " + _systemLang)
    console.log("-Sms Message: " + _smsMsg)
}
//WebPush
export const webPush = (include_external_user_ids: Array<string>, system_lang: string, msg: string) => {
    let data = {
        app_id: config.ONE_SIGNAL_APP_ID,
        "contents": {"en": msg , "kr": msg} ,
        include_external_user_ids: include_external_user_ids, 
        "headings": {"en": "[플리토 웹푸시]" , "kr": "[플리토 웹푸시]"} ,
        "data": {"page": "flitto"}
    }

    if (system_lang == 'KO')
        data.headings = { "en": "[플리토 웹푸시]", "kr": "[플리토 웹푸시]" }
    else if (system_lang == 'EN')
        data.headings = { "en": "[Flitto WebPush]", "kr": "[Flitto WebPush]" }
    else if (system_lang == 'CN')
        data.headings = { "en": "[Flitto 网络推送]", "kr": "[Flitto 网络推送]" }
    else
        data.headings = { "en": "[Flitto Webプッシュ]", "kr": "[Flitto Webプッシュ]" }
    
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic " + config.ONE_SIGNAL_AUTH
    };
    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    }
    var req = https.request(options, function(res: any) {
        res.on('data', function(data: any) {
            console.log("Response:", data);
       //     console.log(JSON.parse(data));
        });
    });
    req.on('error', function(e: any) {
        console.log("ERROR:");
        console.log(e);
    });
    req.write(JSON.stringify(data));
    req.end();
}
