function initApp() {
  let data = [];
  let filteredData = [];
  let currentQuestion = null;
  let options = [];
  let correctIndex = -1;
  let answered = false;
  let triedOptions = [];
  let direction = 0;
  let totalCount = 0;
  let correctCount = 0;

  let roundQueue = [];
  let roundPos = 0;
  let roundFirstTryCorrect = {};
  let wrongItems = [];
  let isWrongOnlyMode = false;

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
  const browseBtn = document.getElementById('browseBtn');
  const browsePanel = document.getElementById('browsePanel');
  const closeBrowseBtn = document.getElementById('closeBrowseBtn');
  const browseSearch = document.getElementById('browseSearch');
  const browseList = document.getElementById('browseList');

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
    updateWrongOption();
  }

  function updateWrongOption() {
    let wrongOpt = dataSelect.querySelector('option[value="wrong"]');
    if (wrongItems.length > 0) {
      if (!wrongOpt) {
        wrongOpt = document.createElement('option');
        wrongOpt.value = 'wrong';
        dataSelect.appendChild(wrongOpt);
      }
      wrongOpt.textContent = `只做错题 (${wrongItems.length})`;
    } else if (wrongOpt) {
      wrongOpt.remove();
    }
  }

  function applyFilter() {
    const val = dataSelect.value;
    isWrongOnlyMode = (val === 'wrong');

    if (isWrongOnlyMode) {
      filteredData = wrongItems.map(item => ({...item}));
    } else {
      filteredData = [];
      let source = val === 'all' ? data : [data[parseInt(val)]];
      source.forEach(dept => {
        dept.positions.forEach(p => filteredData.push({...p, department: dept.name}));
      });
    }
    startRound();
  }

  function startRound() {
    roundQueue = filteredData.map((_, i) => i).sort(() => Math.random() - 0.5);
    roundPos = 0;
    roundFirstTryCorrect = {};
    totalCount = 0;
    correctCount = 0;
    updateProgress();
    showCurrentQuestion();
  }

  function showCurrentQuestion() {
    if (roundPos >= roundQueue.length) {
      finishRound();
      return;
    }

    answered = false;
    triedOptions = [];
    nextBtn.disabled = true;
    optionBtns.forEach(btn => {
      btn.classList.remove('correct', 'wrong');
      btn.disabled = false;
      btn.style.display = '';
    });

    const qi = roundQueue[roundPos];
    currentQuestion = filteredData[qi];

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
    const pool = filteredData.filter((_, i) => i !== roundQueue[roundPos]);
    const available = pool.filter(p => {
      const val = direction === 0 ? p.phone : p.name;
      return !triedOptions.includes(val);
    });
    const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 3);
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

    if (index === correctIndex) {
      answered = true;
      totalCount++;
      correctCount++;
      optionBtns.forEach(btn => btn.disabled = true);
      optionBtns[index].classList.add('correct');
      if (!roundFirstTryCorrect[currentQuestion.name + '|' + currentQuestion.phone]) {
        roundFirstTryCorrect[currentQuestion.name + '|' + currentQuestion.phone] = (triedOptions.length === 0);
      }
      showToast('正确!');
      updateProgress();
      nextBtn.disabled = false;
      setTimeout(() => { if (answered) nextQuestion(); }, 800);
    } else {
      optionBtns[index].classList.add('wrong');
      optionBtns[index].disabled = true;
      triedOptions.push(options[index]);
      roundFirstTryCorrect[currentQuestion.name + '|' + currentQuestion.phone] = false;
      showToast('错误!');
    }
  }

  function nextQuestion() {
    if (!answered) return;
    roundPos++;
    showCurrentQuestion();
  }

  function finishRound() {
    const roundWrongItems = [];
    const seen = new Set();
    filteredData.forEach((item, i) => {
      const key = item.name + '|' + item.phone;
      if (roundFirstTryCorrect[key] === false && !seen.has(key)) {
        roundWrongItems.push({...item});
        seen.add(key);
      }
    });

    wrongItems = roundWrongItems;
    updateWrongOption();

    const total = filteredData.length;
    const correct = total - wrongItems.length;
    const wrong = wrongItems.length;

    questionText.innerHTML = `🎉 本轮结束<br><br>✅ 正确: ${correct}  ❌ 错误: ${wrong}  📊 共: ${total}`;
    optionBtns.forEach(btn => btn.style.display = 'none');
    nextBtn.disabled = true;

    if (wrongItems.length > 0) {
      showToast(`有 ${wrong} 题做错，可在下拉框选"只做错题"继续练习`);
    } else {
      showToast('全部答对，太棒了!');
    }

    progress.textContent = `${correct} / ${total}`;
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
    startRound();
  });
  dataSelect.addEventListener('change', applyFilter);
  themeToggle.addEventListener('click', toggleTheme);
  helpBtn.addEventListener('click', () => helpModal.classList.add('active'));
  closeHelp.addEventListener('click', () => helpModal.classList.remove('active'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.remove('active');
  });

  browseBtn.addEventListener('click', openBrowse);
  closeBrowseBtn.addEventListener('click', closeBrowse);
  browseSearch.addEventListener('input', (e) => renderBrowseList(e.target.value));

  document.addEventListener('keydown', (e) => {
    if (browsePanel.classList.contains('active')) {
      if (e.key === 'Escape') closeBrowse();
      return;
    }

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

  function renderBrowseList(filter = '') {
    const keyword = filter.toLowerCase();
    let items = [];
    data.forEach(dept => {
      dept.positions.forEach(p => {
        const matchName = p.name.toLowerCase().includes(keyword);
        const matchPhone = p.phone.toLowerCase().includes(keyword);
        if (!keyword || matchName || matchPhone) {
          items.push({ name: p.name, phone: p.phone, dept: dept.name });
        }
      });
    });

    if (items.length === 0) {
      browseList.innerHTML = '<div class="browse-empty">无匹配结果</div>';
      return;
    }

    browseList.innerHTML = items.map(item => `
      <div class="browse-item">
        <div class="browse-item-job">${item.name}</div>
        <div class="browse-item-phone">${item.phone}</div>
        ${item.dept !== '全部' ? `<div class="browse-item-dept">${item.dept}</div>` : ''}
      </div>
    `).join('');
  }

  function openBrowse() {
    browseSearch.value = '';
    renderBrowseList();
    browsePanel.classList.add('active');
  }

  function closeBrowse() {
    browsePanel.classList.remove('active');
  }

  loadTheme();
  loadData();
}

document.addEventListener('DOMContentLoaded', initApp);
