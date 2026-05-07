import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef(null);

  // ================= PROFILE STATES =================
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const [profile, setProfile] = useState({
    name: user?.name || "Teacher",
    email: user?.email || "teacher@gmail.com",
    phone: user?.phone || "Not provided",
    qualification: user?.qualification || "Not provided",
    photo: null,
  });

  const [editForm, setEditForm] = useState({ ...profile });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ================= QUIZ STATES =================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);

  // ================= SIDE EFFECTS =================
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchTeacherQuizzes();
    fetchTeacherSubmissions();
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".profile-section")) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Auto-set end time when start time changes (add 1 hour default)
  useEffect(() => {
    if (startTime && !endTime) {
      const start = new Date(startTime);
      const defaultEnd = new Date(start.getTime() + 60 * 60 * 1000);
      setEndTime(defaultEnd.toISOString().slice(0, 16));
    }
  }, [startTime, endTime]);

  // ================= FETCH TEACHER DATA =================
  const fetchTeacherQuizzes = async () => {
    try {
      const response = await fetch(`https://quiz-backend-68mu.onrender.com/api/quiz/quizzes`);
      if (response.ok) {
        const data = await response.json();
        const teacherQuizzes = data.filter(quiz => quiz.createdBy === user?.id);
        setQuizzes(teacherQuizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchTeacherSubmissions = async () => {
    try {
      const response = await fetch(`https://quiz-backend-68mu.onrender.com/api/quiz/teacher-stats/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  // ================= PROFILE LOGIC =================
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (showPasswordFields) {
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        alert("Please fill all password fields");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("New passwords do not match!");
        return;
      }
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `https://quiz-backend-68mu.onrender.com/api/auth/update-profile/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editForm,
            ...(showPasswordFields && {
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword,
            }),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProfile(editForm);
        const updatedUser = { ...user, ...editForm };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("Profile updated successfully!");
        setShowEditModal(false);
        setShowDropdown(false);
        setShowPasswordFields(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Network error. Could not connect to server.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ================= QUIZ LOGIC =================
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (index, value) => {
    const updated = [...questions];
    updated[index].correctAnswer = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: "" }]);
  };

  const deleteQuestion = (index) => {
    if (questions.length === 1) {
      alert("You need at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // NEW: Helper to set start time to "now - 1 minute" and end time to "now + 1 hour"
  const setStartNow = () => {
    const now = new Date();
    // Set start to 1 minute ago (ensures quiz is already active)
    const startDate = new Date(now.getTime() - 60 * 1000);
    // Set end to 1 hour from now (gives plenty of time)
    const endDate = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(startDate.toISOString().slice(0, 16));
    setEndTime(endDate.toISOString().slice(0, 16));
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      alert("Please enter a quiz title");
      return false;
    }
    if (!startTime) {
      alert("Please select start time or use 'Start Now'");
      return false;
    }
    if (!endTime) {
      alert("Please select end time");
      return false;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      alert("End time must be after start time");
      return false;
    }
    
    if (duration < 10 || duration > 60) {
      alert("Duration must be between 10 and 60 minutes");
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`);
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Option ${j + 1} in Question ${i + 1} is empty`);
          return false;
        }
      }
      if (!q.correctAnswer) {
        alert(`Please select correct answer for Question ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handlePublishQuiz = async () => {
    if (!validateQuiz()) return;

    // Convert local datetime strings to UTC ISO strings
    const localStart = new Date(startTime);
    const localEnd = new Date(endTime);
    const utcStart = localStart.toISOString();
    const utcEnd = localEnd.toISOString();

    setIsPublishing(true);
    try {
      const response = await fetch("https://quiz-backend-68mu.onrender.com/api/quiz/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          createdBy: user?.id,
          startTime: utcStart,
          endTime: utcEnd,
          duration: Number(duration),
          questions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCode(data.quizCode);
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        setDuration(30);
        setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: "" }]);
        fetchTeacherQuizzes();
        alert("Quiz created successfully!");
      } else {
        alert(data.message || "Failed to create quiz");
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("Publish failed. Check your connection.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getQuizStats = () => {
    const totalQuizzes = quizzes.length;
    const totalSubmissions = submissions.length;
    const avgScore = submissions.length > 0
      ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length).toFixed(1)
      : 0;
    return { totalQuizzes, totalSubmissions, avgScore };
  };

  const stats = getQuizStats();

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setActiveTab("create")}>
          <div style={{ width: "40px", height: "40px", background: "var(--primary-gradient)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "20px", color: "white" }}>QP</div>
          <h2 style={{ margin: 0 }}>Quiz<span style={{ color: "var(--primary)" }}>Pro</span></h2>
        </div>

        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="instructor-name">Instructor: {profile.name}</span>
            <div className="avatar-circle">
              {profile.photo ? <img src={profile.photo} alt="DP" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.name.charAt(0)}
            </div>
          </div>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar-large">
                  {profile.photo ? <img src={profile.photo} alt="DP" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.name.charAt(0)}
                </div>
                <h4>{profile.name}</h4>
                <p>{profile.email}</p>
              </div>
              <div className="dropdown-body">
                <div className="info-row"><span>📞</span> {profile.phone}</div>
                <div className="info-row"><span>🎓</span> {profile.qualification}</div>
              </div>
              <button className="edit-profile-btn" onClick={() => { setShowEditModal(true); setShowDropdown(false); setEditForm(profile); }}>
                Edit Profile
              </button>
              <button className="logout-link" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* TABS */}
      <div style={{ padding: "0 5%" }}>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>📝 Create Quiz</button>
          <button className={`tab-btn ${activeTab === "quizzes" ? "active" : ""}`} onClick={() => setActiveTab("quizzes")}>📚 My Quizzes</button>
          <button className={`tab-btn ${activeTab === "submissions" ? "active" : ""}`} onClick={() => setActiveTab("submissions")}>📊 Submissions</button>
          <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>📈 Analytics</button>
        </div>
      </div>

      {/* CREATE QUIZ TAB */}
      {activeTab === "create" && (
        <div style={{ padding: "0 5% 50px 5%" }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: "25px" }}>
              <h3 style={{ margin: 0 }}>Create New Quiz</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Define your quiz settings and add your questions below.
              </p>
            </div>

            <div className="form-group">
              <label>Quiz Title</label>
              <input className="modern-input" placeholder="e.g., Introduction to React" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="modern-textarea" placeholder="What should students expect?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* TIME AND DURATION CONTROLS */}
            <div className="datetime-row">
              <div className="form-group">
                <label>Start Date & Time</label>
                <input type="datetime-local" className="modern-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label>End Date & Time</label>
                <input type="datetime-local" className="modern-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>

              {/* NEW: "Start Now" button */}
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="button" onClick={setStartNow} style={{ padding: "12px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
                  ⚡ Start Now (Immediate)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Quiz Duration (10-60 minutes)</label>
              <div className="duration-input">
                <input 
                  type="number" 
                  className="modern-input" 
                  min="10" 
                  max="60" 
                  value={duration} 
                  onChange={(e) => setDuration(parseInt(e.target.value))} 
                />
                <span className="duration-unit">minutes</span>
              </div>
            </div>

            {/* QUESTIONS SECTION */}
            <div className="questions-header">
              <h4 style={{ margin: 0 }}>Questions</h4>
              <button className="btn-secondary" onClick={addQuestion}>+ Add Question</button>
            </div>

            {questions.map((q, index) => (
              <div key={index} className="question-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <span className="question-number">Question {index + 1}</span>
                  {questions.length > 1 && (
                    <button className="remove-question" onClick={() => deleteQuestion(index)}>Remove</button>
                  )}
                </div>

                <input className="modern-input" placeholder="Enter your question text..." value={q.question} onChange={(e) => handleQuestionChange(index, e.target.value)} />

                <div className="options-grid">
                  {q.options.map((opt, i) => (
                    <div key={i} className="option-input">
                      <span className="option-letter">{String.fromCharCode(65 + i)}.</span>
                      <input className="modern-input" style={{ marginBottom: 0 }} placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(index, i, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="correct-option">
                  <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Correct Answer:</label>
                  <select value={q.correctAnswer} onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}>
                    <option value="">Select correct answer...</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt} disabled={!opt.trim()}>
                        {String.fromCharCode(65 + i)}. {opt || `Option ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* PUBLISHING SECTION */}
            <div style={{ marginTop: "30px", borderTop: "1px solid var(--border)", paddingTop: "25px", textAlign: "center" }}>
              {!generatedCode ? (
                <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                  <button className="btn-primary" onClick={handlePublishQuiz} disabled={isPublishing}>
                    {isPublishing ? "⏳ Publishing..." : "🚀 Publish Quiz"}
                  </button>
                </div>
              ) : (
                <div className="code-display-section" style={{ animation: "popIn 0.5s ease-out" }}>
                  <div className="code-display">{generatedCode}</div>
                  <button className="btn-primary" onClick={handleCopyCode}>
                    {isCopied ? "✅ Copied!" : "📋 Copy Quiz Code"}
                  </button>
                  <button className="btn-secondary" onClick={() => setGeneratedCode("")} style={{ marginLeft: "10px" }}>
                    Create Another Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY QUIZZES TAB */}
      {activeTab === "quizzes" && (
        <div style={{ padding: "0 5% 50px 5%" }}>
          <div className="card">
            <h3>My Quizzes</h3>
            {quizzes.length === 0 ? (
              <div className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📚</div>
                <p>You haven't created any quizzes yet.</p>
                <button className="btn-primary" onClick={() => setActiveTab("create")}>Create Your First Quiz</button>
              </div>
            ) : (
              <div className="quiz-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-item">
                    <div className="quiz-title">{quiz.title}</div>
                    <div className="quiz-meta">
                      <span>📋 {quiz.questions.length} questions</span>
                      <span>⏱️ {quiz.duration} min</span>
                    </div>
                    <div className="quiz-code-badge">Code: {quiz.quizCode}</div>
                    <div className="quiz-meta">
                      <span>📅 {new Date(quiz.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === "submissions" && (
        <div style={{ padding: "0 5% 50px 5%" }}>
          <div className="card">
            <h3>Student Submissions</h3>
            {submissions.length === 0 ? (
              <div className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📊</div>
                <p>No submissions yet. Share quiz codes with students.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Quiz Title</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, idx) => (
                      <tr key={idx}>
                        <td>{sub.studentName}</td>
                        <td>{sub.quizTitle}</td>
                        <td>{sub.score} / {sub.totalMarks}</td>
                        <td>
                          <span className="score-badge">
                            {Math.round((sub.score / sub.totalMarks) * 100)}%
                          </span>
                        </td>
                        <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div style={{ padding: "0 5% 50px 5%" }}>
          <div className="analytics-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalQuizzes}</div>
              <div className="stat-label">Total Quizzes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalSubmissions}</div>
              <div className="stat-label">Total Submissions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgScore}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
          
          <div className="card">
            <h3>Recent Activity</h3>
            {submissions.slice(0, 10).map((sub, idx) => (
              <div key={idx} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <strong>{sub.studentName}</strong> scored {sub.score}/{sub.totalMarks} on <strong>{sub.quizTitle}</strong>
              </div>
            ))}
            {submissions.length === 0 && <p>No recent activity.</p>}
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px" }}>Update Profile</h3>
            <div className="photo-upload-section" onClick={() => fileInputRef.current.click()}>
              <div className="avatar-large" style={{ cursor: "pointer" }}>
                {editForm.photo ? <img src={editForm.photo} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : editForm.name.charAt(0)}
                <div className="photo-overlay">Change Photo</div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="modal-inputs">
              <input className="modern-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" />
              <input className="modern-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
              <input className="modern-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone Number" />
              <input className="modern-input" value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} placeholder="Qualification" />
            </div>

            <button className="toggle-password-btn" onClick={() => setShowPasswordFields(!showPasswordFields)}>
              {showPasswordFields ? "− Cancel Password Change" : "+ Change Password"}
            </button>

            {showPasswordFields && (
              <div className="password-section">
                <input type="password" className="modern-input" placeholder="Current Password" onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                <input type="password" className="modern-input" placeholder="New Password" onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                <input type="password" className="modern-input" placeholder="Confirm New Password" onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowEditModal(false); setShowPasswordFields(false); }}>Cancel</button>
              <button className="btn-primary" onClick={saveProfile} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}