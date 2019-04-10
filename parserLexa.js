/****************************************************************************************
Построить синтаксическое дерево по массиву токенов и грамматике
arrayOfTokens - исходная строка

configURL - адрес, по которому брать файл с грамматикой

PRINT_PROCESS_OF_DERIVATION – печатать ли в консоль процесс вывода цепочки

OUTPUT_DERIVATION – если установлено, то на выходе будет массив из дерева и применённых правил

PRINT_TERMINALS – при печати вывода цепочки печатать ли «вывод» терминалов

PRINT_EPSILONS – у нетерминалов, выводящихся «в никуда», ставит эпсилон в правой части правила

GENERATE_CODE – генерировать код вместо дерева
*/
function parser(arrayOfTokens, configURL,
    PRINT_PROCESS_OF_DERIVATION = true,
    OUTPUT_DERIVATION = false,
    PRINT_TERMINALS = false,
    PRINT_EPSILONS = false,
    GENERATE_CODE = false)
{
    var config = getDataFromServer(configURL);
    var startStack = ["@программа@"];
    var currentIndex = 0;
    var output = [];
    var generatedCode = [];

    try {
        var ast = startRecursiveParse(startStack);
    }
    catch (error) {
        ast = error;
    }
    if (PRINT_PROCESS_OF_DERIVATION)
        console.log(output.join("\n"));

    if (GENERATE_CODE)
        return generatedCode.join(" ");
    if (OUTPUT_DERIVATION)
        return ([ast, output.join("\n")]);
    else
        return ast;

    function startRecursiveParse(expectationStack) {
        var currentStackSymbol;
        var currentToken;
        var localAst = [];
        while (expectationStack.length) {

            currentToken = arrayOfTokens[currentIndex];
            currentStackSymbol = expectationStack.pop();

            if (currentStackSymbol[0] == '$') // текущий символ – действие
            {
                var temp = currentStackSymbol.slice(1);

                if (temp == 'id' ||  temp == 'const')
                {
                    if (typeof(currentToken)!='object')
                    {
                        console.log("Ошибка при генерации кода: ожидался ", temp, ", а было получено ", currentToken)
                        throw 5;
                    }
                    else
                        temp = currentToken[1];
                }

                generatedCode.push(temp);
            }
            else if (currentStackSymbol[0] != '@') {// если текущий символ – терминал                     
                if (currentToken == currentStackSymbol ||
                    currentToken[0] == 'ident' && currentStackSymbol == 'id'||
                    currentToken[0].match(/.*?_const/) && currentStackSymbol == 'const')
                    {
                        if (PRINT_TERMINALS)
                        {
                            if (currentToken != currentStackSymbol)
                                output.push(currentStackSymbol + " → " + currentToken[1]);
                            else 
                                output.push(currentToken);
                        }
                        currentIndex += 1;
                        localAst.push({"type" : currentStackSymbol,
                            "body" : currentToken});
                    }
                else {
                    console.log("Ошибка: неожиданный терминал: "  + currentToken + 
                    ",хотя должен был быть: " + currentStackSymbol);
                    console.log("Содержимое стека: " + expectationStack);
                    console.log("Остаток массива токенов: " + arrayOfTokens.slice(currentIndex, -1));

                    console.log("Текущий индекс: ", currentIndex);
                    console.log(ast);
                    throw 0;
                }
            }
            else {// текущий символ – нетерминал
                if (currentToken[0] == 'ident')
                    currentToken = 'id';
                    
                if (currentToken[0].match(/.*?_const/))
                    currentToken = 'const';

                if (config[currentStackSymbol] !== undefined) {
                    if (config[currentStackSymbol][currentToken] !== undefined) 
                    {
                        var production = config[currentStackSymbol][currentToken];
                        if (production.length==0 && PRINT_EPSILONS)
                            output.push(currentStackSymbol.replace(/@(.*?)@/g,"<$1>") + " → ε");
                        else
                            output.push(currentStackSymbol.replace(/@(.*?)@/g,"<$1>") + " → " + production.join(" ").replace(/@(.*?)@/g,"<$1>"));

                        if (typeof(production) == 'object') 
                        {
                            // копируем массив продукций
                            // без этого массив правил будет изменяться
                            production = production.slice();

                            var newStack = [];
                            while (production.length)
                                newStack.push(production.pop());

                            localAst.push({"type" : currentStackSymbol,
                                        "body" : startRecursiveParse(newStack)});

                        }
                        else {
                            console.log("Ошибка: неверное правило. Правая часть не является массивом: " + currentStackSymbol + " " + production);
                            console.log(ast);
                            throw 2;
                        }
                    }
                    else if (config[currentStackSymbol]["EMPTY PRODUCTIONS"] !== undefined && 
                            config[currentStackSymbol]["EMPTY PRODUCTIONS"].indexOf(currentToken)!=-1)
                    {
                        if (PRINT_EPSILONS)
                            output.push(currentStackSymbol.replace(/@(.*?)@/g,"<$1>") + " → ε");
                        else
                            output.push(currentStackSymbol.replace(/@(.*?)@/g,"<$1>") + " →   ");
                    }
                    else {                
                        console.log("Ошибка: для сочетания терминала и нетерминала не задано правило: " + currentToken + " " + currentStackSymbol);
                        console.log(ast);
                        throw 3;
                    }
                }
                else {
                    console.log("Ошибка: не удается найти правило для нетерминала: " + currentStackSymbol);
                    console.log(ast);
                    throw 4;
                }  
            }
        }
        if (currentIndex > arrayOfTokens.length) throw 5;
        return localAst;
    }


}