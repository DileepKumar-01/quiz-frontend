import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api'; 
import './Quiz.css';

const Quiz = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    
    // Retrieve and parse user data safely
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    const [quizData, setQuizData] = useState(null);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({}); 
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        // Redirect if student session is missing
        if (!user) {
            navigate("/");
            return;
        }

        const fetchQuiz = async () => {
            try {
                // ✅ FIXED: Using /quiz/ prefix to match backend routes
                const res = await api.get(`/quiz/quiz-by-code/${code}`);
                setQuizData(res.data);
                
                // Initialize countdown timer based on database duration
                if (res.data.duration) {
                    setTimeLeft(res.data.duration * 60);
                }
            } catch (err) {
                // Handle 403 (wrong time) or 404 (wrong code) from backend
                alert(err.response?.data?.message || "Error connecting to server");
                navigate("/studentdashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [code, navigate]);

    useEffect(() => {
        if (timeLeft === null || isSubmitted) return;

        if (timeLeft <= 0) {
            autoSubmitQuiz(); 
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, isSubmitted]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionClick = (option) => {
        if (isSubmitted) return;
        setAnswers({ ...answers, [index]: option });
    };

    const jumpToQuestion = (i) => {
        setIndex(i);
    };

    const submitQuiz = async () => {
        if (window.confirm("Ready to complete the quiz?")) {
            await processSubmission();
        }
    };

    const autoSubmitQuiz = async () => {
        alert("Time is up! Submitting your answers automatically.");
        await processSubmission();
    };

    const processSubmission = async () => {
        try {
            // ✅ FIXED: Using /quiz/ prefix to match backend routes
            const res = await api.post("/quiz/submit-quiz", {
                quizId: quizData._id,
                studentId: user.id || user._id, 
                studentName: user.name,
                answers: answers
            });
            setFinalScore(res.data.score);
            setIsSubmitted(true);
        } catch (err) {
            alert("Submission failed. Check connection.");
        }
    };

    if (loading) return <div className="loader">Loading Quiz Assessment...</div>;
    if (!quizData) return null;

    const currentQuestion = quizData.questions[index];

    return (
        <div className='quiz-page-layout'>
            <div className="quiz-sidebar">
                <h3>Quiz Progress</h3>
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

                {!isSubmitted && (
                    <div className={`timer-display ${timeLeft < 60 ? 'timer-warning' : ''}`}>
                        Time Remaining: {formatTime(timeLeft)}
                    </div>
                )}
                <div className="status-summary">
                    <p>Status: {Object.keys(answers).length} of {quizData.questions.length} answered</p>
                </div>
            </div>

            <div className="quiz-main-container">
                <h1>{quizData.title}</h1>
                <hr />
                {!isSubmitted ? (
                    <>
                        <div className="question-display">
                            <h2>{index + 1}. {currentQuestion.question}</h2>
                            <ul className="options-list">
                                {currentQuestion.options.map((opt, i) => {
                                    let feedbackClass = (answers[index] === opt) ? "selected-opt" : "";
                                    return (
                                        <li key={i} className={feedbackClass} onClick={() => handleOptionClick(opt)}>
                                            {opt}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div className="nav-controls">
                            <button className="prev-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
                            {index < quizData.questions.length - 1 ? (
                                <button className="next-btn" onClick={() => setIndex(index + 1)}>Next Question</button>
                            ) : (
                                <button className="complete-btn" onClick={submitQuiz}>Finalize & Submit</button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="results-container">
                        <h2>Assessment Complete!</h2>
                        <div className="final-score">
                            <span className="score-num">{finalScore}</span> / {quizData.questions.length}
                        </div>
                        <button className="back-btn" onClick={() => navigate("/studentdashboard")}>Return to Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Quiz;