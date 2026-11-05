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

// ADHD력 테스트 질문 (임시). 이 목록에 문장을 추가하면 질문이 늘어납니다.
const quizQuestions = [
  "임시 질문 1: 해야 할 일을 자주 미루나요?",
  "임시 질문 2: 물건을 자주 잃어버리나요?",
  "임시 질문 3: 한 가지 일에 집중하기 어렵나요?",
];

// 답 버튼 3개와 각 답의 점수 (임시)
const quizAnswers = [
  { label: "자주 그래요", score: 2 },
  { label: "가끔 그래요", score: 1 },
  { label: "거의 없어요", score: 0 },
];

// 만점의 몇 % 이상이면 "가능성이 높음"으로 볼지 정하는 기준 (임시)
const QUIZ_HIGH_RATE = 0.6;

// 테스트 결과 문구 (임시 문구)
const quizResultHigh = "ADHD 가능성이 높게 나왔어요. 전문가와 상담해 보는 것을 권해요.";
const quizResultLow = "ADHD 가능성이 낮게 나왔어요. (임시 문구)";
const quizNotice = "이 테스트는 진단이 아닙니다.";

// 테스트가 끝난 뒤 보여 주는 응원 문구 (결과가 높음·낮음이어도 똑같이 나옴)
const quizCareTitle = "괜찮아요, 혼자 해결하지 않아도 돼요.";
const quizCareSub = "나를 이해하는 것부터 변화는 시작돼요.";
const quizCareBody = [
  "집중이 어렵거나 계획대로 되지 않는다고 해서 잘못된 것은 아니에요. 이번 테스트는 나의 생활 습관을 돌아보는 작은 시작이에요.",
  "조금 더 정확하게 알아보고 싶거나 일상에서 어려움이 계속된다면 주변의 믿을 수 있는 어른이나 전문가에게 도움을 요청해도 괜찮아요.",
  "천천히, 나에게 맞는 방법을 찾아가면 돼요.",
];


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
  // 받을 수 있는 최고 점수 계산 (질문 수 x 가장 높은 답 점수)
  const maxScore = quizQuestions.length * quizAnswers[0].score;
  // 내 점수가 기준 이상이면 가능성 높음으로 판단
  const isHigh = quizScore / maxScore >= QUIZ_HIGH_RATE;

  quizBox.innerHTML = "";

  // 응원 문구: 제목, 부제목, 본문
  const title = document.createElement("h3");
  title.className = "quiz-result-title";
  title.textContent = quizCareTitle;

  const sub = document.createElement("p");
  sub.className = "quiz-result-sub";
  sub.textContent = quizCareSub;

  const body = document.createElement("div");
  body.className = "quiz-result-body";
  quizCareBody.forEach(function (line) {
    const p = document.createElement("p");
    p.textContent = line;
    body.appendChild(p);
  });

  const notice = document.createElement("p");
  notice.className = "quiz-notice";
  notice.textContent = quizNotice;

  quizBox.append(title, sub, body, notice, createQuizAboutLink());
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
