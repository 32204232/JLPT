const isMobile = /iPhone|Android|iPad|iPod|Mobile/i.test(navigator.userAgent);

if (isMobile) {
  document.body.classList.add('mobile');
  console.log("📱 모바일로 접속함");
} else {
  document.body.classList.add('desktop');
  console.log("💻 데스크탑으로 접속함");
}
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const kanjiEl = document.querySelector(".kanji");
    const meaningEl = document.querySelector(".meaning");
    const readingEl = meaningEl.querySelector(".reading");
    const definitionEl = meaningEl.querySelector(".definition");
    const progressEl = document.querySelector(".progress");
    const unknownBtn = document.getElementById("unknown-button");
    const nextBtn = document.getElementById("next-button");
    const levelDisplay = document.querySelector(".level");
    const levelItems = document.querySelectorAll("#sidebar li");
    const buttonsEl = document.querySelector(".buttons.fixed-bottom");
    const cardInner = document.querySelector(".card-inner");

    let currentWords = [];
    let currentIndex = 0;
    let unknownWords = [];
    let completed = 0;
    let mode = "normal";

    function toggleSidebar() {
      sidebar.classList.toggle("open");
      overlay.style.display = sidebar.classList.contains("open") ? "block" : "none";
    }

    function shuffle(array) {
      return [...array].sort(() => Math.random() - 0.5);
    }

    async function loadWords(level) {
      try {
        const res = await fetch(`./data/words_${level}.json`);
        const data = await res.json();
        currentWords = shuffle(data);
        currentIndex = 0;
        unknownWords = [];
        completed = 0;
        mode = "normal";
        levelDisplay.textContent = level;
        updateWord(true);
      } catch (err) {
        console.error("불러오기 실패", err);
      }
    }

    function updateWord(animate = false) {
      const word = currentWords[currentIndex];
      if (!word) return;
      kanjiEl.textContent = word.word;
      readingEl.textContent = word.reading;
      definitionEl.textContent = word.meaning;
      meaningEl.style.display = "none";
      kanjiEl.style.display = "block";
      progressEl.textContent = `${completed + 1} / ${currentWords.length}`;

      // 버튼 표시 및 애니메이션 처리
      buttonsEl.classList.remove('active');
      void buttonsEl.offsetWidth;

      if (animate) {
        requestAnimationFrame(() => {
          buttonsEl.classList.add('active');
          cardInner.classList.remove("fade-in");
          void cardInner.offsetWidth;
          cardInner.classList.add("fade-in");
        });
      } else {
        buttonsEl.classList.add('active');
      }

      buttonsEl.style.display = "flex";
    }

    function flipCard() {
      const showingMeaning = meaningEl.style.display === "block";
      meaningEl.style.display = showingMeaning ? "none" : "block";
      kanjiEl.style.display = showingMeaning ? "block" : "none";
    }

    function goToNext(count = true) {
      if (count) completed++;
      currentIndex++;

      if (currentIndex >= currentWords.length) {
        if (mode === "normal" && unknownWords.length > 0) {
          if (confirm("모르는 단어 복습하시겠습니까?")) {
            currentWords = [...unknownWords];
            currentIndex = 0;
            unknownWords = [];
            completed = 0;
            mode = "review";
            updateWord(true);
          } else {
            showComplete();
          }
        } else {
          showComplete();
        }
        return;
      }

      updateWord(false);
    }

    function showComplete() {
      kanjiEl.innerHTML = "🎉 축하합니다!";
      readingEl.textContent = "한 회독이 완료되었습니다";
      definitionEl.textContent = "";
      meaningEl.style.display = "block";
      kanjiEl.style.display = "none";
      buttonsEl.style.display = "none";
      buttonsEl.classList.remove('active');
    }

    document.getElementById("word-card").addEventListener("click", flipCard);

    unknownBtn.addEventListener("click", () => {
      if (currentWords[currentIndex]) {
        unknownWords.push(currentWords[currentIndex]);
      }
      goToNext(false);
    });

    nextBtn.addEventListener("click", () => {
      goToNext(true);
    });

    levelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const level = item.dataset.level;
        toggleSidebar();
        loadWords(level);
      });
    });

    // 초기 상태 버튼 숨김
    buttonsEl.style.display = "none";
    buttonsEl.classList.remove("active");
    window.toggleSidebar = toggleSidebar;
});