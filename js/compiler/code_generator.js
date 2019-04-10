/**
 * 
 * @param {in} derevo           синтаксическое дерево, полученное из файла parser.js 
 * @param {in} generationTable  кодогенерейшн-тейбл
 * @param {in} arrayOfIdent     объяснение
 * @param {in} arrayOfConst 
 * Рекурсивно обходим дерево, собираем наши идентификаторы и константы в строку, и оборачивает
 * необходимые нетерминалы указанные в кодогенерейшн-тейбл
 */
export function codeGenerator(derevo, generationTable, arrayOfIdent, arrayOfConst) {

    function walk(vetochka) {

        var output = "";

        for (var i in vetochka) { //обходим дерево
            if (typeof(vetochka[i]) == 'object') 
            {
                var str = ''; //выходной код
                var obj = vetochka[i]; //нетерминалы
                //console.log(obj);
                var obertka = generationTable[obj["type"]];
                if (obertka) //оборачиваем из таблицы кода
                {
                    if (obertka["before"]) 
                        str += obertka["before"]; 

                    if (obj.value) 
                    {
                        if (obj.type == "<value_id>") //если перед нами идентификатор 
                        {
                            //console.log(arrayOfIdent[obj.value[1]]); //идентификаторы
                            //console.log(arrayOfConst[obj.value[1]]); //константы
                            str += arrayOfIdent[obj.value[1]];
                        } else if (obj["type"] == "<value_num>") { //если константа
                            str += arrayOfConst[obj.value[1]];
                        } 
                    }
                    //console.log(str);
                    if (obj.body) 
                        str += walk(obj.body);

                    if (obertka["after"]) //что нам добавлять после терминала
                        str += obertka["after"];//можем обойтись без пустых терминалов в транслятор тейбл
                }
                else {
                    str += walk(obj.body);
                }
                output += str;
                
            }
        }

        return output; //конец
    }

    return walk(derevo);
}