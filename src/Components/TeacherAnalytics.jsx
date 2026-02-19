import React, { useState, useEffect } from 'react';

export default function TeacherAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch all submissions for this teacher's quizzes
        const response = await fetch(`https://quiz-backend-1uzu.onrender.com/api/teacher-stats/${user?.id}`);
        const data = await response.json();
        
        if (response.ok) {
          const allSubmissions = data.submissions || [];
          setSubmissions(allSubmissions);

          // 2. Extract unique quizzes from the submissions to create selection buttons
          const uniqueQuizzes = [];
          const map = new Map();
          for (const item of allSubmissions) {
            if(!map.has(item.quizId)){
                map.set(item.quizId, true);
                uniqueQuizzes.push({
                    id: item.quizId,
                    title: item.quizTitle || "Untitled Quiz"
                });
            }
          }
          setQuizzes(uniqueQuizzes);
          
          // Auto-select the first quiz title found so the dashboard isn't empty
          if (uniqueQuizzes.length > 0) {
            setSelectedQuizId(uniqueQuizzes[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchAllData();
  }, [user?.id]);

  // Filter logic: This ensures the 1000+ students are filtered down to just the 60+ in the selected quiz
  const activeResults = submissions.filter(s => s.quizId === selectedQuizId);

  // Stats logic for the specific selected class
  const totalSubmissions = activeResults.length;
  const averageScore = activeResults.length 
    ? (activeResults.reduce((acc, curr) => acc + curr.score, 0) / (activeResults.length * activeResults[0].totalMarks) * 100).toFixed(1) 
    : 0;

  if (loading) return null;

  return (
    <div className="analytics-section" style={{ marginBottom: '40px' }}>
      
      {/* 1. QUIZ TITLE NAVIGATION (The "Folder" System) */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Choose Quiz Results to View
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {quizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => setSelectedQuizId(quiz.id)}
              style={{
                padding: '10px 22px',
                borderRadius: '30px',
                border: selectedQuizId === quiz.id ? '2px solid var(--primary)' : '2px solid #e2e8f0',
                background: selectedQuizId === quiz.id ? 'var(--primary)' : 'white',
                color: selectedQuizId === quiz.id ? 'white' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: selectedQuizId === quiz.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {quiz.title}
            </button>
          ))}
          {quizzes.length === 0 && <span style={{color: 'var(--text-muted)'}}>No quizzes found with attempts.</span>}
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', marginBottom: '35px' }} />

      {/* 2. DYNAMIC SUMMARY CARDS (Updates based on Title selected) */}
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        gap: '25px', 
        flexWrap: 'wrap',
        marginBottom: '40px' 
      }}>
        <div className="card" style={{ padding: '25px', border: '1px solid var(--border)', flex: '1', minWidth: '280px', textAlign: 'center', background: '#fff' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800' }}>STUDENTS ATTEMPTED</span>
          <h2 style={{ margin: '12px 0 0 0', fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>{totalSubmissions}</h2>
        </div>

        <div className="card" style={{ padding: '25px', border: '1px solid var(--border)', flex: '1', minWidth: '280px', textAlign: 'center', background: '#fff' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800' }}>CLASS AVERAGE</span>
          <h2 style={{ margin: '12px 0 0 0', fontSize: '2.5rem', fontWeight: '900', color: '#f59e0b' }}>{averageScore}%</h2>
        </div>
      </div>

      {/* 3. FILTERED LEADERBOARD */}
      <div className="card" style={{ padding: '25px', border: '1px solid var(--border)', background: '#fff' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Student Rankings</h4>
            <span style={{fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600'}}>
                Showing {totalSubmissions} records
            </span>
        </div>
        
        <div style={{ maxHeight: '450px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '15px' }}>Rank</th>
                <th style={{ padding: '15px' }}>Full Name</th>
                <th style={{ padding: '15px' }}>Score Result</th>
              </tr>
            </thead>
            <tbody>
              {[...activeResults].sort((a, b) => b.score - a.score).map((record, i) => (
                <tr key={record._id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '15px', fontWeight: '800', color: 'var(--primary)' }}>#{i + 1}</td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#1e293b' }}>
                    {i === 0 && '🥇 '}{i === 1 && '🥈 '}{i === 2 && '🥉 '}
                    {record.studentName}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '6px 14px', borderRadius: '20px',
                      background: (record.score/record.totalMarks) >= 0.4 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      fontWeight: '900', color: (record.score/record.totalMarks) >= 0.4 ? '#166534' : '#991b1b',
                      fontSize: '0.85rem', border: '1px solid transparent'
                    }}>
                      {record.score} / {record.totalMarks}
                    </span>
                  </td>
                </tr>
              ))}
              {activeResults.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No students have completed this quiz yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}