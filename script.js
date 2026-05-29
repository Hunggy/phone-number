function initApp() {
  let data = [];
  let filteredData = [];
  let currentIndex = 0;
  let currentQuestion = null;
  let options = [];
  let correctIndex = -1;
  let answered = false;
  let direction = 0; // 0: job->phone, 1: phone->job
  let totalCount = 0;
  let correctCount = 0;

  const questionText = document.getElementById('questionText');
  const optionsGrid = document.getElementById('optionsGrid');
  const optionBtns = optionsGrid.querySelectorAll('.option-btn');
  const nextBtn = document.getElementById('nextBtn');
  const progress = document.getElementById('progress');
  const dataSelect = document.getElementById('dataSelect');
  const testDirection = document.getElementById('testDirection');
  const themeToggle = document.getElementById('themeToggle');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelp = document.getElementById('closeHelp');
  const toast = document.getElementById('toast');

  async function loadData() {
    try {
      const res = await fetch('data.json');
      const json = await res.json();
      data = json.departments || [];
      populateSelect();
      applyFilter();
    } catch (e) {
      showToast('数据加载失败');
    }
  }

  function populateSelect() {
    dataSelect.innerHTML = '<option value="all">全部</option>';
    data.forEach((dept, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = dept.name;
      dataSelect.appendChild(opt);
    });
  }

  function applyFilter() {
    const val = dataSelect.value;
    filteredData = [];
    if (val === 'all') {
      data.forEach(dept => {
        dept.positions.forEach(p => filteredData.push({...p, department: dept.name}));
      });
    } else {
      const dept = data[parseInt(val)];
      dept.positions.forEach(p => filteredData.push({...p, department: dept.name}));
    }
    totalCount = 0;
    correctCount = 0;
    updateProgress();
    shuffleAndShow();
  }

  function shuffleAndShow() {
    if (filteredData.length === 0) {
      questionText.textContent = '暂无数据';
      optionBtns.forEach(b => b.style.display = 'none');
      return;
    }
    optionBtns.forEach(b => b.style.display = '');
    currentIndex = Math.floor(Math.random() * filteredData.length);
    showQuestion();
  }

  function showQuestion() {
    answered = false;
    nextBtn.disabled = true;
    optionBtns.forEach(btn => {
      btn.classList.remove('correct', 'wrong');
      btn.disabled = false;
    });

    currentQuestion = filteredData[currentIndex];

    if (direction === 0) {
      questionText.textContent = currentQuestion.name;
    } else {
      questionText.textContent = currentQuestion.phone;
    }

    generateOptions();
    renderOptions();
  }

  function generateOptions() {
    const correctAnswer = direction === 0 ? currentQuestion.phone : currentQuestion.name;
    const pool = filteredData.filter((_, i) => i !== currentIndex);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongAnswers = shuffled.map(p => direction === 0 ? p.phone : p.name);

    options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    correctIndex = options.indexOf(correctAnswer);
  }

  function renderOptions() {
    optionBtns.forEach((btn, i) => {
      btn.textContent = options[i];
      btn.dataset.index = i;
    });
  }

  function selectOption(index) {
    if (answered) return;
    answered = true;
    totalCount++;

    optionBtns.forEach(btn => btn.disabled = true);

    if (index === correctIndex) {
      optionBtns[index].classList.add('correct');
      correctCount++;
      showToast('正确!');
    } else {
      optionBtns[index].classList.add('wrong');
      optionBtns[correctIndex].classList.add('correct');
      showToast('错误!');
    }

    updateProgress();
    nextBtn.disabled = false;
  }

  function nextQuestion() {
    if (!answered) return;
    shuffleAndShow();
  }

  function updateProgress() {
    progress.textContent = `${correctCount} / ${totalCount}`;
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      themeToggle.textContent = '☀️';
    }
  }

  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => selectOption(parseInt(btn.dataset.index)));
  });

  nextBtn.addEventListener('click', nextQuestion);
  testDirection.addEventListener('change', () => {
    direction = parseInt(testDirection.value);
    shuffleAndShow();
  });
  dataSelect.addEventListener('change', applyFilter);
  themeToggle.addEventListener('click', toggleTheme);
  helpBtn.addEventListener('click', () => helpModal.classList.add('active'));
  closeHelp.addEventListener('click', () => helpModal.classList.remove('active'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (helpModal.classList.contains('active')) {
      if (e.key === 'Escape') helpModal.classList.remove('active');
      return;
    }

    if (!answered) {
      if (e.key >= '1' && e.key <= '4') {
        selectOption(parseInt(e.key) - 1);
      }
    } else {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nextQuestion();
      }
    }
  });

  loadTheme();
  loadData();
}

document.addEventListener('DOMContentLoaded', initApp);
