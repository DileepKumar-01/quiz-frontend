import React, { useState, useEffect } from 'react';

export default function TeacherAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    averageScore: 0,
    passRate: 0,
    highestScore: 0,
    lowestScore: 0
  });
  
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`https://quiz-backend-68mu.onrender.com/api/quiz/teacher-stats/${user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          const allSubmissions = data.submissions || [];
          setSubmissions(allSubmissions);

          const uniqueQuizzesMap = new Map();
          for (const item of allSubmissions) {
            if (!uniqueQuizzesMap.has(item.quizId)) {
              uniqueQuizzesMap.set(item.quizId, {
                id: item.quizId,
                title: item.quizTitle || "Untitled Quiz",
                totalMarks: item.totalMarks
              });
            }
          }
          
          const uniqueQuizzes = Array.from(uniqueQuizzesMap.values());
          setQuizzes(uniqueQuizzes);
          
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

    fetchAllData();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedQuizId || submissions.length === 0) {
      setStats({
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0
      });
      return;
    }

    const activeResults = submissions.filter(s => s.quizId === selectedQuizId);
    const totalSubmissions = activeResults.length;
    
    if (totalSubmissions === 0) {
      setStats({
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0
      });
      return;
    }

    const scores = activeResults.map(r => r.score);
    const maxPossibleScore = activeResults[0]?.totalMarks || 1;
    const averageScore = (scores.reduce((a, b) => a + b, 0) / totalSubmissions / maxPossibleScore * 100).toFixed(1);
    
    const passedCount = activeResults.filter(r => (r.score / r.totalMarks) >= 0.5).length;
    const passRate = (passedCount / totalSubmissions * 100).toFixed(1);
    
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    setStats({
      totalSubmissions,
      averageScore,
      passRate,
      highestScore,
      lowestScore
    });
  }, [selectedQuizId, submissions]);

  const activeResults = selectedQuizId 
    ? submissions.filter(s => s.quizId === selectedQuizId)
    : [];

  // Get selected quiz title
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  if (loading) {
    return (
      <div className="analytics-section" style={{ marginBottom: '40px', textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="analytics-section" style={{ marginBottom: '40px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
          <h3 style={{ marginBottom: '10px' }}>No Analytics Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Create quizzes and share them with students. Once students submit their answers,<br />
            you'll see detailed analytics here including scores, rankings, and performance metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-section" style={{ marginBottom: '40px' }}>
      
      {/* Quiz Selection - DROPDOWN STYLE */}
      <div style={{ 
        marginBottom: '30px',
        background: 'white',
        borderRadius: '20px',
        padding: '20px 24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <label style={{ 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '8px'
            }}>
              📊 Select Quiz
            </label>
            <div style={{ position: 'relative', minWidth: '250px' }}>
              <select
                value={selectedQuizId || ''}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid var(--border)',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              >
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    📋 {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedQuiz && (
            <div style={{ 
              padding: '8px 16px',
              background: 'var(--primary-light)',
              borderRadius: '12px',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              Total Submissions: {stats.totalSubmissions}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {selectedQuizId && activeResults.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                {stats.totalSubmissions}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Submissions</div>
            </div>

            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>
                {stats.averageScore}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Score</div>
            </div>

            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>
                {stats.passRate}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pass Rate</div>
            </div>

            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6' }}>
                {stats.highestScore}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest Score</div>
            </div>
          </div>

          {/* Student Rankings Table - Compact Design */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  📋 Student Rankings - {selectedQuiz?.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Total: {stats.totalSubmissions} student(s)
                </span>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>RANK</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>STUDENT NAME</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>SCORE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>PERCENTAGE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeResults]
                    .sort((a, b) => b.score - a.score)
                    .map((record, index) => {
                      const percentage = Math.round((record.score / record.totalMarks) * 100);
                      const isPassed = percentage >= 50;
                      const rank = index + 1;
                      
                      let rankDisplay = `#${rank}`;
                      let rankIcon = '';
                      if (rank === 1) rankIcon = '🥇 ';
                      else if (rank === 2) rankIcon = '🥈 ';
                      else if (rank === 3) rankIcon = '🥉 ';
                      
                      return (
                        <tr 
                          key={record._id || index} 
                          style={{ 
                            borderBottom: '1px solid var(--border-light)',
                            transition: 'background 0.2s'
                          }}
                          className="table-row-hover"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: rank <= 3 ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {rankIcon}{rankDisplay}
                           </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            {record.studentName}
                           </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center', fontSize: '0.85rem' }}>
                            {record.score} / {record.totalMarks}
                           </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                              <div style={{ 
                                width: '60px', 
                                height: '5px', 
                                background: '#e2e8f0', 
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{ 
                                  width: `${percentage}%`, 
                                  height: '100%', 
                                  background: isPassed ? '#10b981' : '#ef4444',
                                  borderRadius: '3px'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', minWidth: '35px' }}>
                                {percentage}%
                              </span>
                            </div>
                           </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              background: isPassed ? '#dcfce7' : '#fee2e2',
                              color: isPassed ? '#166534' : '#991b1b',
                              display: 'inline-block'
                            }}>
                              {isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                           </td>
                         </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No submissions for selected quiz */}
      {selectedQuizId && activeResults.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
          <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>No Submissions Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No students have completed this quiz yet. Once they submit, you'll see their scores here.
          </p>
        </div>
      )}

      <style>{`
        .table-row-hover {
          transition: background 0.2s ease;
        }
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.08);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-spinner {
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        select:hover {
          border-color: var(--primary);
        }
        select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </div>
  );
}