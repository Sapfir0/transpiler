import { lexer } from "./lexer.js"
import { parser } from "./parser.js"
import { transformer } from "./transformer.js";
import { codeGenerator } from "./code_generator.js";


export function compiler(input, lexTable, grammarTableInputLanguage, codeGeneratorTableOutputLanguage) {
    let tokens = lexer(input, lexTable);
    //console.log(tokens);
    let ast    = parser(tokens, grammarTableInputLanguage);
    console.log("получившиеся абстрактное синтаксическое дерево:");
    //console.log(ast);
    let newAst = transformer(ast);
    //console.log(newAst);
    let output = codeGenerator(newAst, codeGeneratorTableOutputLanguage, tokens[1], tokens[2]);

    //console.log(output);
    
      
    //console.log(func(256));     


    return output;
}





// function out(output) {
    
//     function func(x) {
//         var res;
//         res = 0;
//         if (x == 256) {
//         x = x + 10;
//         }
//         res = res - 1;
//         res += 1;
//         return x;
//         }
      
//     console.log(output);
//     console.log(func(256));
//     //alert(func(256));

//}
