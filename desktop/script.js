function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  const overlay = document.getElementById('overlay');

  const isOpen = sidebar.classList.contains('open');

  sidebar.classList.toggle('open');
  body.classList.toggle('sidebar-open');

  // 오버레이 상태 동기화
  overlay.style.display = isOpen ? 'none' : 'block';
  
}
function showIntroCard() {
  // 텍스트 설정
  kanjiEl.textContent = "JLPT 단어장";
  meaningEl.textContent = "메뉴를 통해 급수를 선택해주세요"; // ✅ 안내 문구

  // 뜻 숨기고, 단어(JLPT) 보이게
  kanjiEl.style.display = 'block';
  meaningEl.style.display = 'none';

  // 버튼 숨기기
  document.querySelector('.buttons').style.display = 'none';

  // 카드에 페이드 인 애니메이션 적용
  cardInner.classList.remove('fade-in');     // 혹시 중복 방지
  void cardInner.offsetWidth;                // 강제로 리플로우
  cardInner.classList.add('fade-in');
}
window.addEventListener('DOMContentLoaded', () => {
  showIntroCard();
});


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
  let isFirstWord = true; // 단어를 처음 로드했는지 여부
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
          isFlipped = false;
          levelDisplay.textContent = level;
           instantlyResetCard();  // 💡 카드 상태 초기화
           updateWord();
           updateProgress(); 
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
    meaningEl.innerHTML = `
  <div class="reading">${word.reading}</div>
  <div class="definition">${word.meaning}</div>
`;

  
    kanjiEl.style.display = 'block';
    meaningEl.style.display = 'none';
  
    const buttonGroup = document.querySelector('.buttons');
    buttonGroup.style.display = 'flex';
  
    if (isFirstWord) {
      // 카드 페이드인
      cardInner.classList.remove('fade-in');
      void cardInner.offsetWidth;
      cardInner.classList.add('fade-in');
  
      // 버튼 페이드업
      buttonGroup.classList.remove('fade-up');
      void buttonGroup.offsetWidth;
      buttonGroup.classList.add('fade-up');
  
      isFirstWord = false; // 이후부터는 모두 애니메이션 없이
    } else {
      // 애니메이션 제거
      cardInner.classList.remove('fade-in');
      buttonGroup.classList.remove('fade-up');
    }
    buttonGroup.style.display = 'flex'; // ✅ 다시 보이게!
  
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
    kanjiEl.style.display = 'none';
    meaningEl.style.display = 'block';
    saveProgress();

  }
  
  // 종료 메시지 출력
  function showCompleteMessage() {
    // 카드 텍스트
    kanjiEl.innerHTML = `<div class="complete-message">🎉 축하합니다!</div>`;
    meaningEl.textContent = "한 회독을 모두 완료했습니다.";
  

const buttonGroup = document.querySelector('.buttons');
if (buttonGroup) {
  buttonGroup.style.display = 'none'; // ❌ innerHTML = '' 하지 말고
}
    // 빵빠레 연출 (CSS 방식)
    const container = document.querySelector('.confetti-container');
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 0.3}s`;
      container.appendChild(confetti);
  
      // 자동 제거
      setTimeout(() => container.removeChild(confetti), 1500);
    }
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
function toggleDarkMode() {
  document.body.classList.toggle('light');

  // 나중에 저장 기능도 추가 가능:
  // localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}
  