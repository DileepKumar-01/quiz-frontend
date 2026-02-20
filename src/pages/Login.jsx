import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
// ✅ IMPORT LOGO
import logo from "../assets/logo.png";

export default function Login() {
  const [role, setRole] = useState("student");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!regNo.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", {
        regNo: regNo.trim(),
        password: password.trim(),
        role
      });

      const data = response.data;
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.role === "teacher") {
          navigate("/teacherdashboard", { replace: true });
        } else if (data.user.role === "student") {
          navigate("/studentdashboard", { replace: true });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || "Server Error: Backend unreachable";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {/* ✅ ADDED LOGO HERE */}
        <img src={logo} alt="QuizPro" style={styles.logo} />
        <h2 style={{marginTop: 0, color: "#1e293b"}}>Welcome Back</h2>
        <p style={{color: "#64748b", marginBottom: "20px", fontSize: "0.9rem"}}>Please sign in to your account</p>
        
        <form onSubmit={handleLogin}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input} disabled={loading}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <input type="text" placeholder={role === "student" ? "Registration Number" : "Teacher ID"} value={regNo} onChange={(e) => setRegNo(e.target.value)} style={styles.input} disabled={loading} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} disabled={loading} />
          <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }} disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
        <p style={{fontSize: "0.9rem", color: "#64748b"}}>Don't have an account? <Link to="/register" style={{color: "#4f46e5", fontWeight: "600"}}>Register</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8fafc" },
  box: { background: "white", padding: "40px 30px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "350px", textAlign: "center" },
  logo: { width: "80px", marginBottom: "15px" }, // Logo size
  input: { width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box", fontSize: "0.95rem" },
  button: { width: "100%", padding: "12px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", marginTop: "10px", fontSize: "1rem" }
};