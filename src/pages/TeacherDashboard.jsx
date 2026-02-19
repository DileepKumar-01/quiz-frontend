import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TeacherAnalytics from "../components/TeacherAnalytics";
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
  const [duration, setDuration] = useState(30); // NEW: Duration state (Default 30 mins)
  const [generatedCode, setGeneratedCode] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);

  // ================= SIDE EFFECTS =================
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".profile-section")) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

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
      // ✅ MODIFIED URL BELOW
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
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Profile updated successfully!");
        setShowEditModal(false);
        setShowDropdown(false);
        setShowPasswordFields(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (error) {
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
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handlePublishQuiz = async () => {
    // Validation for Time and Duration
    if (!title || !startTime || !endTime) {
      alert("Please fill all quiz details");
      return;
    }

    if (duration < 10 || duration > 60) {
      alert("Quiz duration must be between 10 and 60 minutes.");
      return;
    }

    setIsPublishing(true);
    try {
      // ✅ MODIFIED URL BELOW
      const response = await fetch("https://quiz-backend-68mu.onrender.com/api/quiz/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          createdBy: user?.id,
          startTime,
          endTime,
          duration: Number(duration), // Sending the duration to backend
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
      } else {
        alert(data.message);
      }
    } catch (error) {
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

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <h2 style={{ margin: 0 }}>
          Quiz<span style={{ color: "var(--primary)" }}>Pro</span>
        </h2>

        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="instructor-name">Instructor: {profile.name}</span>
            <div className="avatar-circle">
              {profile.photo ? <img src={profile.photo} alt="DP" /> : profile.name.charAt(0)}
            </div>
          </div>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar-large">
                  {profile.photo ? <img src={profile.photo} alt="DP" /> : profile.name.charAt(0)}
                </div>
                <h4>{profile.name}</h4>
                <p>{profile.email}</p>
              </div>
              <div className="dropdown-body">
                <div className="info-row"><span>☎</span> {profile.phone}</div>
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

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="profile-modal" style={{ maxWidth: "450px" }}>
            <h3>Update Profile</h3>
            <div className="photo-upload-section">
              <div className="avatar-large" style={{ cursor: "pointer" }} onClick={() => fileInputRef.current.click()}>
                {editForm.photo ? <img src={editForm.photo} alt="Preview" /> : editForm.name.charAt(0)}
                <div className="photo-overlay">Change</div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="modal-inputs">
              <input className="modern-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" />
              <input className="modern-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
              <input className="modern-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone Number" />
              <input className="modern-input" value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} placeholder="Qualification" />
            </div>

            <button onClick={() => setShowPasswordFields(!showPasswordFields)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "800", cursor: "pointer", marginBottom: "15px", display: "flex", alignItems: "center", gap: "5px" }}>
              {showPasswordFields ? "− Cancel Password Change" : "+ Change Password"}
            </button>

            {showPasswordFields && (
              <div style={{ padding: "15px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <input type="password" className="modern-input" placeholder="Current Password" style={{ fontSize: "0.85rem", marginBottom: "10px" }} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                <input type="password" className="modern-input" placeholder="New Password" style={{ fontSize: "0.85rem", marginBottom: "10px" }} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                <input type="password" className="modern-input" placeholder="Confirm New Password" style={{ fontSize: "0.85rem" }} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowEditModal(false); setShowPasswordFields(false); }}>Cancel</button>
              <button className="btn-primary" onClick={saveProfile} disabled={isUpdating}>
                {isUpdating ? "Syncing DB..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div style={{ padding: "0 5% 50px 5%" }}>
        <TeacherAnalytics />

        <div className="card">
          <div className="card-header" style={{ marginBottom: "25px" }}>
            <h3 style={{ margin: 0 }}>Create New Quiz</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Define your quiz settings and add your questions below.
            </p>
          </div>

          <div className="form-group">
            <label className="pro-label">Quiz Title</label>
            <input className="modern-input" placeholder="e.g., Introduction to React" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="pro-label">Description</label>
            <textarea className="modern-textarea" placeholder="What should students expect?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* TIME AND DURATION CONTROLS */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label className="pro-label">Start Date & Time</label>
              <input type="datetime-local" className="modern-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            
            <div style={{ flex: "1 1 200px" }}>
              <label className="pro-label">End Date & Time</label>
              <input type="datetime-local" className="modern-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <label className="pro-label">Quiz Duration (10-60 min)</label>
              <input 
                type="number" 
                className="modern-input" 
                min="10" 
                max="60" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                placeholder="Minutes"
              />
            </div>
          </div>

          {/* QUESTIONS SECTION */}
          <div className="questions-section">
            {questions.map((q, index) => (
              <div key={index} className="question-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>QUESTION {index + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => deleteQuestion(index)} style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "0.8rem" }}>
                      Remove
                    </button>
                  )}
                </div>

                <input className="modern-input" placeholder="Enter your question text..." value={q.question} onChange={(e) => handleQuestionChange(index, e.target.value)} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
                  {q.options.map((opt, i) => (
                    <input key={i} className="modern-input" style={{ marginBottom: 0 }} placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(index, i, e.target.value)} />
                  ))}
                </div>

                <label className="pro-label" style={{ fontSize: "0.8rem" }}>Correct Answer</label>
                <select className="modern-input" style={{ marginBottom: 0 }} value={q.correctAnswer} onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}>
                  <option value="">Choose the correct option...</option>
                  {q.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt || `Option ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* PUBLISHING SECTION */}
          <div style={{ marginTop: "30px", borderTop: "1px solid var(--border)", paddingTop: "25px", textAlign: "center" }}>
            {!generatedCode ? (
              <div style={{ display: "flex", gap: "15px" }}>
                <button className="btn-secondary" onClick={addQuestion} style={{ flex: 1 }}>+ Add Question</button>
                <button className="btn-primary" onClick={handlePublishQuiz} style={{ flex: 2, background: isPublishing ? "#94a3b8" : "linear-gradient(90deg, #6366f1, #a855f7)" }} disabled={isPublishing}>
                  {isPublishing ? "Launching Quiz..." : "Publish Quiz Now"}
                </button>
              </div>
            ) : (
              <div style={{ animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", background: "#ffffff", padding: "40px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)", maxWidth: "500px", margin: "0 auto" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>✨</div>
                <h3 style={{ margin: "0 0 10px 0", color: "#1e293b", fontWeight: "800" }}>Quiz Successfully Live!</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "25px" }}>Copy the unique code below to share with your students.</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <input value={generatedCode} readOnly style={{ flex: 1, padding: "12px 15px", fontSize: "1.2rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "700", textAlign: "center", background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: "12px", color: "#0f172a", outline: "none", letterSpacing: "2px" }} />
                  <button onClick={handleCopyCode} style={{ padding: "12px 20px", background: isCopied ? "#22c55e" : "#0f172a", color: "white", fontWeight: "700", borderRadius: "12px", border: "none", cursor: "pointer", minWidth: "110px" }}>
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button onClick={() => setGeneratedCode("")} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: "700", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}>
                  Create Another Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .question-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }
        .pro-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-main);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}