import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Quiz.css';

const Quiz = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    const [quizData, setQuizData] = useState(null);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [finalPercentage, setFinalPercentage] = useState(0);
    const [isPassed, setIsPassed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) navigate("/");
    }, [user, navigate]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const res = await fetch(`https://quiz-backend-68mu.onrender.com/api/quiz/quiz-by-code/${code}`);
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 403) setError(data.message);
                    else setError(data.message || "Quiz not found");
                    return;
                }
                setQuizData(data);
                if (data.duration) setTimeLeft(data.duration * 60);
            } catch (err) {
                setError("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        if (code && user) fetchQuiz();
    }, [code, user]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;
        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    autoSubmitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, isSubmitted]);

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionChange = (e) => {
        if (isSubmitted) return;
        const selectedValue = e.target.value;
        setAnswers({ ...answers, [index]: selectedValue });
    };

    const jumpToQuestion = (i) => setIndex(i);

    const submitQuiz = async () => {
        if (window.confirm("Submit your quiz? You cannot change answers after submission."))
            await processSubmission();
    };

    const autoSubmitQuiz = async () => {
        alert("Time's up! Auto-submitting.");
        await processSubmission();
    };

    const processSubmission = async () => {
        if (isSubmitted) return;
        try {
            const res = await fetch("https://quiz-backend-68mu.onrender.com/api/quiz/submit-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId: quizData._id,
                    studentId: user.regNo || user.id,
                    studentName: user.name,
                    answers: answers
                })
            });
            const data = await res.json();
            if (res.ok) {
                setFinalScore(data.score);
                setFinalPercentage(data.percentage || Math.round((data.score / data.totalMarks) * 100));
                setIsPassed(data.passed || (data.score / data.totalMarks) >= 0.5);
                setIsSubmitted(true);
            } else {
                alert(data.message || "Submission failed.");
            }
        } catch (err) {
            alert("Network error during submission.");
        }
    };

    if (loading) return <div className="quiz-loading"><div className="loading-spinner"></div><p>Loading quiz...</p></div>;
    if (error) return (
        <div className="quiz-error-container">
            <div className="error-card">
                <div className="error-icon">⏰</div>
                <h2>{error}</h2>
                <button className="back-btn" onClick={() => navigate("/studentdashboard")}>Back to Dashboard</button>
            </div>
        </div>
    );
    if (!quizData) return null;

    const currentQuestion = quizData.questions[index];
    const totalQuestions = quizData.questions.length;
    const answeredCount = Object.keys(answers).length;
    const isAllAnswered = answeredCount === totalQuestions;

    if (isSubmitted) {
        return (
            <div className="quiz-wrapper">
                <div className="quiz-container">
                    <div className="quiz-main">
                        <div className="result-area">
                            <div className="result-icon">{isPassed ? "🎉" : "📚"}</div>
                            <h2>{isPassed ? "Congratulations!" : "Quiz Completed!"}</h2>
                            <p>{isPassed ? "You passed!" : "Keep practicing."}</p>
                            <div className="score-circle">
                                <div className="score-number">{finalScore}</div>
                                <div className="score-total">/{quizData.questions.length}</div>
                            </div>
                            <div className="percentage-text">{finalPercentage}%</div>
                            <div className={`result-status ${isPassed ? "passed" : "failed"}`}>
                                {isPassed ? "PASSED" : "NEEDS IMPROVEMENT"}
                            </div>
                            <button className="dashboard-btn" onClick={() => navigate("/studentdashboard")}>Back to Dashboard</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-wrapper">
            <div className="quiz-container">
                {/* Sidebar */}
                <div className="quiz-sidebar">
                    <h3>Quiz Navigator</h3>
                    <p className="quiz-title">{quizData.title}</p>
                    <div className="question-grid">
                        {quizData.questions.map((_, i) => (
                            <div
                                key={i}
                                className={`grid-item ${index === i ? 'active' : ''} ${answers[i] ? 'answered' : ''}`}
                                onClick={() => jumpToQuestion(i)}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="sidebar-stats">
                        <div className="stat-item">
                            <span className="stat-label">Answered:</span>
                            <span className="stat-value">{answeredCount}/{totalQuestions}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Time left:</span>
                            <span className="stat-value timer-value">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                </div>

                {/* Main content with radio buttons */}
                <div className="quiz-main">
                    <div className="quiz-header">
                        <span className="question-counter">Question {index + 1} of {totalQuestions}</span>
                    </div>
                    <hr />
                    <h2>{currentQuestion.question}</h2>

                    <div className="options-radio-group">
                        {currentQuestion.options.map((opt, idx) => {
                            const optionLetter = String.fromCharCode(65 + idx);
                            const isChecked = answers[index] === opt;
                            return (
                                <label key={idx} className={`radio-option ${isChecked ? 'checked' : ''}`}>
                                    <input
                                        type="radio"
                                        name={`question-${index}`}
                                        value={opt}
                                        checked={isChecked}
                                        onChange={handleOptionChange}
                                        disabled={isSubmitted}
                                    />
                                    <span className="radio-custom"></span>
                                    <span className="radio-letter">{optionLetter}</span>
                                    <span className="radio-text">{opt}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="quiz-controls">
                        <button className="prev-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button>
                        {index < totalQuestions - 1 ? (
                            <button className="next-btn" onClick={() => setIndex(index + 1)}>Next →</button>
                        ) : (
                            <button className="submit-btn" onClick={submitQuiz}>Submit Quiz</button>
                        )}
                    </div>
                    <div className="index">
                        {!isAllAnswered && <span>⚠️ {totalQuestions - answeredCount} unanswered</span>}
                        {isAllAnswered && <span>✅ All answered – ready to submit!</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quiz;