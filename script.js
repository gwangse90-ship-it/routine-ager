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

// [수정] ADHD력 테스트 질문 5개. 이 목록에 문장을 추가하면 질문이 늘어납니다.
const quizQuestions = [
  "해야 할 일을 알고 있는데도 자꾸 미루나요?",
  "방금까지 가지고 있던 물건을 어디에 뒀는지 자주 까먹나요?",
  "공부나 과제를 하다가 다른 생각에 빠져 집중이 흐트러지나요?",
  "다른 사람이 말할 때 끝까지 듣지 못하고 중간에 끼어들거나 딴생각을 하나요?",
  "가만히 앉아 있기 어렵거나 무언가를 계속 만지작거리나요?",
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
//  - label: 결과 위에 작게 보이는 단계 이름 / title: 큰 한 줄 멘트 / text: 짧은 설명
const quizLevels = [
  {
    max: 3,
    label: "LEVEL 1 · ADHD력 낮음",
    title: "“ADHD력? 오늘은 조용하네.”",
    text: "뇌가 제법 평화롭습니다. 이 정도면 일단 순항 중!",
  },
  {
    max: 7,
    label: "LEVEL 2 · ADHD력 중간",
    title: "“ADHD 호소인? 살짝 의심스럽군.”",
    text: "집중력과 딴생각이 치열한 눈치게임 중!",
  },
  {
    max: 10,
    label: "LEVEL 3 · ADHD력 높음",
    title: "“뇌 속에 탭을 27개 켜두셨나요?”",
    text: "ADHD력 높은 편! 혼자 고민하지 말고 전문가와 이야기해 봐요.",
  },
];

// [수정] 모든 결과 아래에 아주 작은 글씨로 나오는 공통 안내
const quizNoticeTitle = "잠깐! 이 테스트는 진단이 아닙니다.";
const quizNoticeText =
  "이 결과는 일상 속 행동을 가볍게 돌아보기 위한 참고 자료입니다. 점수가 높다고 ADHD라는 뜻은 아니며, 정확한 진단은 전문의와 상담해 주세요.";


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
  // 칸을 비우고 새 내용을 그림. 한 칸 안에서 내용이 바뀌는 방식
  quizBox.innerHTML = "";

  const step = document.createElement("p");
  step.className = "quiz-step";
  step.textContent = "질문 " + (quizIndex + 1) + " / " + quizQuestions.length;

  const question = document.createElement("p");
  question.className = "quiz-question";
  question.textContent = quizQuestions[quizIndex];

  const answers = document.createElement("div");
  answers.className = "quiz-answers";

  // 답 버튼 만들기: 누르면 점수를 더하고 다음 질문이나 결과로 넘어감
  quizAnswers.forEach(function (answer) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-teal";
    button.textContent = answer.label;

    button.addEventListener("click", function () {
      quizScore += answer.score;
      quizIndex += 1;

      if (quizIndex < quizQuestions.length) {
        renderQuestion();
      } else {
        renderQuizResult();
      }
      // 키보드 사용자가 바뀐 내용을 바로 이어서 볼 수 있게 초점을 옮김
      quizBox.focus({ preventScroll: true });
    });

    answers.appendChild(button);
  });

  quizBox.append(step, question, answers, createQuizAboutLink());
}

// 마지막 질문 뒤에 결과 보여 주기
function renderQuizResult() {
  // [수정] 총점에 맞는 결과 단계 찾기 (find: 조건에 처음 맞는 칸을 돌려줌)
  const level = quizLevels.find(function (item) {
    return quizScore <= item.max;
  });

  quizBox.innerHTML = "";

  // 단계 이름 (예: LEVEL 2 · ADHD력 중간)
  const label = document.createElement("p");
  label.className = "quiz-result-label";
  label.textContent = level.label;

  // 큰 한 줄 멘트
  const title = document.createElement("h3");
  title.className = "quiz-result-title";
  title.textContent = level.title;

  // 짧은 설명
  const text = document.createElement("p");
  text.className = "quiz-result-sub";
  text.textContent = level.text;

  // [수정] 공통 안내: 제목 + 설명을 아주 작은 글씨로
  const notice = document.createElement("div");
  notice.className = "quiz-notice-box";
  const noticeTitle = document.createElement("p");
  noticeTitle.className = "quiz-notice-title";
  noticeTitle.textContent = quizNoticeTitle;
  const noticeText = document.createElement("p");
  noticeText.className = "quiz-notice-text";
  noticeText.textContent = quizNoticeText;
  notice.append(noticeTitle, noticeText);

  // "다시 테스트하기" 버튼: 누르면 점수와 질문 순서를 처음으로 되돌리고 첫 질문을 다시 보여 줌
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "btn btn-teal quiz-retry";
  retryButton.textContent = "다시 테스트하기";
  retryButton.addEventListener("click", function () {
    quizIndex = 0; // 질문 순서를 처음(첫 번째 질문)으로
    quizScore = 0; // 모아 둔 점수도 0으로
    renderQuestion();
    // 키보드 사용자가 바뀐 내용을 바로 이어서 볼 수 있게 초점을 옮김
    quizBox.focus({ preventScroll: true });
  });

  // 칸에 넣는 순서: 단계, 멘트, 설명, 공통 안내, 루틴 만들기 링크, 다시 테스트하기 버튼
  quizBox.append(label, title, text, notice, createQuizAboutLink(), retryButton);
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
