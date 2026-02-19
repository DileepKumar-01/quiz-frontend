import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css"; // Reuse existing styles for consistency
import StudentDashboard from "./pages/StudentDashboard";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef(null);

  // ================= PROFILE STATES =================
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false); // Toggle for password section
  const [isUpdating, setIsUpdating] = useState(false); // Click feel feedback

  const [profile, setProfile] = useState({
    name: user?.name || "Student",
    email: user?.email || "student@email.com",
    phone: user?.phone || "Not provided",
    institution: user?.institution || "Not provided",
    photo: null 
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [quizCode, setQuizCode] = useState("");

  // ================= NEW: RESULTS STATE =================
  const [results, setResults] = useState([]);

  // ================= SIDE EFFECTS =================
  useEffect(() => {
    if (!user) navigate("/");
    
    // NEW: Fetch Student Results
    const fetchResults = async () => {
      try {
        const response = await fetch(`https://quiz-backend-1uzu.onrender.com/api/student-results/${user?.id}`);
        const data = await response.json();
        if (response.ok) {
          setResults(data);
        }
      } catch (err) {
        console.error("Failed to fetch results history");
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

  // ================= LOGIC =================
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    // Password matching validation
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

    setIsUpdating(true); // Start "Click Feel" loading state

    try {
      // FIXED BACKEND SYNC: URL now includes /${user.id} to match backend params
      const response = await fetch(`https://quiz-backend-1uzu.onrender.com/api/update-profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, // Keeping this in body just in case, though backend uses params
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
        // Sync local storage so login session is updated
        localStorage.setItem("user", JSON.stringify({ ...user, ...editForm }));
        alert("Profile and data successfully updated in server!");
        
        // Reset states
        setShowEditModal(false);
        setShowDropdown(false);
        setShowPasswordFields(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Update failed. Check current password.");
      }
    } catch (error) {
      // Detailed error logging for debugging
      console.error("Network Error:", error);
      alert("Network error. Could not connect to DB. Check if backend is live.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* NAVBAR MATCHING TEACHER VIEW */}
      <nav className="navbar">
        <h2 style={{margin: 0}}>Quiz<span style={{color: 'var(--primary)'}}>Pro</span></h2>
        
        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
             <span className="instructor-name">Student: {profile.name}</span>
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
               </div>
               <button className="edit-profile-btn" onClick={() => {setShowEditModal(true); setEditForm(profile);}}>Edit Profile</button>
               <button className="logout-link" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="profile-modal" style={{maxWidth: '450px'}}>
            <h3 style={{marginBottom: '20px', fontSize: '1.1rem'}}>Account Settings</h3>
            
            <div className="photo-upload-section">
              <div className="avatar-large" style={{cursor: 'pointer', width: '80px', height: '80px'}} onClick={() => fileInputRef.current.click()}>
                {editForm.photo ? <img src={editForm.photo} alt="Preview" /> : editForm.name.charAt(0)}
                <div className="photo-overlay" style={{fontSize: '0.65rem'}}>Change</div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>
            
            <div className="modal-inputs">
              <label style={{fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginLeft: '5px'}}>FULL NAME</label>
              <input className="modern-input" style={{fontSize: '0.9rem'}} value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} placeholder="Full Name" />
              
              <label style={{fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginLeft: '5px'}}>EMAIL ADDRESS</label>
              <input className="modern-input" style={{fontSize: '0.9rem'}} value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} placeholder="Email" />
              
              <label style={{fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginLeft: '5px'}}>PHONE NUMBER</label>
              <input className="modern-input" style={{fontSize: '0.9rem'}} value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone Number" />
            </div>

            {/* PASSWORD CHANGE TOGGLE */}
            <button 
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)', 
                fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', 
                marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              {showPasswordFields ? "− Cancel Password Change" : "+ Change Password"}
            </button>

            {showPasswordFields && (
              <div style={{padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
                <input 
                  type="password" 
                  className="modern-input" 
                  placeholder="Current Password" 
                  style={{fontSize: '0.85rem', marginBottom: '10px'}}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                />
                <input 
                  type="password" 
                  className="modern-input" 
                  placeholder="New Password" 
                  style={{fontSize: '0.85rem', marginBottom: '10px'}}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                />
                <input 
                  type="password" 
                  className="modern-input" 
                  placeholder="Confirm New Password" 
                  style={{fontSize: '0.85rem'}}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                />
              </div>
            )}

            <div className="modal-actions" style={{borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}>
              <button className="btn-secondary" onClick={() => { setShowEditModal(false); setShowPasswordFields(false); }}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={saveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? "Syncing..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{padding: '0 5% 50px 5%', marginTop: '40px'}}>
        
        {/* QUIZ ENTRY CARD */}
        <div className="card" style={{maxWidth: '600px', margin: '0 auto 40px auto', textAlign: 'center'}}>
          <div className="card-header" style={{marginBottom: '25px'}}>
            <h3 style={{margin: 0}}>Enter Quiz Code</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Enter the code provided by your instructor to begin your assessment.</p>
          </div>

          <div className="form-group">
            <input 
              className="modern-input" 
              style={{textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '2px'}}
              placeholder="e.g., QUIZ123" 
              value={quizCode} 
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())} 
            />
          </div>

          <button 
            className="btn-primary" 
            style={{width: '100%', marginTop: '10px'}}
            onClick={() => navigate(`/quiz/${quizCode}`)}
          >
            Start Assessment
          </button>
        </div>

        {/* PERFORMANCE ANALYTICS */}
        <div className="card" style={{marginTop: '30px'}}>
          <div className="card-header" style={{marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{margin: 0}}>My Result History</h3>
            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600'}}>Total Quizzes: {results.length}</span>
          </div>

          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #f1f5f9'}}>
                  <th style={{padding: '12px 15px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Quiz Title</th>
                  <th style={{padding: '12px 15px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Score</th>
                  <th style={{padding: '12px 15px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Performance</th>
                  <th style={{padding: '12px 15px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? results.map((item, index) => {
                  const percentage = Math.round((item.score / item.totalQuestions) * 100);
                  const isPass = percentage >= 50;

                  return (
                    <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={{padding: '15px', fontWeight: '700', color: '#1e293b'}}>{item.quizTitle}</td>
                      <td style={{padding: '15px', color: '#475569'}}>{item.score} / {item.totalQuestions}</td>
                      <td style={{padding: '15px', width: '30%'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <div style={{flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden'}}>
                            <div style={{
                              width: `${percentage}%`, 
                              height: '100%', 
                              background: isPass ? '#22c55e' : '#ef4444',
                              transition: 'width 1s ease-in-out'
                            }}></div>
                          </div>
                          <span style={{fontSize: '0.8rem', fontWeight: '800', minWidth: '35px'}}>{percentage}%</span>
                        </div>
                      </td>
                      <td style={{padding: '15px'}}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          background: isPass ? '#dcfce7' : '#fee2e2',
                          color: isPass ? '#166534' : '#991b1b'
                        }}>
                          {isPass ? 'PASSED' : 'RETAKE'}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" style={{padding: '50px', textAlign: 'center', color: '#94a3b8'}}>
                      No quiz results found. Complete a quiz to see your performance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}