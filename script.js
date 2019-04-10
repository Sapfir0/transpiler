import { getDataFromServer } from "./js/server-helper.js"
import { compiler } from "./js/compiler/compiler.js"
import { lexer } from "./js/compiler/lexer.js"
import { parser } from "./js/compiler/parser.js"

import { printProductionTable, printNontermsTable, printTermsTable, printDrevoVuvoda } from "./js/kyrsach_generation/kyrsuch_print.js";
import highlighter from "./js/highlighter.js";


document.addEventListener('DOMContentLoaded', main);

function main() {
    //тупо особенность работы функции гетДата
    getDataFromServer("./config/lexem-table.json", get_lexer);
    function get_lexer(lexTable) {
        getDataFromServer("./config/grammar-table.json", get_grammar);
        function get_grammar(grammarTable) {
            getDataFromServer("./config/codogeneration-table.json", get_codegen);
            function get_codegen(codTable) {
                
                //// работа с ui
                var out = compiler(document.querySelector('code.nemerle-language').textContent, lexTable, grammarTable, codTable);
                document.querySelector('code.javascript-language').innerHTML = out;
                const script = document.createElement('script')
                script.innerHTML = out;
                script.async = true;
                document.head.appendChild(script);

//только мы берем не функ, а разбиваем строку скрипт и берем оттуда второе слово
                //var reg = /function\s+\w+/ ;
                //var promStr = out;               
                //promStr = promStr.slice(9,13); //да, это делает то, о чем ты думаешь ы
                //document.getElementById('nameOfFunc231').innerHTML = promStr;
               
                window.oninput = function oninputValue() {
                    var value = document.getElementById('input').value;
                    var functionName = document.getElementById('input2').value;
                    //console.log( functionName, value );
                    var result = (new Function(`return ${functionName}(${value})`))();

                    document.getElementById('res').innerHTML = result;
                }
                //highlighter
                highlighter(document.querySelector('code.nemerle-language'), 'lexem-table_nem.json');
                highlighter(document.querySelector('code.javascript-language'), 'lexem-table_nem.json');

                //печатаем визуальное дерево с помощью стандартных библиотек

                printProductionTable(grammarTable); printNontermsTable(grammarTable); printTermsTable(grammarTable);
                printDrevoVuvoda(parser(lexer(document.querySelector('code.nemerle-language').textContent, lexTable), grammarTable, true));
            }
        }
    }
}



// var app = new Vue( {
//     el: '#automatic',
    
//     data: {
//         //message: '254'
//     }
    

// })