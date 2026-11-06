/* ===================================================================
   script.js : 버튼을 눌렀을 때의 동작을 만드는 파일

   전체 흐름
   1) 사용자가 입력하거나 칸을 누르면 routines(내 루틴 목록) 데이터가 바뀝니다.
   2) renderAll()이 그 데이터에 맞춰 화면 전체를 다시 그립니다.
   그래서 할 일을 입력하면 손 주위의 칸과 손 그림이 바로 바뀝니다.

   문구나 질문만 바꿀 때는 맨 위 1번 부분만 고치면 됩니다.

   자주 나오는 용어
   - 함수(function): 이름을 붙여 둔 동작 묶음. 이름을 부르면 실행됩니다.
   - addEventListener: 클릭 같은 일이 생겼을 때 실행할 동작을 등록합니다.
   - classList.toggle: 조건에 따라 class를 붙이거나 뗍니다. 모양은 style.css가 정합니다.
   - textContent: 요소 안의 글자를 바꿉니다.
   =================================================================== */

/* =====================================================
   1. 나중에 쉽게 고칠 수 있는 내용
   ===================================================== */

// 담을 수 있는 루틴의 최대 개수
const MAX_ROUTINES = 5;

// 손가락 0개~5개 접힘 순서의 손 이미지 6장
// 6장을 모두 적으면 임시 손 그림 대신 이미지가 나옵니다.
const handImages = [
  "images/hand-0.png",
  "images/hand-1.png",
  "images/hand-2.png",
  "images/hand-3.png",
  "images/hand-4.png",
  "images/hand-5.png",
];

// 체크할 때 그림이 늦게 뜨지 않도록 이미지를 미리 불러 둠
handImages.forEach(function (path) {
  new Image().src = path;
});

// [수정] ADHD력 테스트 질문 5개. 질문 문장을 짧게 줄였습니다. 이 목록에 문장을 추가하면 질문이 늘어납니다.
// (4번 질문은 요청받은 문구 그대로 넣었습니다. 다른 질문과 달리 "~나요?" 대신 "~한다."로 끝납니다)
const quizQuestions = [
  "해야 할 일을 알고 있는데도 자꾸 미루나요?",
  "물건을 어디에 뒀는지 자주 까먹나요?",
  "다른 생각에 빠져 집중이 흐트러지나요?",
  "대화 할 때 딴 생각, 집중 못하고 끼어 든다.",
  "안절부절 못하고 무언가를 계속 만지작거리나요?",
];

// 답 버튼 3개와 각 답의 점수 (모든 질문이 같은 답을 씀)
// 질문 5개 x 최고 2점 = 총점 10점
const quizAnswers = [
  { label: "자주 그래요", score: 2 },
  { label: "가끔 그래요", score: 1 },
  { label: "거의 없어요", score: 0 },
];

// [수정] 총점에 따른 결과 3단계. 위에서부터 차례로 보고, 내 점수가 max 이하인 첫 단계가 결과가 됩니다.
//  - 0~3점: LEVEL 1 (낮음) / 4~7점: LEVEL 2 (중간) / 8~10점: LEVEL 3 (높음)
//  - 기준 점수를 바꾸고 싶으면 max 숫자만 고치면 됩니다.
//  - label: 결과 위에 작게 보이는 단계 이름 / image, imageAlt: 단계 이름과 멘트 사이에 보이는 그림과 설명
//  - title: 큰 한 줄 멘트 / text: 짧은 설명
//  - showNotice: true면 아래에 "ADHD 진단이 아닙니다" 안내가 나오고, false면 나오지 않음 (낮음은 false)
const quizLevels = [
  {
    max: 3,
    label: "LEVEL 1 · ADHD력 낮음",
    image: "images/result-low.png",
    imageAlt: "편안하게 쉬며 웃고 있는 캐릭터",
    title: "“ADHD력? 오늘은 조용하네.”",
    text: "뇌가 제법 평화롭습니다. 이 정도면 일단 순항 중!",
    showNotice: false,
    color: "#CDE8C4",   // [추가 수정 4] 결과 색 포인트: 초록 (일러스트 배경과 같은 계열)
    tip: "팁: 지금 습관을 지키려면 오늘 할 일 5개를 적고 하나씩 접어 보세요.", // (임시 문구)
    showHelp: false,
  },
  {
    max: 7,
    label: "LEVEL 2 · ADHD력 중간",
    image: "images/result-mid.png",
    imageAlt: "딴생각에 빠져 턱을 괸 캐릭터",
    title: "“ADHD 호소인? 살짝 의심스럽군.”",
    text: "집중력과 딴생각이 치열한 눈치게임 중!",
    showNotice: true,
    color: "#FFE7A3",   // 노랑
    tip: "팁: 해야 할 일을 아주 작게 쪼개서, 그중 하나만 먼저 시작해 봐요.", // (임시 문구)
    showHelp: false,
  },
  {
    max: 10,
    label: "LEVEL 3 · ADHD력 높음",
    image: "images/result-high.png",
    imageAlt: "정신없어 하며 머리를 감싼 캐릭터",
    title: "“뇌 속에 탭을 27개 켜두셨나요?”",
    text: "ADHD력 높은 편! 혼자 고민하지 말고 전문가와 이야기해 봐요.",
    showNotice: true,
    color: "#F8CFDB",   // 분홍
    tip: "팁: 오늘은 딱 한 가지만! 5분짜리 작은 루틴부터 시작해 봐요.", // (임시 문구)
    showHelp: true,     // true면 결과 아래에 도움 안내 자리가 나옴 (높음만)
  },
];

// [추가 수정 4] 시작 전 안내 문구와 높음 결과의 도움 안내 (임시 문구)
// 상담 전화번호는 반드시 공식 사이트(예: 복지로, 청소년상담복지센터)에서 한 번 더 확인한 뒤 쓰세요.
const quizIntroText = "5문항 · 약 1분 · 진단이 아니에요";
const quizHelpPhone = "청소년상담 1388 (24시간, 전화·문자·카카오톡)";

// [수정] 결과 그림도 미리 불러 둠 (결과가 바로 뜨도록)
quizLevels.forEach(function (level) {
  new Image().src = level.image;
});

// [수정] 중간·높음 결과 아래에 나오는 안내 문구
const quizNoticeText =
  "잠깐! 이 테스트는 ADHD 진단을 내리는 검사가 아닙니다. 정확한 진단은 전문의와 상담해 주세요.";


/* =====================================================
   2. 화면에서 사용할 부분 찾아 두기
   ===================================================== */

// getElementById: index.html에서 해당 id를 가진 요소를 찾아옴
const routineForm = document.getElementById("routineForm");
const routineInput = document.getElementById("routineInput");
const routineMessage = document.getElementById("routineMessage");
const taskList = document.getElementById("taskList");
const resetButton = document.getElementById("resetButton");
const handSvg = document.getElementById("handSvg");
const handImage = document.getElementById("handImage");
const handProgress = document.getElementById("handProgress");
// 손가락 5개를 순서대로 모아 둠 (엄지, 검지, 중지, 약지, 새끼)
const fingers = document.querySelectorAll("#handSvg .finger");
const quizBox = document.getElementById("quizBox");
const signupModal = document.getElementById("signupModal");
const signupForm = document.getElementById("signupForm");
const signupDone = document.getElementById("signupDone");
// 리워드 팝업은 코드로 직접 열어야 해서 Bootstrap 팝업 도구로 준비해 둠
const rewardModal = new bootstrap.Modal(document.getElementById("rewardModal"));


/* =====================================================
   3. 내 루틴 데이터
   ===================================================== */

// 담은 루틴을 저장하는 목록. 한 칸의 모양: { text: "루틴 이름", done: 체크 여부 }
// 루틴을 빼면 이 목록에서 사라지므로 체크도 함께 사라집니다.
let routines = [];

// 체크한 루틴이 몇 개인지 세기
function countDone() {
  return routines.filter(function (routine) {
    return routine.done;
  }).length;
}

// 같은 이름의 루틴이 이미 담겨 있는지 확인하기
function hasRoutine(text) {
  return routines.some(function (routine) {
    return routine.text === text;
  });
}

// 루틴 담기. 성공하면 true, 규칙에 걸리면 안내 문구를 보여 주고 false
function addRoutine(text) {
  if (text === "") {
    routineMessage.textContent = "루틴을 입력해 주세요.";
    return false;
  }
  if (hasRoutine(text)) {
    routineMessage.textContent = "이미 담은 루틴이에요.";
    return false;
  }
  if (routines.length >= MAX_ROUTINES) {
    routineMessage.textContent = "루틴은 최대 5개까지 담을 수 있어요.";
    return false;
  }

  routines.push({ text: text, done: false });
  routineMessage.textContent = "";
  renderAll();
  return true;
}

// 루틴 빼기
function removeRoutine(text) {
  routines = routines.filter(function (routine) {
    return routine.text !== text;
  });
  routineMessage.textContent = "";
  renderAll();
}


/* =====================================================
   4. 루틴 입력
   ===================================================== */

// 직접 입력: "추가" 버튼이나 엔터 키를 누르면 실행
routineForm.addEventListener("submit", function (event) {
  event.preventDefault(); // 페이지가 새로고침되지 않게 막기

  // trim(): 입력한 글자 앞뒤의 공백을 없앰. 담기에 성공했을 때만 입력칸을 비움
  const added = addRoutine(routineInput.value.trim());
  if (added) {
    routineInput.value = "";
  }
  routineInput.focus();
});

/* =====================================================
   5. 할 일 칸과 손 그림
   ===================================================== */

// 할 일 5칸 만들기 (칸은 한 번만 만들고, 내용은 renderTasks에서 바꿈)
for (let i = 0; i < MAX_ROUTINES; i++) {
  const row = document.createElement("div");
  row.className = "task-row";

  // 칸을 누르면 체크
  const task = document.createElement("button");
  task.type = "button";
  task.className = "task-item";
  task.innerHTML = '<span class="task-check"></span><span class="task-text"></span>';
  task.addEventListener("click", function () {
    toggleTask(i);
  });

  // 칸 오른쪽의 X를 누르면 루틴 빼기
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "task-remove";
  removeButton.textContent = "×";
  removeButton.addEventListener("click", function () {
    removeRoutine(routines[i].text);
    routineInput.focus();
  });

  row.append(task, removeButton);
  taskList.appendChild(row);
}

// 할 일 칸을 눌렀을 때: 체크하거나 해제하기
function toggleTask(index) {
  const routine = routines[index];
  // ! 는 반대로 바꾼다는 뜻: 체크 안 됨이면 체크로, 체크면 해제로
  routine.done = !routine.done;
  renderAll();

  // 방금 체크해서 5개가 모두 완료되면 리워드 팝업 띄우기
  if (routine.done && countDone() === MAX_ROUTINES) {
    // 마지막 손가락이 접히는 모습을 본 뒤에 팝업이 뜨도록 잠깐 기다림
    setTimeout(function () {
      rewardModal.show();
    }, 600);
  }
}

// 할 일 칸의 내용 바꾸기
function renderTasks() {
  taskList.querySelectorAll(".task-row").forEach(function (row, index) {
    const routine = routines[index];
    const task = row.querySelector(".task-item");
    const removeButton = row.querySelector(".task-remove");
    const check = task.querySelector(".task-check");
    const text = task.querySelector(".task-text");

    // 루틴이 있는 칸은 내용을 보여 주고, 없는 칸은 빈칸 문구를 보여 주고 누를 수 없게 함
    if (routine) {
      // 사용자가 입력한 글자는 안전하게 textContent로만 넣음
      text.textContent = routine.text;
      check.textContent = routine.done ? "✓" : "";
      task.disabled = false;
      task.setAttribute("aria-pressed", routine.done);
      removeButton.setAttribute("aria-label", routine.text + " 빼기");
    } else {
      text.textContent = "할 일 " + (index + 1);
      check.textContent = "";
      task.disabled = true;
      task.removeAttribute("aria-pressed");
    }

    // 칸 상태에 맞는 모양 붙이기 (빈칸, 체크됨)
    removeButton.hidden = !routine;
    task.classList.toggle("is-empty", !routine);
    task.classList.toggle("is-done", Boolean(routine && routine.done));
    row.classList.toggle("is-done", Boolean(routine && routine.done));
  });
}

// 손 그림과 진행 상황 바꾸기
function renderHand() {
  const doneCount = countDone();

  handProgress.textContent = doneCount + " / " + MAX_ROUTINES;
  handSvg.setAttribute("aria-label", "접힌 손가락 " + doneCount + "개");

  // 체크한 개수만큼 앞에서부터 손가락 접기
  fingers.forEach(function (finger, index) {
    finger.classList.toggle("is-folded", index < doneCount);
  });

  // 손 이미지 6장이 준비되어 있으면 임시 손 그림 대신 이미지 보여 주기
  if (handImages.length === MAX_ROUTINES + 1) {
    handSvg.classList.add("d-none");
    handImage.classList.remove("d-none");
    handImage.src = handImages[doneCount];
    handImage.alt = "접힌 손가락 " + doneCount + "개";
  }
}

// "리셋" 버튼: 체크를 모두 해제
resetButton.addEventListener("click", function () {
  // forEach: 목록의 모든 칸을 하나씩 돌며 같은 일을 함
  routines.forEach(function (routine) {
    routine.done = false;
  });
  renderAll();
});


/* =====================================================
   6. ADHD력 테스트
   ===================================================== */

let quizIndex = 0; // 지금 보여 주는 질문의 순서 (0부터 시작)
let quizScore = 0; // 지금까지 모은 점수
let quizLog = []; // 지금까지 고른 답을 순서대로 적어 둠 ("이전" 버튼에서 되돌릴 때 사용). [추가 수정 4] 한 칸의 모양: { score: 점수, choice: 고른 답 버튼 순서 }
let quizStarted = false;   // [추가 수정 4] 시작 전 안내 화면을 이미 지났는지
let quizPrevChoice = null; // [추가 수정 4] "이전"으로 돌아왔을 때 방금 고른 답 버튼의 순서 (은은하게 표시)
let quizLastIndex = 0;     // [추가 수정 4] 진행 막대가 이전 위치에서 차오르게 하려고 직전 질문 순서를 기억

// 서비스 소개 섹션으로 가는 글자 링크 만들기
function createQuizAboutLink() {
  const link = document.createElement("a");
  link.className = "quiz-link";
  link.href = "#about";
  link.textContent = "건강한 루틴을 만들어 보고 싶다면 →";
  return link;
}

// 지금 순서의 질문 보여 주기
function renderQuestion() {
  // [추가 수정 4] 처음 한 번은 시작 전 안내 화면을 보여 줌
  if (!quizStarted) {
    renderQuizIntro();
    return;
  }
  // 칸을 비우고 새 내용을 그림. 한 칸 안에서 내용이 바뀌는 방식
  quizBox.innerHTML = "";

  const step = document.createElement("p");
  step.className = "quiz-step";
  // [수정] 표시 글자를 "질문 1 / 5"에서 "순서 1 / 5"로 바꿈
  step.textContent = "순서 " + (quizIndex + 1) + " / " + quizQuestions.length;

  // [추가 수정 4] 진행 막대: 가는 청록색 막대가 질문마다 차오름 (직전 위치에서 새 위치로 움직임)
  const bar = document.createElement("div");
  bar.className = "quiz-progress";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", quizQuestions.length);
  bar.setAttribute("aria-valuenow", quizIndex);
  const barFill = document.createElement("div");
  barFill.className = "quiz-progress-fill";
  barFill.style.width = (quizLastIndex / quizQuestions.length) * 100 + "%";
  bar.appendChild(barFill);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      barFill.style.width = (quizIndex / quizQuestions.length) * 100 + "%";
      quizLastIndex = quizIndex;
    });
  });

  const question = document.createElement("p");
  question.className = "quiz-question";
  question.textContent = quizQuestions[quizIndex];

  const answers = document.createElement("div");
  answers.className = "quiz-answers";

  // 답 버튼 만들기: 누르면 점수를 더하고 다음 질문이나 결과로 넘어감
  quizAnswers.forEach(function (answer, answerIndex) {
    const button = document.createElement("button");
    button.type = "button";
    // [수정] 채운 청록색 버튼(btn-teal) 대신 테두리 버튼(btn-outline-teal)으로 바꿈: 흰 바탕에서 선이 보이고, 마우스를 올리면 색이 채워짐
    // quiz-answer: 버튼 크기를 글자에 맞게 줄이는 클래스 (style.css)
    button.className = "btn btn-outline-teal quiz-answer";
    button.textContent = answer.label;
    // [추가 수정 4] "이전"으로 돌아왔을 때, 방금 고른 답을 은은하게 표시
    if (quizPrevChoice === answerIndex) {
      button.classList.add("is-previous");
    }

    button.addEventListener("click", function () {
      // [추가 수정] 모바일(터치)에서도 누른 버튼의 색이 바뀌어 보이도록:
      // 누른 버튼에 is-selected(색 채움)를 붙이고, 0.25초 뒤에 다음 질문으로 넘어감.
      // (예전에는 누르자마자 질문이 바뀌어서 터치 화면에서는 색 변화를 볼 수 없었음)
      if (quizBox.classList.contains("is-busy")) {
        return; // 넘어가는 중에 한 번 더 눌러도 점수가 두 번 더해지지 않게 막음
      }
      quizBox.classList.add("is-busy");
      button.classList.add("is-selected");

      setTimeout(function () {
        quizBox.classList.remove("is-busy");
        quizScore += answer.score;
        quizLog.push({ score: answer.score, choice: answerIndex }); // 방금 고른 답을 기록
        quizIndex += 1;

        if (quizIndex < quizQuestions.length) {
          renderQuestion();
        } else {
          renderQuizResult();
        }
        // 키보드 사용자가 바뀐 내용을 바로 이어서 볼 수 있게 초점을 옮김
        quizBox.focus({ preventScroll: true });
      }, 250);
    });

    answers.appendChild(button);
  });

  // [수정] "이전" 버튼: 잘못 골랐을 때 앞 질문으로 돌아감. 첫 질문에서는 보이지 않고, 두 번째 질문부터 나타남
  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "btn btn-outline-teal quiz-prev";
  prevButton.textContent = "이전";
  // 첫 질문에서는 숨김. display가 아닌 visibility로 숨겨서 자리는 남겨 두므로, 질문이 바뀔 때 화면이 위아래로 덜컥 움직이지 않음
  prevButton.classList.toggle("is-hidden", quizIndex === 0);
  prevButton.addEventListener("click", function () {
    quizIndex -= 1; // 한 질문 앞으로
    const undone = quizLog.pop(); // 그 질문에서 고른 답을 기록에서 꺼냄
    quizScore -= undone.score;    // 더했던 점수를 뺌
    quizPrevChoice = undone.choice; // [추가 수정 4] 그 답을 은은하게 표시하려고 기억
    renderQuestion();
    quizBox.focus({ preventScroll: true });
  });

  quizPrevChoice = null; // 한 번 표시했으면 비움
  quizBox.append(step, bar, question, answers, prevButton, createQuizAboutLink());
}

// [추가 수정 4] 시작 전 안내 화면: 문항 수, 시간, 진단이 아니라는 점을 먼저 알림
function renderQuizIntro() {
  quizBox.innerHTML = "";

  const title = document.createElement("p");
  title.className = "quiz-intro-title";
  title.textContent = "나의 ADHD력, 지금 확인해 볼까요?";

  const info = document.createElement("p");
  info.className = "quiz-intro-info";
  info.textContent = quizIntroText;

  const start = document.createElement("button");
  start.type = "button";
  start.className = "btn btn-teal quiz-start";
  start.textContent = "시작하기";
  start.addEventListener("click", function () {
    quizStarted = true;
    quizLastIndex = 0;
    renderQuestion();
    quizBox.focus({ preventScroll: true });
  });

  quizBox.append(title, info, start);
}

// 마지막 질문 뒤에 결과 보여 주기
function renderQuizResult() {
  // [수정] 총점에 맞는 결과 단계 찾기 (find: 조건에 처음 맞는 칸을 돌려줌)
  const level = quizLevels.find(function (item) {
    return quizScore <= item.max;
  });

  quizBox.innerHTML = "";

  // [수정] 단계 이름 (예: LEVEL 2 · ADHD력 중간)
  const label = document.createElement("p");
  label.className = "quiz-result-label";
  label.textContent = level.label;
  label.style.backgroundColor = level.color; // [추가 수정 4] 결과 색 포인트(알약 모양 배경)

  // [수정] 단계 이름과 멘트 사이에 들어가는 결과 그림
  const picture = document.createElement("img");
  picture.className = "quiz-result-image";
  picture.src = level.image;
  picture.alt = level.imageAlt;

  // [수정] 큰 한 줄 멘트 (단계마다 다른 문구)
  const title = document.createElement("h3");
  title.className = "quiz-result-title";
  title.textContent = level.title;

  // [수정] 멘트 아래 짧은 설명 (단계마다 다른 문구)
  const text = document.createElement("p");
  text.className = "quiz-result-sub";
  text.textContent = level.text;

  // [수정] 안내 문구는 showNotice가 true인 단계(중간, 높음)에서만 만듦
  let notice = null;
  if (level.showNotice) {
    notice = document.createElement("p");
    notice.className = "quiz-notice-text";
    notice.textContent = quizNoticeText;
  }

  // [추가 수정 4] 결과별 한 줄 팁
  const tip = document.createElement("p");
  tip.className = "quiz-tip";
  tip.textContent = level.tip;

  // [추가 수정 4] 높음 결과 아래 도움 안내 자리: 상담 전화(고정 안내) + 가까운 상담센터 찾기(준비 중, 위치 기반은 나중에 구현)
  let help = null;
  if (level.showHelp) {
    help = document.createElement("div");
    help.className = "quiz-help";
    const phone = document.createElement("span");
    phone.className = "quiz-help-phone";
    phone.textContent = quizHelpPhone;
    const find = document.createElement("button");
    find.type = "button";
    find.className = "quiz-help-find";
    find.disabled = true;
    find.textContent = "가까운 상담센터 찾기 (준비 중)";
    help.append(phone, find);
  }

  // [추가 수정 4] "오늘 루틴 5개 만들어 보기": 결과와 상관없이 루틴 체험(섹션 2, #try)으로 이동
  const routineButton = document.createElement("a");
  routineButton.className = "btn btn-teal quiz-routine";
  routineButton.href = "#try";
  routineButton.textContent = "오늘 루틴 5개 만들어 보기";
  routineButton.addEventListener("click", function () {
    // 이동한 뒤 입력칸에 바로 쓸 수 있게 초점을 옮김
    setTimeout(function () {
      routineInput.focus({ preventScroll: true });
    }, 600);
  });

  // [수정] "다시 테스트하기" 버튼: 누르면 점수와 질문 순서를 처음으로 되돌리고 첫 질문을 다시 보여 줌
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "btn btn-teal quiz-retry";
  retryButton.textContent = "다시 테스트하기";
  retryButton.addEventListener("click", function () {
    quizIndex = 0; // 질문 순서를 처음(첫 번째 질문)으로
    quizScore = 0; // 모아 둔 점수도 0으로
    quizLog = []; // [수정] 답 기록도 비움
    quizPrevChoice = null;
    quizLastIndex = 0;
    renderQuestion(); // [추가 수정 4] 시작 전 안내는 이미 봤으므로 바로 첫 질문으로
    // 키보드 사용자가 바뀐 내용을 바로 이어서 볼 수 있게 초점을 옮김
    quizBox.focus({ preventScroll: true });
  });

  // 칸에 넣는 순서: 단계, 그림, 멘트, 설명, 팁, (안내), (도움 안내), 버튼 두 개, 서비스 소개 링크
  quizBox.append(label, picture, title, text, tip);
  if (notice) {
    quizBox.append(notice); // 낮음 결과에서는 안내가 없으므로 건너뜀
  }
  if (help) {
    quizBox.append(help); // 높음 결과에서만
  }
  const buttonRow = document.createElement("div");
  buttonRow.className = "quiz-buttons";
  buttonRow.append(routineButton, retryButton);
  quizBox.append(buttonRow, createQuizAboutLink());
}


/* =====================================================
   7. 헤더와 회원가입 팝업
   ===================================================== */

// 가입 버튼: 실제로 가입되지 않고 안내 문구만 보여 줌
signupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  signupForm.classList.add("d-none");
  signupDone.classList.remove("d-none");
});

// 팝업이 닫히면 입력 내용을 지우고 처음 모습으로 되돌리기
signupModal.addEventListener("hidden.bs.modal", function () {
  signupForm.reset();
  signupForm.classList.remove("d-none");
  signupDone.classList.add("d-none");
});


/* =====================================================
   8. 화면 전체 다시 그리기 + 처음 실행
   ===================================================== */

// 데이터가 바뀔 때마다 이 함수를 불러서 화면을 맞춤
function renderAll() {
  renderTasks();
  renderHand();
}

// 페이지가 처음 열릴 때 화면을 그리고 첫 번째 질문을 보여 줌
renderAll();
renderQuestion();

// [추가 수정] iOS 사파리에서도 버튼을 누르는 동안 :active 색이 나오게 함 (빈 touchstart 등록)
document.addEventListener("touchstart", function () {}, { passive: true });
