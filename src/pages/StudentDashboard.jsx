import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css"; // Make sure this CSS file is imported

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef(null);

  // Profile states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "Student",
    email: user?.email || "student@email.com",
    phone: user?.phone || "Not provided",
    photo: null
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [quizCode, setQuizCode] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mouse position tracking for glass card effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.glass-card-2026');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch student's quiz results
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchResults = async () => {
      try {
        // ✅ FIXED: Use the student-attempts endpoint instead of teacher-stats
        const response = await fetch(`https://quiz-backend-68mu.onrender.com/api/quiz/student-attempts/${user.regNo}`);
        const data = await response.json();
        if (response.ok) {
          setResults(data);
        } else {
          console.error("Failed to fetch results");
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, photo: reader.result });
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
      const response = await fetch(`https://quiz-backend-68mu.onrender.com/api/auth/update-profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          ...(showPasswordFields && {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        })
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(editForm);
        localStorage.setItem("user", JSON.stringify({ ...user, ...editForm }));
        alert("Profile updated successfully!");
        setShowEditModal(false);
        setShowDropdown(false);
        setShowPasswordFields(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Update failed. Check current password.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Network error. Could not connect to server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleStartQuiz = () => {
    if (!quizCode.trim()) {
      alert("Please enter a quiz code");
      return;
    }
    navigate(`/quiz/${quizCode.toUpperCase()}`);
  };

  if (!user) return null;

  return (
    <div className="student-container">
      {/* Navigation Bar */}
      <nav className="student-nav">
        <div className="nav-brand" onClick={() => navigate("/studentdashboard")}>
          <div className="logo-icon">QP</div>
          <h2>Quiz<span style={{ background: "var(--primary-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Pro</span></h2>
        </div>

        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="student-name">{profile.name}</span>
            <div className="avatar-circle">
              {profile.photo ? <img src={profile.photo} alt="DP" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.name.charAt(0)}
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
                <div className="info-row"><span>📞</span> {profile.phone}</div>
                <div className="info-row"><span>📚</span> {user.regNo || "Not set"}</div>
              </div>
              <button className="edit-profile-btn" onClick={() => { setShowEditModal(true); setEditForm(profile); }}>Edit Profile</button>
              <button className="logout-link" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: "0 5% 50px 5%" }}>
        {/* Quiz Entry Card */}
        <div className="glass-card-2026 quiz-entry-card">
          <div className="card-header">
            <h3>Enter Quiz Code</h3>
            <p>Enter the code provided by your instructor to begin your assessment.</p>
          </div>
          <div className="form-group">
            <input
              className="modern-input"
              placeholder="e.g., QZABCDEFGH"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleStartQuiz()}
            />
          </div>
          <button className="btn-primary" onClick={handleStartQuiz}>
            Start Assessment
          </button>
        </div>

        {/* Results Card */}
        <div className="glass-card-2026 results-card">
          <div className="results-header">
            <h3>My Result History</h3>
            <span className="quiz-count-badge">Total Quizzes: {results.length}</span>
          </div>

          {loading ? (
            <div className="loading-container" style={{ minHeight: "200px" }}>
              <div className="loading-spinner"></div>
              <p>Loading your results...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Score</th>
                    <th>Performance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => {
                    const percentage = Math.round((item.score / item.totalMarks) * 100);
                    const isPass = percentage >= 50;
                    return (
                      <tr key={index}>
                        <td>{item.quizId?.title || "Deleted Quiz"}</td>
                        <td>{item.score} / {item.totalMarks}</td>
                        <td>
                          <div className="progress-container">
                            <div className="progress-bar-bg">
                              <div className={`progress-fill ${isPass ? "success" : "error"}`} style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="percentage-text">{percentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${isPass ? "passed" : "failed"}`}>
                            {isPass ? "PASSED" : "RETAKE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No quiz results found. Complete a quiz to see your performance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>Account Settings</h3>

            <div className="photo-upload-section" onClick={() => fileInputRef.current.click()}>
              <div className="avatar-large">
                {editForm.photo ? <img src={editForm.photo} alt="Preview" /> : editForm.name.charAt(0)}
                <div className="photo-overlay">Change Photo</div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="modal-inputs">
              <input
                className="modern-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full Name"
              />
              <input
                className="modern-input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email"
              />
              <input
                className="modern-input"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Phone Number"
              />
            </div>

            <button className="toggle-password-btn" onClick={() => setShowPasswordFields(!showPasswordFields)}>
              {showPasswordFields ? "− Cancel Password Change" : "+ Change Password"}
            </button>

            {showPasswordFields && (
              <div className="password-section">
                <input
                  type="password"
                  className="modern-input"
                  placeholder="Current Password"
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <input
                  type="password"
                  className="modern-input"
                  placeholder="New Password"
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <input
                  type="password"
                  className="modern-input"
                  placeholder="Confirm New Password"
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
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