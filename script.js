function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
  
    sidebar.classList.toggle('open');
    body.classList.toggle('sidebar-open');
  }
  
  // 기본 요소
  const levelDisplay = document.querySelector('.level');
  const progressDisplay = document.querySelector('.progress');
  const levelItems = document.querySelectorAll('#sidebar ul li');
  const wordCard = document.getElementById('word-card');
  const cardInner = document.querySelector('.card-inner');
  const kanjiEl = document.querySelector('.kanji');
  const meaningEl = document.querySelector('.meaning');
  const unknownButton = document.getElementById('unknown-button');
  const nextButton = document.getElementById('next-button');
  
  // 상태 관리
  let currentWords = [];
  let currentIndex = 0;
  let isFlipped = false;
  let unknownWords = [];
  let completedCount = 0;
  let mode = 'normal'; // 'normal' 또는 'review'
  let reviewRound = false; // 복습 중 '모름'을 또 누른 경우
 // 배열을 무작위로 섞는 함수 (Fisher–Yates 알고리즘)
function shuffle(array) {
    const result = [...array]; // 원본 배열 복사
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
   
  async function loadWords(level) {
    // 1. localStorage에 저장된 진행이 있는지 확인
    const saved = localStorage.getItem('jlpt-progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 저장된 레벨이 같은 경우만 이어하기 제안
      if (parsed.level === level) {
        const resume = confirm(`이전에 JLPT ${level} 학습을 이어서 하시겠습니까?`);
        if (resume) {
          // 이어서 학습!
          currentWords = parsed.currentWords;
          currentIndex = parsed.currentIndex;
          completedCount = parsed.completedCount;
          unknownWords = parsed.unknownWords;
          mode = parsed.mode;
          levelDisplay.textContent = level;
          isFlipped = false;
          updateWord();
          return;
        }
      }
    }
  
    // 아니면 처음부터 시작
    try {
      const res = await fetch(`./data/words_${level}.json`);
      const data = await res.json();
      currentWords = shuffle(data); // ✅ 무작위 정렬도 반영
      currentIndex = 0;
      completedCount = 0;
      unknownWords = [];
      reviewRound = false;
      mode = 'normal';
      isFlipped = false;
      levelDisplay.textContent = level;
      updateWord();
    } catch (err) {
      console.error("단어 불러오기 실패:", err);
    }
  }
  
  
  function updateWord() {
    if (!currentWords[currentIndex]) return;
    const word = currentWords[currentIndex];
    kanjiEl.textContent = word.word;
    meaningEl.textContent = `${word.meaning} (${word.reading})`;
    meaningEl.style.display = 'block';
    kanjiEl.style.display = 'none';
    updateProgress();
  }
  
  
  function updateProgress() {
    const current = completedCount + 1;
  const total = currentWords.length;

  progressDisplay.textContent = `${current} / ${total}`;
  }
  
  // 레벨 선택
  levelItems.forEach((item) => {
    item.addEventListener('click', () => {
      const level = item.textContent.trim().replace('JLPT ', '');
      levelDisplay.textContent = level;
      document.getElementById('sidebar').classList.remove('open');
      document.body.classList.remove('sidebar-open');
      loadWords(level);
    });
  });
  
// 카드 클릭 시 전환 (애니메이션 없이)
wordCard.addEventListener('click', () => {
    const isMeaningVisible = meaningEl.style.display === 'block';
  
    if (isMeaningVisible) {
      meaningEl.style.display = 'none';
      kanjiEl.style.display = 'block';
    } else {
      meaningEl.style.display = 'block';
      kanjiEl.style.display = 'none';
    }
  });
  // "모름" 버튼 → unknown에 저장하고 다음으로 이동 (카운터는 유지)
  unknownButton.addEventListener('click', () => {
    if (currentWords[currentIndex]) {
      unknownWords.push(currentWords[currentIndex]);
    }
    goToNextWord(false); // countUp = false
  });
  
  
  // "다음" 버튼 → 다음 단어로 이동 + 카운터 증가
  nextButton.addEventListener('click', () => {
    goToNextWord(true); // true: 카운터 증가
  });
  
  // 다음 단어로 이동 함수
  function goToNextWord(countUp = true) {
    instantlyResetCard(); // 💥 뜻 → 한자 화면으로 되돌림
  
    currentIndex++;
    if (countUp) completedCount++;
  
    if (currentIndex >= currentWords.length) {
      if (mode === 'normal') {
        // 1차 학습 끝
        if (unknownWords.length > 0) {
          const retry = confirm("모르는 단어를 복습하시겠습니까?");
          if (retry) {
            mode = 'review';
            currentWords = [...unknownWords];
            currentIndex = 0;
            completedCount = 0;
            unknownWords = [];
            reviewRound = false;
            updateWord();
            return;
          } else {
            showCompleteMessage();
            return;
          }
        } else {
          showCompleteMessage();
          return;
        }
      } else if (mode === 'review') {
        if (unknownWords.length > 0) {
          const retry = confirm("복습 중 모르는 단어가 또 있습니다. 다시 복습하시겠습니까?");
          if (retry) {
            currentWords = [...unknownWords];
            currentIndex = 0;
            completedCount = 0;
            unknownWords = [];
            reviewRound = true;
            updateWord();
            return;
          } else {
            showCompleteMessage();
            return;
          }
        } else {
          showCompleteMessage();
          return;
        }
      }
    }
  
    updateWord();
    saveProgress();

  }
  
  // 종료 메시지 출력
  function showCompleteMessage() {
    kanjiEl.textContent = "🎉 축하합니다!";
    meaningEl.textContent = "한 회독을 모두 완료했습니다.";
    wordCard.classList.remove('flipped');
    document.querySelector('.buttons').innerHTML = `
      <button onclick="location.reload()">닫기</button>
    `;
  }
  function instantlyResetCard() {
    wordCard.classList.add('no-transition');
  
    wordCard.classList.add('flipped');   // ✅ flip된 상태에서 단어(word) 보이도록!
    isFlipped = true;
  
    requestAnimationFrame(() => {
      wordCard.classList.remove('no-transition');
    });
  }
  function saveProgress() {
  const state = {
    currentIndex,
    completedCount,
    currentWords,
    unknownWords,
    mode,
    level: levelDisplay.textContent
  };
  localStorage.setItem('jlpt-progress', JSON.stringify(state));
}

  