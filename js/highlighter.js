import {getDataFromServer} from "./server-helper.js";
// import {getDataFromServer} from "./server-helper";


export default function highlighter (element, configUrl)
{
    var codeText = element.textContent;
    getDataFromServer('./config/'+ configUrl, function (config){
     var resultCode = parser(config)(codeText)
     element.innerHTML = resultCode;

    }) ;


//старый добрый хайлайтер
    function parser(config){
         return function reducer(currentCode, resultCode = '')
        {
              if(currentCode === '')
                 return resultCode;
         for (var ruleName in config) {
             if (config.hasOwnProperty(ruleName)) {
                 var rule = config [ruleName];
                 var regexp = rule.regexp;
                 var result = regexp.exec(currentCode);
                 if(result) {
                   if ((rule.list != null && !rule.list.includes(result[1])))
                    continue; //
                     resultCode +=rule.color ? `<span style = "color:${rule.color}">${result[1]}</span>` :result[1];
                     currentCode = currentCode.replace(regexp, '');
                     return reducer(currentCode, resultCode)
                 }
             }
         }
        }


    }

}
