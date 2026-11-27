// Light/dark theme toggle, shared by every page.
// Light is the default. The visitor's choice is remembered in the browser.
(function () {
  var KEY = 'theme';

  // Reading or writing saved settings can fail (for example in a private
  // window), so the page must keep working if it does.
  function readSaved() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function save(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (e) {
      // Ignore: the theme still changes, it just isn't remembered.
    }
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  var current = readSaved() === 'dark' ? 'dark' : 'light';

  // Runs right away (this script is loaded in the page head),
  // so the page never flashes the wrong theme.
  apply(current);

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('theme-toggle');
    if (!button) {
      return;
    }

    function updateLabel() {
      button.textContent =
        current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }

    updateLabel();

    button.addEventListener('click', function () {
      current = current === 'dark' ? 'light' : 'dark';
      apply(current);
      save(current);
      updateLabel();
    });
  });
})();
