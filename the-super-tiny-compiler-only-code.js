'use strict';

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                  ТОКЕНИЗЕР!
 * ============================================================================
 */

/**
 * Мы начнём с первого этапа парсинга - лексического анализа и токенизера.
 *
 * Нам надо просто брать строки кода и разбивать их на массивы токенов
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// Начнём с того что будем принимать строку кода, и устанавливать две переменные:
function tokenizer(input) {

  // Переменная с `текущим` значением для отслеживания нешего положения.
  // Что-то вроде курсора для кода.
  let current = 0;

  // И массив токенов, чтобы их туда складывать.
  let tokens = [];

  // Начнём с создания `while` цикла, в котором мы будем инкрементить нашу 
  // переменную `current`когда захочем.
  //
  // Мы делаем так (вместо for(...)), потому что нам может понадобится инкремент этой перменной
  // несколько раз за один прогон цикла, потому что наши токены могут иметь любую длину
  while (current < input.length) {

    // Так же мы будем хранить текущий символ в переменной `input`.
    let char = input[current];

    // Первое что мы хотим проверять - это открытая круглая (парная) скобка.
    // В дальшейшем это будет использоваться для `CallExpression`, но сейчас
    // мы заботимся просто о символе
    //
    // Проверяем если попали на открытую скобку:
    if (char === '(') {

      // Если да - создаём новый токен с типом `paren`, и ставим скобку
      // в качестве значения
      tokens.push({
        type: 'paren',
        value: '(',
      });

      // Инкрементим `current`
      current++;

      // И начинаем наш цикл по-новому (переходим к следующему символу, новая итерация цикла)
      continue;
    }

    // Теперь мы хочем проверять закрывающую скобку. 
    // Делаем то же самое, что и прежде: проверяем на скобку, добавляем новый токен,
    // инкрементим `current` и запускаем следующую итерацию цикла
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // Двигаясь дальше, нам надо находить пробелы. Это интересный момент, так как
    // пробелы вроде как нужны для разделения символов, но для нас не особо важно
    // хранить их как токены. Мы просто выкинем их позже
    //
    // Так что мы просто проверяем существование, и если находим - сразу идём 
    // к следующему символу (новая итерация цикла)
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // Следующий тип токена это число. Это отличается от того, что мы видели раньше,
    // потому что число может иметь разное количество символов, и мы хотим собирать
    // всю последовательность в один токен
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        Это всего два токена
    //
    // Начнём когда столкнёмся с первым элементом последовательности (с цифрой)
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // Создадим переменную `value` в которую будем складывать символы
      let value = '';

      // Пойдём в цикле по всем следующим символам пока не столкнёмся
      // с символом который не является цифрой. При проходе будем складывать каждый 
      // символ (цифру) в `value`, и инкрементить `current`
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // После этого добавляем наш токен типа `number` в массив токенов
      tokens.push({ type: 'number', value });

      // И продолжаем
      continue;
    }

    // Так же мы добавим в наш язык поддержку строк, которые будут представлять
    // собой любой текст окружённый двойными кавычками
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ Строковые токены
    //
    // Начнём с проверки на открывающую кавычку
    if (char === '"') {
      // Создадим `value` для сборки нашего строчного токена
      let value = '';

      // Пропустим открывающую кавычку
      char = input[++current];

      // И теперь будем проходить по всем символам и добавлять их, пока не 
      // дойдём до закрывающей кавычки
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // Пропускаем её (закрывающую кавычку)
      char = input[++current];

      // И добавляем наш `string` токен в массив
      tokens.push({ type: 'string', value });

      continue;
    }

    // Последним типом токенов будет тип `name`. Это последовательность
    // букв (вместо цифр как в числе), которые означают имена функций в нашем
    // LISP синтаксисе
    //
    //   (add 2 4)
    //    ^^^
    //    Токен типа `name`
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // И снова - мы просто проходим по всем символам и добавляем их в 
      // итоговое значение
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // Потом добавляем типа `name` в массив, и продолжаем
      tokens.push({ type: 'name', value });

      continue;
    }

    // В конце концов, если мы до этого момента не определили символ - 
    // выбрасываем ошибку и выходим
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // Это конец нашего `токенизера` - просто возвращаем массив токенов.
  return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                   ПАРСЕР!!!
 * ============================================================================
 */

/**
 * В нашем парсере мы возьмём массив токенов и превратим его в абстрактное 
 * синтаксическое дерево (AST)
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// Итак, обьявим функцию `parser` которая будет принимать массив токенов
function parser(tokens) {

  // И снова - используем переменную `current` в качестве курсора
  let current = 0;

  // Но в этот раз мы будем использовать рекурсию, вместо `while` цикла.
  // Поэтому обьявляем функцию `walk`
  function walk() {

    // Внутри функции начнём с того что достанем текущий токен
    let token = tokens[current];

    // Мы будем обрабатывать разные типы токенов разными способами
    // Начнём с типа `number`
    //
    // Проверяем видим ли мы токен типа `number`
    if (token.type === 'number') {

      // Если да - инкрементируем `current`
      current++;

      // И возвращаем новую AST-ноду типа `NumberLiteral`, со значением которое
      // возьмём из токена
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // Если у нас строка - делаем то же самое, только с `StringLiteral` нодой
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // Дальше будем искать CallExpressions. Мы начнём работать над ними
    // когда встретим открывающую скобку (токен типа `paren`)
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // Инкрементируем `current` чтобы пропустить скобку, потому что она 
      // не интересует нас в нашем AST
      token = tokens[++current];

      // Создаём базовую ноду с типом `CallExpression`, и устанавливаем имя из
      // текущей ноды, так как следующая нода после открывающей скобки - 
      // это имя функции
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // И снова инкремент `current`, на этот раз чтобы пропустить имя
      token = tokens[++current];

      // Теперь мы будем перебирать все токены (которые станут параметрами нашего `CallExpression`)
      // пока не встретим закрывающую скобку.
      //
      // Вот тут и появляется рекурсия. Вместо того чтобы пытаться парсить
      // потенциально бесконечный набор нод, мы будем использовать рекурсию чтобы решить эту проблему.
      //
      // Возьмём код на "Lisp" чтобы это обьяснить. Вы можете видеть что параметры
      // функции `add` это число, и вложенный вызов функции (`CallExpression`) который принимает
      // свои числа
      //
      //   (add 2 (subtract 4 2))
      //
      // Также вы можете заметить что в нашем масиве токенов есть несколько закрывающих скобок
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Закрывающая скобка
      //     { type: 'paren',  value: ')'        }, <<< Закрывающая скобка
      //   ]
      //
      // Мы положимся на вложенную функцию `walk` для того, чтобы увеличить
      // `current` переменную после каждого вложенного `CallExpression`.

      // Мы создадим цикл `while`, который будет продолжатся, пока он встречает
      // токены типа `paren` со значением (`value`) закрывающей скобки,
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // вызовем `walk` функцию которая вернёт ноду
        // и положим её в `node.params`
        node.params.push(walk());
        token = tokens[current];
      }

      // И в конце-концов инкрементируем `current` в последний раз, чтобы
      // пропустить закрывающую скобку.
      current++;

      // Возвращаем ноду.
      return node;
    }

    // И снова - если до этого момента не распознали тип токена - бросаем ошибку.
    throw new TypeError(token.type);
  }

  // Теперь мы создадим наш AST с нодой `Program` в его корне (root)
  let ast = {
    type: 'Program',
    body: [],
  };

  // и запускаем нашу `walk` function, добавляя ноды в массив `ast.body`.
  //
  // Мы делаем это внутри цикла потому что наша програма может иметь `CallExpression`
  // один после второго, вместо вложенности
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // И в конце-концов наш парсер возвращает AST.
  return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                                ОБХОД ДЕРЕВА!!!
 * ============================================================================
 */

/**
 * Итак, теперь у нас есть AST, и мы хочем иметь возможность посещать разные ноды
 * с помощью "посетителя". Нам нужно иметь возможность вызывать методы посетителя
 * всякий раз, когда мы встречаем ноду подходящего типа.
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// Мы обьявим функцию `traverser`, которая будет принимать AST и посетителя.
// Внутри мы обьявим две функции...
function traverser(ast, visitor) {

  // Функция `traverseArray`, которая позволит нам проходить через весь массив и 
  // вызывать следующую функцию, которую мы сейчас обьявим — `traverseNode`.
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // `traverseNode` будет принимать ноду и её родителя. 
  // Она сможет передать их обеих методу посетителя.
  function traverseNode(node, parent) {

    // Начнём с проверки наличия метода для типа `type`
    let methods = visitor[node.type];

    // Если есть метод `enter` для ноды такого типа, то вызываем его, передавая
    // и ноду, и её родителя
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // Для разных типов нод - разные действия
    switch (node.type) {

      // Начнём из ноды в корне - ноды `Program`. Так как Program имеет параметр
      // `body` который содержит массив нод - вызовем `traverseArray` чтобы 
      // пройтись по ним
      //
      // (Помните что `traverseArray` в свою очередь вызовет `traverseNode`, таким
      // образом мы запускаем рекурсивную обработку дерева)
      case 'Program':
        traverseArray(node.body, node);
        break;

      // Далее сделаем то же самое с `CallExpression` and обойдём её `params`.
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // В случае с `NumberLiteral` и `StringLiteral` у нас нет вложенных нод,
      // так что мы просто пропускаем их
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // И снова, если неопознанный тип - бросаем ошибку
      default:
        throw new TypeError(node.type);
    }

    // Если для ноды этого типа есть метод `exit` - вызываем его передавая
    // ноду и её родителя
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // В конечном итоге мы запускаем обход дерева вызовом `traverseNode` 
  // передавая наш AST без родительской ноды, потому что у корня AST
  // нет родителя
  traverseNode(ast, null);
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                                 ТРАНСФОРМЕР!!!
 * ============================================================================
 */

/**
 * Следующий шаг — трансформация. Наш трансформер возьмёт построенный нами AST,
 * и передаст его в обходчик вместе с посетителем (`visitor`) для построения нового AST.
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (извините, второе дерево длиннее) |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// Итак, у нас есть функция `transformer` которая принимает LISP AST
function transformer(ast) {

  // Создадим `newAst` (новый AST), который, как и предыдущий, будет иметь 
  // ноду `Program` в корне.
  let newAst = {
    type: 'Program',
    body: [],
  };

  // Далее я собираюсь немного схитрить и чуть-чуть считерить.
  // Мы будем использовать свойство, которое `context` родительской ноды, чтобы
  // складывать ноды в `context` их родителя. Обычно у вас будет абстракция
  // получше этой, но для наших целей нам нужно оставить всё простым
  //
  // Просто запомните что `context` это ссылка *с* старого AST *к* новому.
  ast._context = newAst.body;

  // Начнём с вызова функции обхода с нашим AST и посетителем.
  traverser(ast, {

    // Первый метод посетителя принимает любой `NumberLiteral`.
    NumberLiteral: {
      enter(node, parent) {
        // Создадим новую ноду которая тоже будет называться `NumberLiteral`, и 
        // кинем её в родительский context.
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // Дальше у нас `StringLiteral`.
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    // Потом `CallExpression`.
    CallExpression: {
      enter(node, parent) {

        // Начинаем с создании новой ноды `CallExpression` с вложенным
        // `Identifier`.
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // Дальше мы обьявим новое поле `context` на ноде `CallExpression`.
        // Это поле будет содержать аргументы вызова.
        node._context = expression.arguments;

        // Теперь надо проверить `CallExpression` ли родительская нода.
        // Если нет...
        if (parent.type !== 'CallExpression') {

          // Мы завернём нашу ноду `CallExpression` в ноду
          // `ExpressionStatement`. Мы делаем это потому что высший уровень JavaScript
          // `CallExpression` это, фактически, выражения.
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        // В конце мы закидываем наш (возможно обёрнут) `CallExpression` в родительский
        // `context`.
        parent._context.push(expression);
      },
    }
  });

  // В конце нашей функции-трансформера просто возвращаем новое дерево.
  return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                           ГЕНЕРАТОР КОДА!!!!
 * ============================================================================
 */

/**
 * Теперь приступим к последнему этапу - генерация кода.
 *
 * Наш генератор кода будет рекурсивно вызывать себя, чтобы напечатаь каждую ноду
 * нашего дерева в один большой текст.
 */

function codeGenerator(node) {

  // Разделим ноды по их типу
  switch (node.type) {

    // Если это нода `Program` — проходимся по всем нодам в поле `body`,
    // пропускаем их через генератор кода и соединяем все с \n (символ новой строки).
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    // Для `ExpressionStatement` мы запустим генератор для вложенных выражений,
    // и добавим точку с запятой...
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';' // << (...потому что мы любим *правильный* способ писать код)
      );

    // Для `CallExpression` мы вернём `callee`, откроем скобку, пройдёмся по массиву
    // всех аргументов, прогоним их через генератор, соеденим результаты запятой,
    // и закроем скобку.
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    // Для `Identifier` просто возвращаем имя ноды
    case 'Identifier':
      return node.name;

    // Для `NumberLiteral` просто возвращаем значение ноды
    case 'NumberLiteral':
      return node.value;

    // Для `StringLiteral` добавим двойные скобки вокруг значения ноды
    case 'StringLiteral':
      return '"' + node.value + '"';

    // И как всегда, если не распознали тип - ошибка.
    default:
      throw new TypeError(node.type);
  }
}

/**
 * ============================================================================
 *                                  (۶* ‘ヮ’)۶”
 *                          !!!!!!!!КОМПИЛЯТОР!!!!!!!!
 * ============================================================================
 */

/**
 * НАКОНЕЦ-ТО! Осталось только создать нашу `compiler` функцию. 
 * В ней мы просто соберём всё в одну цепочку.
 *
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler(input) {
  let tokens = tokenizer(input);
  let ast    = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // и просто вернём вывод!
  return output;
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!ВЫ СДЕЛАЛИ ЭТО!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// Просто всё экспортируем...
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};