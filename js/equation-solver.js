// The Equation Solver page: connects the form, keypad and results
// to the solver logic in solver.js.
(function () {
  var form = document.getElementById('solver-form');
  var input = document.getElementById('sentence');
  var keypad = document.getElementById('keypad');
  var result = document.getElementById('result');

  if (!form || !input || !keypad || !result || !window.EquationSolver) {
    return;
  }

  function add(tag, text, className) {
    var element = document.createElement(tag);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    result.appendChild(element);
    return element;
  }

  function showResult(outcome) {
    result.textContent = '';

    if (outcome.type === 'error') {
      add('p', outcome.message, 'message');
      return;
    }

    add('p', 'Your sentence: ' + outcome.sentence);

    if (outcome.type === 'answer') {
      add('p', 'Answer: ? = ' + outcome.answer, 'answer');
    }

    add('h3', 'Steps');
    var list = document.createElement('ol');
    outcome.steps.forEach(function (step) {
      var item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    });
    result.appendChild(list);

    if (outcome.type === 'answer') {
      add('p', 'Check: ' + outcome.check + ' ✓');
    } else {
      add('p', outcome.message, 'message');
    }
  }

  function solveNow() {
    showResult(window.EquationSolver.solve(input.value));
  }

  // Puts text where the cursor is in the box (or replaces the selection).
  function insertText(text) {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    if (start === null || end === null) {
      start = end = input.value.length;
    }
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.setSelectionRange(start + text.length, start + text.length);
  }

  function backspace() {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    if (start === null || end === null) {
      start = end = input.value.length;
    }
    if (start === end) {
      if (start === 0) {
        return;
      }
      start -= 1;
    }
    input.value = input.value.slice(0, start) + input.value.slice(end);
    input.setSelectionRange(start, start);
  }

  // On a phone, moving the cursor to the box would pop up the on-screen
  // keyboard over the keypad, so only do it with a mouse.
  function refocus() {
    if (!window.matchMedia('(pointer: coarse)').matches) {
      input.focus();
    }
  }

  keypad.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) {
      return;
    }
    if (button.dataset.insert) {
      insertText(button.dataset.insert);
    } else if (button.dataset.action === 'backspace') {
      backspace();
    } else if (button.dataset.action === 'clear') {
      input.value = '';
      result.textContent = '';
    }
    refocus();
  });

  document.querySelector('.examples').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (button && button.dataset.example) {
      input.value = button.dataset.example;
      solveNow();
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    solveNow();
  });
})();
