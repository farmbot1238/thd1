// app.js - منطق اللعبة الرئيسي

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 40;
let audioContext;
let selectedAnswers = [];

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playWarningSound() {
    initAudio();
    if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.2;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

function shuffleArrayAdvanced(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    for (let k = 0; k < 3; k++) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    return array;
}

function selectBalancedQuestions(count) {
    const englishQs = questionsDatabase.filter(q => q.subject.includes("🇬🇧"));
    const arabicQs = questionsDatabase.filter(q => q.subject.includes("🇸🇦"));
    const islamicQs = questionsDatabase.filter(q => q.subject.includes("🕋"));
    const historyQs = questionsDatabase.filter(q => q.subject.includes("🏛️"));
    
    const perSubject = Math.floor(count / 4);
    let remaining = count - (perSubject * 4);
    
    let selectedQuestions = [];
    
    selectedQuestions.push(...shuffleArrayAdvanced([...englishQs]).slice(0, perSubject));
    selectedQuestions.push(...shuffleArrayAdvanced([...arabicQs]).slice(0, perSubject));
    selectedQuestions.push(...shuffleArrayAdvanced([...islamicQs]).slice(0, perSubject));
    selectedQuestions.push(...shuffleArrayAdvanced([...historyQs]).slice(0, perSubject));
    
    if (remaining > 0) {
        const extraPools = [
            [...englishQs.slice(perSubject)],
            [...arabicQs.slice(perSubject)],
            [...islamicQs.slice(perSubject)],
            [...historyQs.slice(perSubject)]
        ];
        
        extraPools.forEach(p => shuffleArrayAdvanced(p));
        
        for (let i = 0; i < remaining; i++) {
            const poolIndex = i % 4;
            if (extraPools[poolIndex].length > 0) {
                selectedQuestions.push(extraPools[poolIndex][0]);
                extraPools[poolIndex].shift();
            }
        }
    }
    
    return shuffleArrayAdvanced(selectedQuestions);
}

function startQuiz() {
    const countInput = document.getElementById('questionCount');
    const count = parseInt(countInput.value);
    
    if (count < 1 || count > 50) {
        alert('الرجاء إدخال عدد أسئلة بين 1 و 50');
        return;
    }

    currentQuestions = selectBalancedQuestions(count);
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    selectedAnswers = new Array(count).fill(null);

    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultsScreen').classList.add('hidden');

    updateQuestionCounter();
    showQuestion();
}

function updateQuestionCounter() {
    const counter = document.getElementById('questionCounter');
    counter.textContent = `السؤال ${currentQuestionIndex + 1} من ${currentQuestions.length}`;
}

function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        calculateFinalScore();
        showResults();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('subjectDisplay').textContent = question.subject;
    document.getElementById('question').textContent = question.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (selectedAnswers[currentQuestionIndex] === index) {
            optionDiv.classList.add('selected');
        }
        optionDiv.textContent = option;
        optionDiv.onclick = () => selectAnswer(index);
        optionsDiv.appendChild(optionDiv);
    });

    const answeredCount = selectedAnswers.filter(a => a !== null).length;
    const progress = ((answeredCount) / currentQuestions.length) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.textContent = Math.round(progress) + '%';

    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;

    if (timerInterval) clearInterval(timerInterval);
    timeLeft = 40;
    updateTimer();
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();

        if (timeLeft <= 7 && timeLeft >= 1) {
            playWarningSound();
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (selectedAnswers[currentQuestionIndex] === null) {
                selectedAnswers[currentQuestionIndex] = -1;
            }
            currentQuestionIndex++;
            updateQuestionCounter();
            showQuestion();
        }
    }, 1000);
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 7) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.remove('warning');
    }
}

function selectAnswer(index) {
    clearInterval(timerInterval);
    selectedAnswers[currentQuestionIndex] = index;
    
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    event.target.classList.add('selected');

    setTimeout(() => {
        currentQuestionIndex++;
        updateQuestionCounter();
        showQuestion();
    }, 300);
}

function goToPrevQuestion() {
    if (currentQuestionIndex > 0) {
        clearInterval(timerInterval);
        currentQuestionIndex--;
        updateQuestionCounter();
        showQuestion();
    }
}

function calculateFinalScore() {
    score = 0;
    userAnswers = [];
    
    for (let i = 0; i < currentQuestions.length; i++) {
        const selected = selectedAnswers[i];
        const isCorrect = selected !== null && selected !== -1 && selected === currentQuestions[i].correct;
        if (isCorrect) score++;
        
        userAnswers.push({
            question: currentQuestions[i],
            selected: selected !== null && selected !== -1 ? selected : -1,
            correct: isCorrect
        });
    }
}

function showResults() {
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultsScreen').classList.remove('hidden');

    const totalQuestions = currentQuestions.length;
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `${score}/${totalQuestions}`;
    
    const percentage = (score / totalQuestions) * 100;
    document.getElementById('percentage').textContent = percentage.toFixed(1) + '%';
    
    const percentageCircle = document.getElementById('percentageCircle');
    percentageCircle.textContent = Math.round(percentage) + '%';
    
    const angle = (percentage / 100) * 360;
    percentageCircle.style.background = `conic-gradient(#27ae60 0deg, #27ae60 ${angle}deg, #e67e22 ${angle}deg)`;

    const answersReview = document.getElementById('answersReview');
    answersReview.innerHTML = '<h3 style="margin-bottom: 20px; color: #2c3e50;">📝 مراجعة الإجابات</h3>';

    userAnswers.forEach((item, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = `answer-item ${item.correct ? 'correct' : 'incorrect'}`;
        
        let selectedText = item.selected === -1 ? 'لم تجب' : item.question.options[item.selected];
        
        answerDiv.innerHTML = `
            <span class="subject-review">${item.question.subject}</span>
            <p><strong>سؤال ${index + 1}:</strong> ${item.question.question}</p>
            <p><strong>إجابتك:</strong> ${selectedText}</p>
            <p><strong>الإجابة الصحيحة:</strong> ${item.question.options[item.question.correct]}</p>
        `;
        
        answersReview.appendChild(answerDiv);
    });
}

function resetQuiz() {
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('setupScreen').classList.remove('hidden');
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultsScreen').classList.add('hidden');
}

// ربط الأحداث
document.getElementById('startBtn').addEventListener('click', startQuiz);
document.getElementById('resetBtn').addEventListener('click', resetQuiz);
document.getElementById('prevBtn').addEventListener('click', goToPrevQuestion);
