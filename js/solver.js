// Number-sentence solver: the logic only, with no page code.
// Example: "2 × ? + 3 = 11" gives the answer 4, the steps, and a check.
//
// It works by "undoing" each operation, from the outside in. It uses exact
// fractions (BigInt) so that answers like 3 × ? = 10 are detected correctly
// as "no whole-number answer" and not rounded.
(function (root) {
  'use strict';

  var MAX_NUMBER = 100000n;
  var SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  var MAX_OPERATIONS = 2;

  var MSG = {
    empty: 'Type or tap a number sentence first, for example ? + 7 = 15.',
    letterX: 'Use ? for the missing number, and * or the × button to multiply.',
    decimal: 'Only whole numbers for now, so please leave out the decimal point.',
    comma: 'Please type numbers without commas, like 100000.',
    bracket: 'Brackets are not supported yet.',
    badChar: 'I can only read numbers, + − × ÷, = and ?.',
    noEquals: 'A number sentence needs an = sign, for example ? + 7 = 15.',
    manyEquals: 'A number sentence can have only one = sign.',
    emptySide: 'Both sides of the = sign need a number or a ?.',
    blankCount: 'I need exactly one ? to solve for.',
    cantRead: "I can't read that. Check that every + − × ÷ has a number or a ? on both sides.",
    tooMany: 'I can solve sentences with up to two operations on each side, like 2 × ? + 3 = 11.',
    tooBig: 'Numbers must be 100000 or less.',
    divZero: "You can't divide by 0.",
    none: 'No number makes this sentence true, so there is no answer.',
    many: 'Every number makes this sentence true, so there is no single answer.'
  };

  function SolverError(message) {
    this.message = message;
  }

  // ---- Exact fractions: { n, d } with d > 0, always in lowest terms ----

  function gcd(a, b) {
    if (a < 0n) a = -a;
    if (b < 0n) b = -b;
    while (b !== 0n) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function frac(n, d) {
    if (d === 0n) throw new SolverError(MSG.divZero);
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }

  function add(a, b) { return frac(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return frac(a.n * b.n, a.d * b.d); }
  function div(a, b) { return frac(a.n * b.d, a.d * b.n); }
  function isZero(a) { return a.n === 0n; }
  function isWhole(a) { return a.d === 1n; }
  function isNegative(a) { return a.n < 0n; }
  function equal(a, b) { return a.n === b.n && a.d === b.d; }

  // Text for a number: 7, −15, 3/4, or a mixed number like 3 1/3.
  function fmt(f) {
    if (f.n < 0n) return '−' + fmt({ n: -f.n, d: f.d });
    if (f.d === 1n) return f.n.toString();
    if (f.n > f.d) return (f.n / f.d) + ' ' + (f.n % f.d) + '/' + f.d;
    return f.n + '/' + f.d;
  }

  // ---- Reading the sentence ----

  function normalise(input) {
    return String(input)
      .replace(/\s+/g, '')
      .replace(/[−–—]/g, '-')
      .replace(/[×·]/g, '*')
      .replace(/÷/g, '/')
      .replace(/？/g, '?')
      .replace(/＝/g, '=');
  }

  function checkCharacters(s) {
    if (s === '') throw new SolverError(MSG.empty);
    if (/[xX]/.test(s)) throw new SolverError(MSG.letterX);
    if (s.indexOf('.') !== -1) throw new SolverError(MSG.decimal);
    if (s.indexOf(',') !== -1) throw new SolverError(MSG.comma);
    if (/[()\[\]{}]/.test(s)) throw new SolverError(MSG.bracket);
    if (/[^0-9+\-*\/=?]/.test(s)) throw new SolverError(MSG.badChar);
  }

  function isHighPriority(op) {
    return op === '*' || op === '/';
  }

  function makeNode(op, left, right) {
    return {
      type: 'op',
      op: op,
      left: left,
      right: right,
      text: left.text + ' ' + SYMBOL[op] + ' ' + right.text
    };
  }

  // × and ÷ are done before + and −, as in normal arithmetic.
  function buildTree(operands, ops) {
    if (ops.length === 0) return operands[0];
    if (ops.length === 1) return makeNode(ops[0], operands[0], operands[1]);
    if (isHighPriority(ops[1]) && !isHighPriority(ops[0])) {
      return makeNode(ops[0], operands[0], makeNode(ops[1], operands[1], operands[2]));
    }
    return makeNode(ops[1], makeNode(ops[0], operands[0], operands[1]), operands[2]);
  }

  function parseSide(str) {
    var tokens = str.match(/\d+|[+\-*\/?]/g) || [];
    if (tokens.length === 0 || tokens.length % 2 === 0) {
      throw new SolverError(MSG.cantRead);
    }
    var operands = [];
    var ops = [];
    tokens.forEach(function (token, i) {
      var isOperator = /^[+\-*\/]$/.test(token);
      if (i % 2 === 1 ? !isOperator : isOperator) {
        throw new SolverError(MSG.cantRead);
      }
      if (isOperator) {
        ops.push(token);
      } else if (token === '?') {
        operands.push({ type: 'blank', text: '?' });
      } else {
        var value = BigInt(token);
        operands.push({ type: 'num', value: frac(value, 1n), text: value.toString(), raw: value });
      }
    });
    if (ops.length > MAX_OPERATIONS) throw new SolverError(MSG.tooMany);
    operands.forEach(function (operand) {
      if (operand.type === 'num' && operand.raw > MAX_NUMBER) throw new SolverError(MSG.tooBig);
    });
    ops.forEach(function (op, i) {
      var divisor = operands[i + 1];
      if (op === '/' && divisor.type === 'num' && divisor.raw === 0n) {
        throw new SolverError(MSG.divZero);
      }
    });
    return buildTree(operands, ops);
  }

  // ---- Working things out ----

  function hasBlank(node) {
    if (node.type === 'blank') return true;
    if (node.type === 'num') return false;
    return hasBlank(node.left) || hasBlank(node.right);
  }

  function applyOp(op, a, b) {
    switch (op) {
      case '+': return add(a, b);
      case '-': return sub(a, b);
      case '*': return mul(a, b);
      default: return div(a, b);
    }
  }

  // Value of a tree. If it has a ?, blankValue is used in its place.
  function evaluate(node, blankValue) {
    if (node.type === 'num') return node.value;
    if (node.type === 'blank') return blankValue;
    return applyOp(node.op, evaluate(node.left, blankValue), evaluate(node.right, blankValue));
  }

  // Undo the outermost operation. Returns { value, line } for the part
  // that holds the ?, where line explains the step.
  function undoOperation(node, unknownIsLeft, known, target, unknown) {
    var k = fmt(known);
    var t = fmt(target);
    var value;
    var action;
    var calc;

    switch (node.op) {
      case '+':
        value = sub(target, known);
        action = 'Undo + ' + k;
        calc = t + ' − ' + k;
        break;

      case '-':
        if (unknownIsLeft) {
          value = add(target, known);
          action = 'Undo − ' + k;
          calc = t + ' + ' + k;
        } else {
          value = sub(known, target);
          action = 'Find what was taken away from ' + k;
          calc = k + ' − ' + t;
        }
        break;

      case '*':
        if (isZero(known)) {
          throw new SolverError(isZero(target) ? MSG.many : MSG.none);
        }
        value = div(target, known);
        action = 'Undo × ' + k;
        calc = t + ' ÷ ' + k;
        break;

      default: // '/'
        if (unknownIsLeft) {
          value = mul(target, known);
          action = 'Undo ÷ ' + k;
          calc = t + ' × ' + k;
        } else {
          // known ÷ unknown = target
          if (isZero(target)) {
            throw new SolverError(isZero(known) ? MSG.many : MSG.none);
          }
          if (isZero(known)) throw new SolverError(MSG.none);
          value = div(known, target);
          action = 'Find what ' + k + ' was divided by';
          calc = k + ' ÷ ' + t;
        }
    }

    return {
      value: value,
      line: action + ': ' + calc + ' = ' + fmt(value) + '. So ' + unknown.text + ' = ' + fmt(value) + '.'
    };
  }

  function solveSentence(input) {
    var s = normalise(input);
    checkCharacters(s);

    var parts = s.split('=');
    if (parts.length < 2) throw new SolverError(MSG.noEquals);
    if (parts.length > 2) throw new SolverError(MSG.manyEquals);
    if (parts[0] === '' || parts[1] === '') throw new SolverError(MSG.emptySide);
    if ((s.match(/\?/g) || []).length !== 1) throw new SolverError(MSG.blankCount);

    var blankOnLeft = parts[0].indexOf('?') !== -1;
    var blankTree = parseSide(blankOnLeft ? parts[0] : parts[1]);
    var knownTree = parseSide(blankOnLeft ? parts[1] : parts[0]);

    var steps = [];
    var target = evaluate(knownTree);
    if (knownTree.type === 'op') {
      steps.push('Work out ' + knownTree.text + ' = ' + fmt(target) + ' first.');
    }

    var node = blankTree;
    if (node.type === 'blank') {
      steps.push('The ? is already on its own, so ? = ' + fmt(target) + '.');
    }
    while (node.type === 'op') {
      var unknownIsLeft = hasBlank(node.left);
      var unknown = unknownIsLeft ? node.left : node.right;
      var knownPart = unknownIsLeft ? node.right : node.left;
      var known = evaluate(knownPart);
      if (knownPart.type === 'op') {
        steps.push('Work out ' + knownPart.text + ' = ' + fmt(known) + ' first.');
      }
      var undone = undoOperation(node, unknownIsLeft, known, target, unknown);
      steps.push(undone.line);
      target = undone.value;
      node = unknown;
    }
    var answer = target;

    // Safety net: put the answer back in and make sure the sentence is true.
    var valueWithAnswer;
    try {
      valueWithAnswer = evaluate(blankTree, answer);
    } catch (e) {
      if (e instanceof SolverError) throw new SolverError(MSG.none);
      throw e;
    }
    if (!equal(valueWithAnswer, evaluate(knownTree))) {
      throw new SolverError(MSG.none);
    }

    function arrange(blankText, knownText) {
      return blankOnLeft ? blankText + ' = ' + knownText : knownText + ' = ' + blankText;
    }
    var sentence = arrange(blankTree.text, knownTree.text);

    if (!isWhole(answer) || isNegative(answer)) {
      var reason = isWhole(answer)
        ? 'The answer would be ' + fmt(answer) + ', which is less than 0, so there is no whole-number answer.'
        : 'The answer would be ' + fmt(answer) + ', which is not a whole number, so there is no whole-number answer.';
      return { type: 'no-whole', sentence: sentence, steps: steps, message: reason };
    }

    return {
      type: 'answer',
      sentence: sentence,
      steps: steps,
      answer: fmt(answer),
      check: arrange(blankTree.text.replace('?', fmt(answer)), fmt(evaluate(knownTree)))
    };
  }

  // Never throws for bad input: returns { type: 'error', message } instead.
  function solve(input) {
    try {
      return solveSentence(input);
    } catch (e) {
      if (e instanceof SolverError) return { type: 'error', message: e.message };
      throw e;
    }
  }

  var api = { solve: solve };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.EquationSolver = api;
  }
})(typeof window !== 'undefined' ? window : this);
